
-- Add tags column to vox_leads for auto-tagging
ALTER TABLE public.vox_leads ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add handoff_requested flag for human takeover
ALTER TABLE public.vox_leads ADD COLUMN IF NOT EXISTS handoff_requested boolean DEFAULT false;

-- Add onboarding_completed to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
