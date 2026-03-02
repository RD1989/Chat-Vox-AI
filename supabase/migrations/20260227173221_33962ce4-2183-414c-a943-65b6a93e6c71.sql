
-- Add system prompt to vox_settings
ALTER TABLE public.vox_settings
  ADD COLUMN IF NOT EXISTS system_prompt text DEFAULT '';

-- Add webhook_url to vox_settings
ALTER TABLE public.vox_settings
  ADD COLUMN IF NOT EXISTS webhook_url text DEFAULT NULL;

-- Add custom_css to vox_settings
ALTER TABLE public.vox_settings
  ADD COLUMN IF NOT EXISTS custom_css text DEFAULT '';

-- Add chat widget config columns
ALTER TABLE public.vox_settings
  ADD COLUMN IF NOT EXISTS widget_trigger_seconds integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS widget_trigger_scroll integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS widget_position text DEFAULT 'bottom-right',
  ADD COLUMN IF NOT EXISTS pre_chat_fields jsonb DEFAULT '["name"]'::jsonb;
