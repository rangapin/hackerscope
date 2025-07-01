-- Enable RLS on all tables
ALTER TABLE generated_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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

-- Create RLS policies for generated_ideas table using auth.uid() for better compatibility
CREATE POLICY "Users can insert their own generated ideas"
ON generated_ideas FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (auth.jwt() ->> 'email' = email OR auth.email() = email)
);

CREATE POLICY "Users can view their own generated ideas"
ON generated_ideas FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  (auth.jwt() ->> 'email' = email OR auth.email() = email)
);

CREATE POLICY "Users can update their own generated ideas"
ON generated_ideas FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  (auth.jwt() ->> 'email' = email OR auth.email() = email)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (auth.jwt() ->> 'email' = email OR auth.email() = email)
);

CREATE POLICY "Users can delete their own generated ideas"
ON generated_ideas FOR DELETE
USING (
  auth.uid() IS NOT NULL AND 
  (auth.jwt() ->> 'email' = email OR auth.email() = email)
);

-- Add debugging policy to allow broader access temporarily for troubleshooting
-- This policy should be removed once the 406 issue is resolved
CREATE POLICY "Debug policy for generated_ideas"
ON generated_ideas FOR SELECT
USING (
  auth.uid() IS NOT NULL
);

-- Add debugging policy for saved_ideas as well
CREATE POLICY "Debug policy for saved_ideas"
ON saved_ideas FOR SELECT
USING (
  auth.uid() IS NOT NULL
);

-- Create RLS policies for saved_ideas table
CREATE POLICY "Users can insert their own saved ideas"
ON saved_ideas FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (auth.jwt() ->> 'email' = user_email OR auth.email() = user_email)
);

CREATE POLICY "Users can view their own saved ideas"
ON saved_ideas FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  (auth.jwt() ->> 'email' = user_email OR auth.email() = user_email)
);

CREATE POLICY "Users can update their own saved ideas"
ON saved_ideas FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  (auth.jwt() ->> 'email' = user_email OR auth.email() = user_email)
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (auth.jwt() ->> 'email' = user_email OR auth.email() = user_email)
);

CREATE POLICY "Users can delete their own saved ideas"
ON saved_ideas FOR DELETE
USING (
  auth.uid() IS NOT NULL AND 
  (auth.jwt() ->> 'email' = user_email OR auth.email() = user_email)
);

-- Create RLS policies for email_leads table (allow public access for lead capture)
CREATE POLICY "Allow email lead insertion"
ON email_leads FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow email lead viewing"
ON email_leads FOR SELECT
USING (true);

-- Add realtime publication for the tables if not already added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'generated_ideas'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE generated_ideas;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'saved_ideas'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE saved_ideas;
    END IF;
END $$;