
-- Add voice configuration columns to vox_settings
ALTER TABLE public.vox_settings
  ADD COLUMN IF NOT EXISTS voice_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS voice_response_pct integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS voice_name text DEFAULT 'alloy',
  ADD COLUMN IF NOT EXISTS voice_speed numeric DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS voice_show_text boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS voice_accent text DEFAULT 'pt-BR';
