-- Migration: Assign Super Admin Role
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Detect admin user by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@chatvox.com.br' LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Insert into user_roles to grant super admin UI access
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;
