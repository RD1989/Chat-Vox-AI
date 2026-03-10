-- Migração para Unificar Configurações no Nível do Agente
-- Data: 2026-03-09
-- Descrição: Move campos visuais e de comportamento do widget de vox_settings para vox_agents.

ALTER TABLE public.vox_agents 
ADD COLUMN IF NOT EXISTS chat_appearance_mode TEXT DEFAULT 'dark',
ADD COLUMN IF NOT EXISTS chat_theme TEXT DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS chat_theme_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS custom_css TEXT,
ADD COLUMN IF NOT EXISTS widget_trigger_seconds INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS widget_trigger_scroll INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS widget_position TEXT DEFAULT 'bottom-right';

-- Comentários para documentação
COMMENT ON COLUMN public.vox_agents.chat_appearance_mode IS 'Modo de aparência: light, dark ou auto (específico por agente)';
COMMENT ON COLUMN public.vox_agents.chat_theme IS 'Template de tema: whatsapp, custom, etc';
COMMENT ON COLUMN public.vox_agents.widget_trigger_seconds IS 'Segundos para abertura automática do widget';
COMMENT ON COLUMN public.vox_agents.widget_trigger_scroll IS 'Porcentagem de scroll para abertura automática';
COMMENT ON COLUMN public.vox_agents.widget_position IS 'Lado da tela: bottom-right ou bottom-left';
