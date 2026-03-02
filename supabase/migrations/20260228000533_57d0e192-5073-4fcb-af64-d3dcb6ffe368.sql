
-- Create vox_agents table for multi-agent system
CREATE TABLE public.vox_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Agente 1',
  system_prompt text DEFAULT '',
  welcome_message text NOT NULL DEFAULT 'Olá! Como posso ajudar você hoje?',
  ai_avatar_url text,
  primary_color text NOT NULL DEFAULT '#6366f1',
  chat_theme text NOT NULL DEFAULT 'whatsapp',
  chat_theme_config jsonb DEFAULT '{}'::jsonb,
  custom_css text DEFAULT '',
  voice_enabled boolean DEFAULT false,
  voice_name text DEFAULT 'alloy',
  voice_speed numeric DEFAULT 1.0,
  voice_response_pct integer DEFAULT 50,
  voice_show_text boolean DEFAULT true,
  voice_accent text DEFAULT 'pt-BR',
  webhook_url text,
  widget_position text DEFAULT 'bottom-right',
  widget_trigger_seconds integer DEFAULT 5,
  widget_trigger_scroll integer DEFAULT 50,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vox_agents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users manage own agents" ON public.vox_agents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can read agents" ON public.vox_agents FOR SELECT USING (true);

-- Add agent_id to vox_leads and vox_messages for agent-specific tracking
ALTER TABLE public.vox_leads ADD COLUMN agent_id uuid REFERENCES public.vox_agents(id) ON DELETE SET NULL;
ALTER TABLE public.vox_messages ADD COLUMN agent_id uuid REFERENCES public.vox_agents(id) ON DELETE SET NULL;

-- Add agent_id to vox_knowledge for per-agent knowledge base
ALTER TABLE public.vox_knowledge ADD COLUMN agent_id uuid REFERENCES public.vox_agents(id) ON DELETE SET NULL;

-- Add agent_limit to plans table
ALTER TABLE public.plans ADD COLUMN agent_limit integer DEFAULT 1;

-- Enable realtime for vox_agents
ALTER PUBLICATION supabase_realtime ADD TABLE public.vox_agents;
