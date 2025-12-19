-- =====================================================
-- Supabase PostgreSQL Schema for Chat with Database
-- =====================================================
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- Reference: https://supabase.com/docs/guides/database/overview

-- =====================================================
-- 1. User Datasets Table
-- =====================================================
-- Stores metadata about uploaded CSV files
CREATE TABLE IF NOT EXISTS user_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dataset_name TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL, -- Path in Supabase Storage
    table_name TEXT NOT NULL, -- Generated unique table name for the data
    column_names TEXT[] NOT NULL, -- Array of column names
    row_count INTEGER NOT NULL DEFAULT 0,
    file_size_bytes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_dataset_name UNIQUE(user_id, dataset_name)
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_user_datasets_user_id ON user_datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_datasets_table_name ON user_datasets(table_name);

-- Enable Row Level Security
ALTER TABLE user_datasets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own datasets
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security
CREATE POLICY "Users can view own datasets" 
ON user_datasets FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own datasets
CREATE POLICY "Users can insert own datasets" 
ON user_datasets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only update their own datasets
CREATE POLICY "Users can update own datasets" 
ON user_datasets FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own datasets
CREATE POLICY "Users can delete own datasets" 
ON user_datasets FOR DELETE 
USING (auth.uid() = user_id);

-- =====================================================
-- 2. Query History Table
-- =====================================================
-- Stores user questions and AI-generated responses
CREATE TABLE IF NOT EXISTS query_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dataset_id UUID NOT NULL REFERENCES user_datasets(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    generated_sql TEXT NOT NULL,
    result_data JSONB, -- Store query results as JSON
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON query_history(user_id);
CREATE INDEX IF NOT EXISTS idx_query_history_dataset_id ON query_history(dataset_id);
CREATE INDEX IF NOT EXISTS idx_query_history_created_at ON query_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE query_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own query history
CREATE POLICY "Users can view own query history" 
ON query_history FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own queries
CREATE POLICY "Users can insert own queries" 
ON query_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. Function to Update updated_at Timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_datasets
CREATE TRIGGER update_user_datasets_updated_at 
BEFORE UPDATE ON user_datasets 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. Storage Bucket for CSV Files
-- =====================================================
-- Create storage bucket via SQL
-- Reference: https://supabase.com/docs/guides/storage/security

-- Insert storage bucket (run this if bucket doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-datasets', 'user-datasets', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 5. Storage Security Policies
-- =====================================================
-- Users can only upload files to their own folder (user_id prefix)
-- Reference: https://supabase.com/docs/guides/storage/security/access-control

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'user-datasets' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'user-datasets' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'user-datasets' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'user-datasets' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- 6. Helper Function: Get User's Datasets
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_datasets(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    dataset_name TEXT,
    original_filename TEXT,
    table_name TEXT,
    column_names TEXT[],
    row_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ud.id,
        ud.dataset_name,
        ud.original_filename,
        ud.table_name,
        ud.column_names,
        ud.row_count,
        ud.created_at
    FROM user_datasets ud
    WHERE ud.user_id = p_user_id
    ORDER BY ud.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. Helper Function: Get Query History for Dataset
-- =====================================================
CREATE OR REPLACE FUNCTION get_dataset_query_history(
    p_user_id UUID,
    p_dataset_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    question TEXT,
    generated_sql TEXT,
    success BOOLEAN,
    confidence_score DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qh.id,
        qh.question,
        qh.generated_sql,
        qh.success,
        qh.confidence_score,
        qh.created_at
    FROM query_history qh
    WHERE qh.user_id = p_user_id 
        AND qh.dataset_id = p_dataset_id
    ORDER BY qh.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Setup Complete!
-- =====================================================
-- Next Steps:
-- 1. Enable authentication providers in Supabase Dashboard
--    https://supabase.com/docs/guides/auth/social-login
-- 2. Configure OAuth redirect URLs for your app
-- 3. Test RLS policies by creating a test user
-- 4. Verify storage bucket and policies work correctly

-- To verify RLS is working, try these queries as a test user:
-- SELECT * FROM user_datasets; -- Should only show your datasets
-- SELECT * FROM query_history; -- Should only show your queries
-- =====================================================
-- 4. Contact Messages Table (Optional)
-- =====================================================
-- Stores contact form submissions for support/inquiries
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Create index for filtering by status and created date
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Enable Row Level Security (make it publicly insertable for contact forms)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can insert contact messages (for public contact form)
CREATE POLICY "Anyone can submit contact messages" 
ON contact_messages FOR INSERT 
WITH CHECK (true);

-- RLS Policy: Only admins can read contact messages (optional - adjust as needed)
-- For now, we'll disable read access via RLS (manage via backend/admin dashboard)
CREATE POLICY "No public read access to contact messages" 
ON contact_messages FOR SELECT 
USING (false); -- Only service role can read