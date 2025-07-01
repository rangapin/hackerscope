-- Migration to manually set a test user to premium status
-- This will help test premium features without making another payment

-- First ensure the users table exists and has the required columns
DO $$
BEGIN
    -- Check if subscription_status column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE public.users ADD COLUMN subscription_status text DEFAULT 'free';
    END IF;
END $$;

-- Update the first user in the system to premium status for testing
-- Replace with actual user email or ID as needed
UPDATE public.users 
SET 
  subscription = 'premium',
  subscription_status = 'premium',
  updated_at = NOW()
WHERE email IS NOT NULL 
  AND email != ''
  AND user_id = (
    SELECT user_id 
    FROM public.users 
    WHERE email IS NOT NULL 
      AND email != ''
    ORDER BY created_at ASC 
    LIMIT 1
  );

-- Also create a test subscription record for this user
INSERT INTO public.subscriptions (
  user_id,
  stripe_id,
  price_id,
  stripe_price_id,
  currency,
  interval,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  amount,
  started_at,
  customer_id,
  metadata
)
SELECT 
  user_id,
  'sub_test_' || substr(md5(random()::text), 1, 24) as stripe_id,
  'price_1RfgF5CBtpFxI513jBPiqq2o' as price_id,
  'price_1RfgF5CBtpFxI513jBPiqq2o' as stripe_price_id,
  'eur' as currency,
  'month' as interval,
  'active' as status,
  extract(epoch from now())::bigint as current_period_start,
  extract(epoch from now() + interval '1 month')::bigint as current_period_end,
  false as cancel_at_period_end,
  500 as amount,
  extract(epoch from now())::bigint as started_at,
  'cus_test_' || substr(md5(random()::text), 1, 24) as customer_id,
  '{"test": true}'::jsonb as metadata
FROM public.users 
WHERE email IS NOT NULL 
  AND email != ''
  AND subscription_status = 'premium'
  AND NOT EXISTS (
    SELECT 1 FROM public.subscriptions s 
    WHERE s.user_id = users.user_id
  )
LIMIT 1;