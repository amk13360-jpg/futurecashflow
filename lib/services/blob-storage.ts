import { BlobServiceClient, ContainerClient } from "@azure/storage-blob"
import { randomUUID } from "crypto"

// Azure Blob Storage configuration
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || ""
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "cession-agreements"

// Lazy initialization of blob service client
let blobServiceClient: BlobServiceClient | null = null
let containerClient: ContainerClient | null = null

function getBlobServiceClient(): BlobServiceClient {
  if (!blobServiceClient) {
    if (!connectionString) {
      throw new Error("AZURE_STORAGE_CONNECTION_STRING environment variable is not set")
    }
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  }
  return blobServiceClient
}

async function getContainerClient(): Promise<ContainerClient> {
  if (!containerClient) {
    const serviceClient = getBlobServiceClient()
    containerClient = serviceClient.getContainerClient(containerName)
    
    // Create container if it doesn't exist
    const exists = await containerClient.exists()
    if (!exists) {
      await containerClient.create({
        access: "blob", // Allow public read access to blobs
      })
      console.log(`[Blob Storage] Created container: ${containerName}`)
    }
  }
  return containerClient
}

/**
 * Upload a file to Azure Blob Storage
 * @param file - The file buffer to upload
 * @param fileName - Original file name
 * @param supplierId - The supplier ID for organizing files
 * @returns The public URL of the uploaded blob
 */
export async function uploadToBlobStorage(
  file: Buffer,
  fileName: string,
  supplierId: number
): Promise<string> {
  try {
    const container = await getContainerClient()
    
    // Create a unique blob name
    const uniqueName = `${supplierId}-${Date.now()}-${randomUUID()}-${fileName}`
    const blockBlobClient = container.getBlockBlobClient(uniqueName)
    
    // Determine content type
    const contentType = fileName.endsWith(".pdf") 
      ? "application/pdf" 
      : "application/octet-stream"
    
    // Upload the file
    await blockBlobClient.upload(file, file.length, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    })
    
    console.log(`[Blob Storage] Uploaded: ${uniqueName}`)
    
    // Return the public URL
    return blockBlobClient.url
  } catch (error) {
    console.error("[Blob Storage] Upload error:", error)
    throw error
  }
}

/**
 * Delete a blob from Azure Blob Storage
 * @param blobUrl - The URL of the blob to delete
 */
export async function deleteFromBlobStorage(blobUrl: string): Promise<void> {
  try {
    const container = await getContainerClient()
    
    // Extract blob name from URL
    const url = new URL(blobUrl)
    const blobName = url.pathname.split("/").pop()
    
    if (blobName) {
      const blockBlobClient = container.getBlockBlobClient(blobName)
      await blockBlobClient.deleteIfExists()
      console.log(`[Blob Storage] Deleted: ${blobName}`)
    }
  } catch (error) {
    console.error("[Blob Storage] Delete error:", error)
    // Don't throw - deletion failure shouldn't break the flow
  }
}

/**
 * Check if Azure Blob Storage is configured
 */
export function isBlobStorageConfigured(): boolean {
  return !!process.env.AZURE_STORAGE_CONNECTION_STRING
}
