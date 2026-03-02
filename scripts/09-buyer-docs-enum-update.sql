-- Migration: 09-buyer-docs-enum-update.sql
-- Description: Extend buyer_documents.document_type ENUM to include
--              mine-specific document types added to the UI in sprint 2.
-- Safe to re-run: MODIFY COLUMN with the full ENUM list is idempotent if same.

ALTER TABLE buyer_documents
  MODIFY COLUMN document_type ENUM(
    'cipc_certificate',
    'tax_clearance',
    'financial_statements',
    'bank_confirmation',
    'trade_references',
    'director_id',
    'resolution',
    'mine_permit',
    'environmental_clearance',
    'royalty_agreement',
    'supply_agreement',
    'other'
  ) NOT NULL;
