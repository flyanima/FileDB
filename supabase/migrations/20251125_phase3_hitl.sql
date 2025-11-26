-- Phase 3.5: HITL Review Mechanism
-- Create extraction_results table to store AI extraction results before user approval

CREATE TABLE IF NOT EXISTS extraction_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    document_id UUID REFERENCES documents (id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL, -- invoice, contract, bank_statement, payroll_record
    extracted_data JSONB NOT NULL, -- AI raw output
    user_corrections JSONB, -- User edits (if any)
    status VARCHAR(50) DEFAULT 'pending_review', -- pending_review, approved, rejected
    confidence_score FLOAT, -- Optional: AI confidence
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by VARCHAR(255)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_extraction_results_document_id ON extraction_results (document_id);

CREATE INDEX IF NOT EXISTS idx_extraction_results_status ON extraction_results (status);

-- Update documents table to add new status
-- Status flow: uploaded -> processing -> extracted -> reviewed
-- (No schema change needed, just using existing status field)