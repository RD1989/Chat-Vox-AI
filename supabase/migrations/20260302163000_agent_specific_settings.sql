-- Add model configuration columns to vox_agents
ALTER TABLE public.vox_agents 
ADD COLUMN IF NOT EXISTS openrouter_model text,
ADD COLUMN IF NOT EXISTS vision_model text;

-- Add comment for documentation
COMMENT ON COLUMN public.vox_agents.openrouter_model IS 'Specific AI model for this agent (overrides global setting)';
COMMENT ON COLUMN public.vox_agents.vision_model IS 'Specific Vision model for this agent (overrides global setting)';
