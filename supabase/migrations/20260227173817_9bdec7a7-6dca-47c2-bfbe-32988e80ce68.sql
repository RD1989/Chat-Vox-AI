
-- Add notification settings to vox_settings
ALTER TABLE public.vox_settings
  ADD COLUMN IF NOT EXISTS notify_email text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notify_on_new_lead boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_on_qualified boolean DEFAULT true;
