-- Migração Consolidada para Correção do Salvamento de Agentes
-- Data: 2026-03-09
-- Descrição: Adiciona colunas faltantes para suporte a Vendas, Links, Meta CAPI e Mídias.

ALTER TABLE public.vox_agents 
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS checkout_url TEXT,
ADD COLUMN IF NOT EXISTS product_links JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS catalog_url TEXT,
ADD COLUMN IF NOT EXISTS site_url TEXT,
ADD COLUMN IF NOT EXISTS meta_api_token TEXT,
ADD COLUMN IF NOT EXISTS meta_pixel TEXT,
ADD COLUMN IF NOT EXISTS ask_whatsapp BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_image_generation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS product_media JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS social_proof_media JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS predefined_message TEXT,
ADD COLUMN IF NOT EXISTS organic_lead_capture BOOLEAN DEFAULT FALSE;

-- Adicionar colunas equivalentes em vox_settings para configurações globais se necessário
ALTER TABLE public.vox_settings
ADD COLUMN IF NOT EXISTS predefined_message TEXT,
ADD COLUMN IF NOT EXISTS organic_lead_capture BOOLEAN DEFAULT FALSE;

-- Comentários para documentação
COMMENT ON COLUMN public.vox_agents.pix_key IS 'Chave Pix para recebimento direto no chat';
COMMENT ON COLUMN public.vox_agents.meta_api_token IS 'Token de acesso para Meta Conversions API (CAPI)';
COMMENT ON COLUMN public.vox_agents.product_media IS 'Lista de URLs de mídias demonstrativas do produto';
COMMENT ON COLUMN public.vox_agents.social_proof_media IS 'Lista de URLs de mídias de prova social/depoimentos';
COMMENT ON COLUMN public.vox_agents.predefined_message IS 'Mensagem inicial predefinida para o chat';
COMMENT ON COLUMN public.vox_agents.organic_lead_capture IS 'Se deve capturar lead de forma orgânica durante a conversa';

-- Criar bucket agent_assets para mídias dos agentes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('agent_assets', 'agent_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Permissões para agent_assets
CREATE POLICY "Anyone can upload agent assets" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'agent_assets');

CREATE POLICY "Anyone can view agent assets" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'agent_assets');
