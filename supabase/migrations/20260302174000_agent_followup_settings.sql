-- Add follow-up configuration to vox_agents
ALTER TABLE public.vox_agents 
ADD COLUMN IF NOT EXISTS follow_up_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS follow_up_config JSONB DEFAULT '[
  {"id": 1, "delay_hours": 2, "message": "Oi, você ainda está aí?"},
  {"id": 2, "delay_hours": 24, "message": "Olá, ainda estou por aqui para te ajudar!"},
  {"id": 3, "delay_hours": 48, "message": "Já que não respondeu, vou finalizar nosso chat, mas estou à disposição!"}
]';

-- Add follow-up tracking to vox_leads
ALTER TABLE public.vox_leads
ADD COLUMN IF NOT EXISTS last_follow_up_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS follow_up_step INTEGER DEFAULT 0;

-- Index for performance in the worker
CREATE INDEX IF NOT EXISTS idx_vox_leads_follow_up ON public.vox_leads (user_id, agent_id, status, follow_up_step) WHERE status != 'Finalizado';
