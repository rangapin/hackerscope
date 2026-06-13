CREATE TABLE IF NOT EXISTS email_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  source text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS generated_ideas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  title text NOT NULL,
  description text,
  market_size text,
  target_audience text,
  revenue_streams jsonb,
  validation_data jsonb,
  preferences text,
  constraints text,
  industry text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS saved_ideas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  idea_id text NOT NULL,
  title text NOT NULL,
  description text,
  is_liked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_email_leads_email ON email_leads(email);
CREATE INDEX IF NOT EXISTS idx_generated_ideas_email ON generated_ideas(email);
CREATE INDEX IF NOT EXISTS idx_generated_ideas_created_at ON generated_ideas(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_ideas_user_email ON saved_ideas(user_email);
CREATE INDEX IF NOT EXISTS idx_saved_ideas_created_at ON saved_ideas(created_at);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'email_leads'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE email_leads;
    END IF;
    
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