-- 1. Create Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    company_id UUID REFERENCES companies (id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'uploaded', -- uploaded, processing, parsed, error
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Link Business Tables to Documents
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES documents (id) ON DELETE SET NULL;

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES documents (id) ON DELETE SET NULL;

ALTER TABLE bank_statements
ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES documents (id) ON DELETE SET NULL;

ALTER TABLE payroll_records
ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES documents (id) ON DELETE SET NULL;

-- 3. Setup Storage Bucket (Try to create if not exists)
-- Note: This requires permissions on storage.buckets. If this fails, user might need to do it in dashboard.
INSERT INTO
    storage.buckets (id, name, public)
VALUES (
        'raw-files',
        'raw-files',
        true
    ) ON CONFLICT (id) DO NOTHING;

-- 4. Storage Policies (Simplified for MVP - Allow all for authenticated/service role)
-- We need to enable RLS on objects to use policies, but for now let's assume standard setup.
-- If RLS is enabled on storage.objects, we need policies.
-- Let's try to add a policy for public read if it's a public bucket.
CREATE POLICY "Public Access" ON storage.objects FOR
SELECT USING (bucket_id = 'raw-files');

CREATE POLICY "Authenticated Upload" ON storage.objects FOR
INSERT
WITH
    CHECK (bucket_id = 'raw-files');