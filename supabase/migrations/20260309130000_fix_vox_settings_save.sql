-- Migração para corrigir vox_settings e adicionar colunas faltantes
-- Data: 2026-03-09
-- Descrição: Adiciona chat_appearance_mode e garante consistência de tipos.

ALTER TABLE public.vox_settings
ADD COLUMN IF NOT EXISTS chat_appearance_mode TEXT DEFAULT 'dark',
ADD COLUMN IF NOT EXISTS chat_theme TEXT DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS chat_theme_config JSONB DEFAULT '{}'::jsonb;

-- Garantir que as colunas de notificação existam (já devem existir, mas por segurança)
ALTER TABLE public.vox_settings
ADD COLUMN IF NOT EXISTS notify_on_new_lead BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_on_qualified BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.vox_settings.chat_appearance_mode IS 'Modo de aparência do chat: light, dark ou auto';
