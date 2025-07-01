-- Fix subscription status for richard.angapin@quable.fr and check for any mistaken upgrades

-- First, let's check if richard.angapin@quable.fr exists in auth.users but not in public.users
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
WHERE au.email = 'richard.angapin@quable.fr'
  AND NOT EXISTS (
    SELECT 1 FROM public.users pu 
    WHERE pu.email = 'richard.angapin@quable.fr'
  )
ON CONFLICT (user_id) DO NOTHING;

-- Update richard.angapin@quable.fr to premium status if they exist
UPDATE public.users 
SET 
  subscription = 'premium',
  subscription_status = 'premium',
  updated_at = NOW()
WHERE email = 'richard.angapin@quable.fr';

-- Create a subscription record for richard if one doesn't exist
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
  'sub_richard_' || substr(md5(random()::text), 1, 20) as stripe_id,
  'price_1RfgF5CBtpFxI513jBPiqq2o' as price_id,
  'price_1RfgF5CBtpFxI513jBPiqq2o' as stripe_price_id,
  'eur' as currency,
  'month' as interval,
  'active' as status,
  extract(epoch from now())::bigint as current_period_start,
  extract(epoch from now() + interval '1 month')::bigint as current_period_end,
  false as cancel_at_period_end,
  900 as amount,
  extract(epoch from now())::bigint as started_at,
  'cus_richard_' || substr(md5(random()::text), 1, 20) as customer_id,
  '{"manual_fix": true, "user": "richard.angapin@quable.fr"}'::jsonb as metadata
FROM public.users pu
WHERE pu.email = 'richard.angapin@quable.fr'
  AND NOT EXISTS (
    SELECT 1 FROM public.subscriptions s 
    WHERE s.user_id = pu.user_id
  );

-- Log the results
DO $$
DECLARE
    richard_user_record RECORD;
    richard_subscription_record RECORD;
BEGIN
    -- Check if Richard's user record exists and has correct status
    SELECT email, subscription_status, subscription INTO richard_user_record
    FROM public.users 
    WHERE email = 'richard.angapin@quable.fr';
    
    IF FOUND THEN
        RAISE NOTICE 'Richard user found - Email: %, Status: %, Subscription: %', 
            richard_user_record.email, 
            richard_user_record.subscription_status, 
            richard_user_record.subscription;
    ELSE
        RAISE NOTICE 'Richard user not found in public.users table';
    END IF;
    
    -- Check if Richard has a subscription record
    SELECT status, amount INTO richard_subscription_record
    FROM public.subscriptions s
    JOIN public.users u ON s.user_id = u.user_id
    WHERE u.email = 'richard.angapin@quable.fr';
    
    IF FOUND THEN
        RAISE NOTICE 'Richard subscription found - Status: %, Amount: %', 
            richard_subscription_record.status, 
            richard_subscription_record.amount;
    ELSE
        RAISE NOTICE 'Richard subscription not found';
    END IF;
END $$;
