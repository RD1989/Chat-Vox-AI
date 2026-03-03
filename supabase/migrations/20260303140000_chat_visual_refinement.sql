-- Add chat appearance mode to vox_agents
ALTER TABLE public.vox_agents 
ADD COLUMN IF NOT EXISTS chat_appearance_mode text DEFAULT 'auto';

-- Add check constraint for valid values
ALTER TABLE public.vox_agents
ADD CONSTRAINT check_appearance_mode 
CHECK (chat_appearance_mode IN ('light', 'dark', 'auto'));

-- Add comment
COMMENT ON COLUMN public.vox_agents.chat_appearance_mode IS 'Appearance theme for the public chat (light, dark, or auto-detect)';
