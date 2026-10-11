-- ============================================================
-- LODS: Assign Partner Login Credentials for Mobile App
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Ensure columns and safe constraints on public.merchants
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS push_token TEXT DEFAULT NULL;

-- Make name column resilient to avoid 23502 null constraint errors during auth triggers
ALTER TABLE public.merchants ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.merchants ALTER COLUMN name SET DEFAULT 'Partner Merchant';

-- 2. Fix handle_new_user() trigger function to handle existing & new merchants safely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'Partner Merchant'
  );

  IF v_role = 'rider' THEN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
      INSERT INTO public.users (id, email, name, role)
      VALUES (NEW.id, NEW.email, v_name, 'rider')
      ON CONFLICT (id) DO NOTHING;
    END IF;

  ELSIF v_role = 'merchant' THEN
    -- If merchant already exists, update email instead of re-inserting with nulls
    IF EXISTS (SELECT 1 FROM public.merchants WHERE id = NEW.id) THEN
      UPDATE public.merchants
      SET 
        email = COALESCE(public.merchants.email, NEW.email),
        updated_at = now()
      WHERE id = NEW.id;
    ELSE
      INSERT INTO public.merchants (id, name, email)
      VALUES (NEW.id, v_name, NEW.email)
      ON CONFLICT (id) DO NOTHING;
    END IF;

  ELSIF v_role = 'client' THEN
    IF NOT EXISTS (SELECT 1 FROM public.clients WHERE id = NEW.id) THEN
      INSERT INTO public.clients (
        id, email, full_name, address, contact_no, landmark, latitude, longitude
      )
      VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', v_name),
        COALESCE(NEW.raw_user_meta_data->>'address', ''),
        COALESCE(NEW.raw_user_meta_data->>'contact_no', NEW.raw_user_meta_data->>'phone', ''),
        NEW.raw_user_meta_data->>'landmark',
        NULLIF(NULLIF(NEW.raw_user_meta_data->>'latitude', ''), 'null')::DOUBLE PRECISION,
        NULLIF(NULLIF(NEW.raw_user_meta_data->>'longitude', ''), 'null')::DOUBLE PRECISION
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rebind trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Function to atomically assign/update credentials in auth.users, auth.identities, and public.merchants
CREATE OR REPLACE FUNCTION public.assign_merchant_credentials(
  merchant_id UUID,
  merchant_email TEXT,
  merchant_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_clean_email TEXT;
  v_merchant_name TEXT;
BEGIN
  v_clean_email := lower(trim(merchant_email));

  -- Get merchant name from public.merchants
  SELECT name INTO v_merchant_name FROM public.merchants WHERE id = merchant_id;
  IF v_merchant_name IS NULL THEN
    v_merchant_name := split_part(v_clean_email, '@', 1);
  END IF;

  -- Check if an auth user already exists with this ID or Email
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE id = merchant_id OR email = v_clean_email 
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Update existing auth user: password, metadata, and ensure token strings are not NULL
    UPDATE auth.users
    SET 
      email = v_clean_email,
      encrypted_password = crypt(merchant_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now(),
      raw_user_meta_data = jsonb_build_object('role', 'merchant', 'name', v_merchant_name),
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change = COALESCE(email_change, '')
    WHERE id = v_user_id;
  ELSE
    -- Insert new auth user with required non-null empty strings for tokens (phone is left NULL)
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      merchant_id,
      'authenticated',
      'authenticated',
      v_clean_email,
      crypt(merchant_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('role', 'merchant', 'name', v_merchant_name),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
    v_user_id := merchant_id;
  END IF;

  -- Ensure auth.identities has an entry for GoTrue authentication
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  )
  ON CONFLICT DO NOTHING;

  -- Update public.merchants table
  UPDATE public.merchants
  SET 
    email = v_clean_email,
    password = merchant_password,
    updated_at = now()
  WHERE id = merchant_id;

  RETURN jsonb_build_object(
    'success', true,
    'merchant_id', merchant_id,
    'email', v_clean_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_merchant_credentials(UUID, TEXT, TEXT) TO authenticated, anon;

-- 4. FIX EXISTING AUTH USERS: Resolve "Database error querying schema"
-- GoTrue throws scan error when tokens are NULL instead of empty strings ''
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, '')
WHERE confirmation_token IS NULL
   OR recovery_token IS NULL
   OR email_change_token_new IS NULL
   OR email_change IS NULL;

-- Free up phone unique constraint: ensure users without a phone are NULL, not empty string
UPDATE auth.users
SET phone = NULL
WHERE phone = '';

-- 5. One-time Sync for all existing merchants with email and password
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
SELECT 
  '00000000-0000-0000-0000-000000000000', 
  id, 
  'authenticated', 
  'authenticated', 
  lower(trim(email)), 
  crypt(password, gen_salt('bf')),
  now(), 
  '{"provider":"email","providers":["email"]}'::jsonb, 
  jsonb_build_object('role', 'merchant', 'name', COALESCE(name, split_part(email, '@', 1))), 
  now(), 
  now(),
  '', '', '', ''
FROM public.merchants
WHERE email IS NOT NULL 
  AND password IS NOT NULL
  AND id NOT IN (SELECT id FROM auth.users)
  AND lower(trim(email)) NOT IN (SELECT email FROM auth.users)
ON CONFLICT (id) DO UPDATE SET
  confirmation_token = COALESCE(auth.users.confirmation_token, ''),
  recovery_token = COALESCE(auth.users.recovery_token, ''),
  email_change_token_new = COALESCE(auth.users.email_change_token_new, ''),
  email_change = COALESCE(auth.users.email_change, '');

-- 6. Link all auth.users into auth.identities
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  id,
  id,
  jsonb_build_object('sub', id::text, 'email', lower(trim(email))),
  'email',
  id::text,
  now(),
  now(),
  now()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM auth.identities)
ON CONFLICT DO NOTHING;




