-- Add performance indexes for foreign keys and common query patterns

CREATE INDEX IF NOT EXISTS idx_vox_leads_user_id ON public.vox_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_vox_messages_user_id ON public.vox_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_vox_messages_lead_id ON public.vox_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_vox_agents_user_id ON public.vox_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_vox_settings_user_id ON public.vox_settings(user_id);

-- Profile reads (for the checkOnboarding query)
CREATE INDEX IF NOT EXISTS idx_profiles_id_onboarding ON public.profiles(id, onboarding_completed);
