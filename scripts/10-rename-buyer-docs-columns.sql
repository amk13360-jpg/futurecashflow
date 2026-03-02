-- Migration: 10-rename-buyer-docs-columns.sql
-- Description: Rename buyer_documents columns to match backend code expectations.
--   document_name  → file_name   (used in all server actions as file_name)
--   blob_url       → file_url    (used in all server actions as file_url)
-- Safe: CHANGE COLUMN preserves data.

ALTER TABLE buyer_documents
  CHANGE COLUMN document_name  file_name  VARCHAR(255) NOT NULL,
  CHANGE COLUMN blob_url       file_url   VARCHAR(500) NOT NULL;
