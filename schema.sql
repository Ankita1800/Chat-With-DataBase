-- =====================================================
-- Chat with Database - Complete Database Schema
-- =====================================================
-- Version: 2.0 (with hash-based duplicate detection)
-- Run this ONCE in Supabase SQL Editor
-- Reference: https://supabase.com/docs/guides/database/overview
--
-- IMPORTANT: This will DROP all existing tables if they exist
-- Only run this for a fresh start or in a new project
-- =====================================================

-- =====================================================
-- CLEANUP: Drop existing tables (fresh start)
-- =====================================================
DROP TABLE IF EXISTS query_history CASCADE;
DROP TABLE IF EXISTS user_datasets CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_user_datasets(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_dataset_query_history(UUID, UUID, INTEGER) CASCADE;

-- =====================================================
-- TABLE 1: user_datasets
-- =====================================================
-- Stores metadata about uploaded CSV files
-- Each user can have multiple datasets with unique names
-- Duplicate detection based on file content hash

CREATE TABLE user_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Dataset identification
    dataset_name TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    
    -- Storage information
    storage_path TEXT NOT NULL,
    table_name TEXT NOT NULL,
    
    -- Dataset metadata
    column_names TEXT[] NOT NULL,
    row_count INTEGER NOT NULL DEFAULT 0,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    
    -- Duplicate detection (SHA-256 hash of file content)
    file_hash TEXT NOT NULL DEFAULT '',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_user_dataset_name UNIQUE(user_id, dataset_name),
    CONSTRAINT valid_row_count CHECK (row_count >= 0),
    CONSTRAINT valid_file_size CHECK (file_size_bytes >= 0),
    CONSTRAINT non_empty_storage_path CHECK (storage_path <> ''),
    CONSTRAINT non_empty_table_name CHECK (table_name <> ''),
    CONSTRAINT valid_column_names CHECK (array_length(column_names, 1) > 0)
);

-- Indexes for performance
CREATE INDEX idx_user_datasets_user_id ON user_datasets(user_id);
CREATE INDEX idx_user_datasets_table_name ON user_datasets(table_name);
CREATE INDEX idx_user_datasets_user_file_hash ON user_datasets(user_id, file_hash) WHERE file_hash <> '';
CREATE INDEX idx_user_datasets_created_at ON user_datasets(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_datasets ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own datasets
CREATE POLICY "users_select_own_datasets" 
    ON user_datasets FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_datasets" 
    ON user_datasets FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_datasets" 
    ON user_datasets FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_datasets" 
    ON user_datasets FOR DELETE 
    USING (auth.uid() = user_id);

-- =====================================================
-- TABLE 2: query_history
-- =====================================================
-- Stores all user questions and AI-generated SQL queries
-- Linked to datasets for context and analytics

CREATE TABLE query_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dataset_id UUID NOT NULL REFERENCES user_datasets(id) ON DELETE CASCADE,
    
    -- Query details
    question TEXT NOT NULL,
    generated_sql TEXT NOT NULL,
    
    -- Results and metadata
    result_data JSONB,
    success BOOLEAN DEFAULT TRUE NOT NULL,
    error_message TEXT,
    
    -- Quality metrics
    confidence_score DECIMAL(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    execution_time_ms INTEGER CHECK (execution_time_ms >= 0),
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT non_empty_question CHECK (length(trim(question)) > 0),
    CONSTRAINT non_empty_sql CHECK (length(trim(generated_sql)) > 0)
);

-- Indexes for performance
CREATE INDEX idx_query_history_user_id ON query_history(user_id);
CREATE INDEX idx_query_history_dataset_id ON query_history(dataset_id);
CREATE INDEX idx_query_history_created_at ON query_history(created_at DESC);
CREATE INDEX idx_query_history_success ON query_history(success);

-- Enable Row Level Security
ALTER TABLE query_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own query history
CREATE POLICY "users_select_own_queries" 
    ON query_history FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_queries" 
    ON query_history FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- TABLE 3: contact_messages
-- =====================================================
-- Stores contact form submissions from public users
-- No RLS for insertion (public contact form)

CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Contact details
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    
    -- Message content
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Status tracking
    status TEXT DEFAULT 'new' NOT NULL CHECK (status IN ('new', 'in_progress', 'resolved', 'spam')),
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT non_empty_names CHECK (length(trim(first_name)) > 0 AND length(trim(last_name)) > 0),
    CONSTRAINT non_empty_subject CHECK (length(trim(subject)) > 0),
    CONSTRAINT non_empty_message CHECK (length(trim(message)) > 10)
);

-- Indexes for performance
CREATE INDEX idx_contact_messages_status ON contact_messages(status);
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX idx_contact_messages_email ON contact_messages(email);

-- Enable Row Level Security
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can submit contact messages (public form)
CREATE POLICY "public_insert_contact_messages" 
    ON contact_messages FOR INSERT 
    WITH CHECK (true);

-- Admin access only for reading (handle via service role key in backend)
-- No SELECT policy = only service role can read

-- =====================================================
-- FUNCTION 1: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply trigger to user_datasets
CREATE TRIGGER trigger_update_user_datasets_timestamp
    BEFORE UPDATE ON user_datasets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION 2: Get user's datasets with stats
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_datasets_with_stats(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    dataset_name TEXT,
    original_filename TEXT,
    table_name TEXT,
    column_names TEXT[],
    row_count INTEGER,
    file_size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    query_count BIGINT
) 
LANGUAGE plpgsql
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
        ud.file_size_bytes,
        ud.created_at,
        COUNT(qh.id) as query_count
    FROM user_datasets ud
    LEFT JOIN query_history qh ON qh.dataset_id = ud.id
    WHERE ud.user_id = p_user_id
    GROUP BY ud.id, ud.dataset_name, ud.original_filename, ud.table_name, 
             ud.column_names, ud.row_count, ud.file_size_bytes, ud.created_at
    ORDER BY ud.created_at DESC;
END;
$$;

-- =====================================================
-- FUNCTION 3: Get query history for dataset
-- =====================================================
CREATE OR REPLACE FUNCTION get_dataset_queries(
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
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify user owns the dataset
    IF NOT EXISTS (
        SELECT 1 FROM user_datasets 
        WHERE user_datasets.id = p_dataset_id 
        AND user_datasets.user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Dataset not found or access denied';
    END IF;
    
    RETURN QUERY
    SELECT 
        qh.id,
        qh.question,
        qh.generated_sql,
        qh.success,
        qh.confidence_score,
        qh.execution_time_ms,
        qh.created_at
    FROM query_history qh
    WHERE qh.user_id = p_user_id 
        AND qh.dataset_id = p_dataset_id
    ORDER BY qh.created_at DESC
    LIMIT p_limit;
END;
$$;

-- =====================================================
-- FUNCTION 4: Check for duplicate file
-- =====================================================
CREATE OR REPLACE FUNCTION check_duplicate_file(
    p_user_id UUID,
    p_file_hash TEXT
)
RETURNS TABLE (
    id UUID,
    dataset_name TEXT,
    original_filename TEXT,
    row_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ud.id,
        ud.dataset_name,
        ud.original_filename,
        ud.row_count,
        ud.created_at
    FROM user_datasets ud
    WHERE ud.user_id = p_user_id 
        AND ud.file_hash = p_file_hash
        AND ud.file_hash <> ''
    ORDER BY ud.created_at DESC
    LIMIT 1;
END;
$$;

-- =====================================================
-- STORAGE: Setup bucket and policies
-- =====================================================

-- Create storage bucket for user datasets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-datasets', 
    'user-datasets', 
    false,
    52428800, -- 50MB limit
    ARRAY['text/csv', 'application/vnd.ms-excel']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Note: storage.objects already has RLS enabled by Supabase
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "users_upload_own_files" ON storage.objects;
DROP POLICY IF EXISTS "users_view_own_files" ON storage.objects;
DROP POLICY IF EXISTS "users_update_own_files" ON storage.objects;
DROP POLICY IF EXISTS "users_delete_own_files" ON storage.objects;

-- Storage Policy: Users can upload to their own folder
CREATE POLICY "users_upload_own_files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'user-datasets' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage Policy: Users can view their own files
CREATE POLICY "users_view_own_files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'user-datasets' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage Policy: Users can update their own files
CREATE POLICY "users_update_own_files"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'user-datasets' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage Policy: Users can delete their own files
CREATE POLICY "users_delete_own_files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'user-datasets' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the schema is set up correctly

-- Check tables
-- SELECT table_name, table_type 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

-- Check RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public';

-- Check policies
-- SELECT tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public';

-- Check indexes
-- SELECT tablename, indexname 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, indexname;

-- Check storage bucket
-- SELECT * FROM storage.buckets WHERE id = 'user-datasets';

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Next Steps:
-- 1. ✅ Database schema created with RLS
-- 2. ✅ Storage bucket created with policies
-- 3. ✅ Functions and triggers set up
-- 4. Configure Auth providers in Supabase Dashboard:
--    - Email/Password: https://supabase.com/dashboard/project/_/auth/providers
--    - Google OAuth (optional): Add credentials with redirect URL http://localhost:3000/auth/google/callback
-- 5. Update .env file (backend) and .env.local (frontend) with:
--    - SUPABASE_URL
--    - SUPABASE_ANON_KEY
--    - DATABASE_URL
--    - GROQ_API_KEY
-- 6. Start backend: python main.py (runs on http://127.0.0.1:8000)
-- 7. Start frontend: npm run dev (runs on http://localhost:3000)
-- 8. Test locally - see frontend/LOCAL_TESTING.md for complete guide
-- =====================================================
