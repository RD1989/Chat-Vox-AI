INSERT INTO public.user_roles (user_id, role)
VALUES ('0be2bf9e-8258-4f30-b96d-c9c180756bd4', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;