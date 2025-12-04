'use server';

import { query } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/lib/auth/audit';
import { uploadToBlobStorage, deleteFromBlobStorage, isBlobStorageConfigured } from '@/lib/services/blob-storage';
import { randomUUID } from 'crypto';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';

// ============================================================================
// Types
// ============================================================================

export type BuyerDocumentType = 
  | 'cipc_certificate'
  | 'tax_clearance'
  | 'financial_statements'
  | 'bank_confirmation'
  | 'trade_references'
  | 'director_id'
  | 'resolution'
  | 'other';

export interface BuyerDocument {
  document_id: number;
  buyer_id: number;
  document_type: BuyerDocumentType;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_by: number;
  uploaded_at: Date;
  verified_by: number | null;
  verified_at: Date | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  rejection_reason: string | null;
  expiry_date: Date | null;
}

export interface UploadBuyerDocumentInput {
  buyer_id: number;
  document_type: BuyerDocumentType;
  file_name: string;
  file_data: string; // Base64 encoded
  expiry_date?: string;
}

// ============================================================================
// Upload Document
// ============================================================================

export async function uploadBuyerDocument(input: UploadBuyerDocumentInput): Promise<{ 
  success: boolean; 
  documentId?: number;
  message?: string 
}> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    // Check buyer exists
    const buyers = await query(
      'SELECT buyer_id, name FROM buyers WHERE buyer_id = ?',
      [input.buyer_id]
    ) as any[];

    if (buyers.length === 0) {
      return { success: false, message: 'Buyer not found' };
    }

    // Decode base64 file
    const base64Data = input.file_data.replace(/^data:.*?;base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');
    const fileSize = fileBuffer.length;

    // Upload file
    let fileUrl: string;
    
    if (isBlobStorageConfigured()) {
      // Upload to Azure Blob Storage
      fileUrl = await uploadToBlobStorageForBuyer(fileBuffer, input.file_name, input.buyer_id);
    } else {
      // Local development fallback
      fileUrl = await uploadLocalForBuyer(fileBuffer, input.file_name, input.buyer_id);
    }

    // Save to database
    const result = await query(
      `INSERT INTO buyer_documents (
        buyer_id, document_type, file_name, file_url, file_size,
        uploaded_by, verification_status, expiry_date
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        input.buyer_id,
        input.document_type,
        input.file_name,
        fileUrl,
        fileSize,
        session.userId,
        input.expiry_date || null
      ]
    ) as any;

    const documentId = result.insertId;

    // Log to change log
    await query(
      `INSERT INTO buyer_change_log (buyer_id, field_name, old_value, new_value, changed_by)
       VALUES (?, 'document_upload', NULL, ?, ?)`,
      [input.buyer_id, `${input.document_type}: ${input.file_name}`, session.userId]
    );

    // Audit log
    await createAuditLog({
      userId: session.userId,
      userType: 'admin',
      action: 'UPLOAD_BUYER_DOCUMENT',
      entityType: 'buyer_document',
      entityId: documentId,
      details: JSON.stringify({
        buyer_id: input.buyer_id,
        document_type: input.document_type,
        file_name: input.file_name
      })
    });

    revalidatePath(`/admin/buyers/${input.buyer_id}`);

    return { success: true, documentId, message: 'Document uploaded successfully' };
  } catch (error) {
    console.error('Error uploading buyer document:', error);
    return { success: false, message: 'Failed to upload document' };
  }
}

// ============================================================================
// Upload Helpers
// ============================================================================

async function uploadToBlobStorageForBuyer(
  file: Buffer,
  fileName: string,
  buyerId: number
): Promise<string> {
  // Reuse the existing blob storage function but for buyer-documents container
  // Note: This will use the same container, but with a buyer-documents prefix
  const uniqueName = `buyer-docs/${buyerId}/${Date.now()}-${randomUUID()}-${fileName}`;
  
  // For now, use the existing function - in production, you might want a separate container
  return await uploadToBlobStorage(file, `buyer-${buyerId}-${fileName}`, buyerId);
}

async function uploadLocalForBuyer(
  file: Buffer,
  fileName: string,
  buyerId: number
): Promise<string> {
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'buyer-documents', String(buyerId));
  await mkdir(uploadDir, { recursive: true });
  
  const uniqueName = `${Date.now()}-${randomUUID()}-${fileName}`;
  const filePath = join(uploadDir, uniqueName);
  
  await writeFile(filePath, file);
  
  return `/uploads/buyer-documents/${buyerId}/${uniqueName}`;
}

// ============================================================================
// Verify Document
// ============================================================================

export async function verifyBuyerDocument(
  documentId: number, 
  verified: boolean,
  rejectionReason?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    // Get document
    const docs = await query(
      'SELECT * FROM buyer_documents WHERE document_id = ?',
      [documentId]
    ) as any[];

    if (docs.length === 0) {
      return { success: false, message: 'Document not found' };
    }

    const doc = docs[0];
    const newStatus = verified ? 'verified' : 'rejected';

    await query(
      `UPDATE buyer_documents SET 
        verification_status = ?,
        verified_by = ?,
        verified_at = NOW(),
        rejection_reason = ?
       WHERE document_id = ?`,
      [newStatus, session.userId, verified ? null : rejectionReason, documentId]
    );

    // Log to change log
    await query(
      `INSERT INTO buyer_change_log (buyer_id, field_name, old_value, new_value, changed_by)
       VALUES (?, 'document_verification', ?, ?, ?)`,
      [doc.buyer_id, 'pending', newStatus, session.userId]
    );

    await createAuditLog({
      userId: session.userId,
      userType: 'admin',
      action: verified ? 'VERIFY_BUYER_DOCUMENT' : 'REJECT_BUYER_DOCUMENT',
      entityType: 'buyer_document',
      entityId: documentId,
      details: JSON.stringify({ 
        document_type: doc.document_type,
        rejection_reason: rejectionReason
      })
    });

    revalidatePath(`/admin/buyers/${doc.buyer_id}`);

    return { 
      success: true, 
      message: verified ? 'Document verified' : 'Document rejected' 
    };
  } catch (error) {
    console.error('Error verifying buyer document:', error);
    return { success: false, message: 'Failed to verify document' };
  }
}

// ============================================================================
// Delete Document
// ============================================================================

export async function deleteBuyerDocument(documentId: number): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    // Get document
    const docs = await query(
      'SELECT * FROM buyer_documents WHERE document_id = ?',
      [documentId]
    ) as any[];

    if (docs.length === 0) {
      return { success: false, message: 'Document not found' };
    }

    const doc = docs[0];

    // Delete from storage
    if (doc.file_url.startsWith('http')) {
      // Azure Blob Storage
      await deleteFromBlobStorage(doc.file_url);
    } else {
      // Local file
      try {
        const localPath = join(process.cwd(), 'public', doc.file_url);
        await unlink(localPath);
      } catch (e) {
        console.error('Failed to delete local file:', e);
      }
    }

    // Delete from database
    await query('DELETE FROM buyer_documents WHERE document_id = ?', [documentId]);

    // Log to change log
    await query(
      `INSERT INTO buyer_change_log (buyer_id, field_name, old_value, new_value, changed_by)
       VALUES (?, 'document_delete', ?, NULL, ?)`,
      [doc.buyer_id, `${doc.document_type}: ${doc.file_name}`, session.userId]
    );

    await createAuditLog({
      userId: session.userId,
      userType: 'admin',
      action: 'DELETE_BUYER_DOCUMENT',
      entityType: 'buyer_document',
      entityId: documentId,
      details: JSON.stringify({ 
        document_type: doc.document_type,
        file_name: doc.file_name
      })
    });

    revalidatePath(`/admin/buyers/${doc.buyer_id}`);

    return { success: true, message: 'Document deleted' };
  } catch (error) {
    console.error('Error deleting buyer document:', error);
    return { success: false, message: 'Failed to delete document' };
  }
}

// ============================================================================
// Get Documents
// ============================================================================

export async function getBuyerDocuments(buyerId: number): Promise<{ 
  success: boolean; 
  data?: BuyerDocument[];
  message?: string 
}> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: 'Unauthorized' };
    }

    const docs = await query(
      `SELECT bd.*, 
        u.full_name as uploaded_by_name,
        v.full_name as verified_by_name
       FROM buyer_documents bd
       LEFT JOIN users u ON bd.uploaded_by = u.user_id
       LEFT JOIN users v ON bd.verified_by = v.user_id
       WHERE bd.buyer_id = ?
       ORDER BY bd.uploaded_at DESC`,
      [buyerId]
    ) as BuyerDocument[];

    return { success: true, data: docs };
  } catch (error) {
    console.error('Error getting buyer documents:', error);
    return { success: false, message: 'Failed to get documents' };
  }
}
