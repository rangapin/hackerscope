-- Migration to insert missing authenticated users into public.users table with premium status
-- This will copy user details from auth.users and create matching records in public.users

-- Insert missing users from auth.users into public.users with premium status
INSERT INTO public.users (
  id,
  user_id,
  email,
  name,
  full_name,
  avatar_url,
  token_identifier,
  subscription,
  subscription_status,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.id::text as user_id,
  au.email,
  au.raw_user_meta_data->>'name' as name,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.raw_user_meta_data->>'avatar_url' as avatar_url,
  au.email as token_identifier,
  'premium' as subscription,
  'premium' as subscription_status,
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE au.email IS NOT NULL
  AND au.email != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.users pu 
    WHERE pu.user_id = au.id::text
  )
ON CONFLICT (user_id) DO UPDATE SET
  subscription = 'premium',
  subscription_status = 'premium',
  updated_at = NOW();

-- Create corresponding subscription records for these premium users
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
  pu.user_id,
  'sub_premium_' || substr(md5(random()::text), 1, 20) as stripe_id,
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
  'cus_premium_' || substr(md5(random()::text), 1, 20) as customer_id,
  '{"migrated": true, "premium_user": true}'::jsonb as metadata
FROM public.users pu
WHERE pu.subscription_status = 'premium'
  AND NOT EXISTS (
    SELECT 1 FROM public.subscriptions s 
    WHERE s.user_id = pu.user_id
  );

-- Log the migration results
DO $$
DECLARE
    user_count INTEGER;
    subscription_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.users WHERE subscription_status = 'premium';
    SELECT COUNT(*) INTO subscription_count FROM public.subscriptions WHERE status = 'active';
    
    RAISE NOTICE 'Migration completed: % premium users, % active subscriptions', user_count, subscription_count;
END $$;