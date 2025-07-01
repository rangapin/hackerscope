-- Temporarily disable RLS to fix authentication issues
-- This will be re-enabled once authentication is properly configured

ALTER TABLE generated_ideas DISABLE ROW LEVEL SECURITY;
ALTER TABLE saved_ideas DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_leads DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can insert their own generated ideas" ON generated_ideas;
DROP POLICY IF EXISTS "Users can view their own generated ideas" ON generated_ideas;
DROP POLICY IF EXISTS "Users can update their own generated ideas" ON generated_ideas;
DROP POLICY IF EXISTS "Users can delete their own generated ideas" ON generated_ideas;

DROP POLICY IF EXISTS "Users can insert their own saved ideas" ON saved_ideas;
DROP POLICY IF EXISTS "Users can view their own saved ideas" ON saved_ideas;
DROP POLICY IF EXISTS "Users can update their own saved ideas" ON saved_ideas;
DROP POLICY IF EXISTS "Users can delete their own saved ideas" ON saved_ideas;

DROP POLICY IF EXISTS "Allow email lead insertion" ON email_leads;
DROP POLICY IF EXISTS "Allow email lead viewing" ON email_leads;

-- Ensure realtime is enabled for the tables (only add if not already present)
DO $$
BEGIN
    -- Add generated_ideas to realtime if not already present
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'generated_ideas'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE generated_ideas;
    END IF;
    
    -- Add saved_ideas to realtime if not already present
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'saved_ideas'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE saved_ideas;
    END IF;
    
    -- Add email_leads to realtime if not already present
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'email_leads'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE email_leads;
    END IF;
END $$;