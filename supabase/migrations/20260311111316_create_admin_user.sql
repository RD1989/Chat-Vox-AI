-- Migration: Create Super Admin User
DO $$
DECLARE
  admin_uid UUID := gen_random_uuid();
BEGIN
  -- Check if admin already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@chatvox.com.br') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, app_metadata, user_metadata, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', admin_uid, 'authenticated', 'authenticated', 'admin@chatvox.com.br', extensions.crypt('admin123', extensions.gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"name":"Super Admin"}', now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      admin_uid, admin_uid, admin_uid, format('{"sub":"%s","email":"admin@chatvox.com.br"}', admin_uid)::jsonb, 'email', now(), now(), now()
    );
  ELSE
    -- Update existing user password and confirm email
    UPDATE auth.users 
    SET encrypted_password = extensions.crypt('admin123', extensions.gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now())
    WHERE email = 'admin@chatvox.com.br';
  END IF;
END $$;
