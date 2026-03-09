-- Migração para Blindagem 360 e Rastreio Avançado
-- Adiciona colunas de conversão, mídias e rastreamento à tabela vox_agents

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
ADD COLUMN IF NOT EXISTS social_proof_media JSONB DEFAULT '[]'::jsonb;

-- Comentários para documentação no banco
COMMENT ON COLUMN public.vox_agents.pix_key IS 'Chave Pix para recebimento direto no chat';
COMMENT ON COLUMN public.vox_agents.meta_api_token IS 'Token de acesso para Meta Conversions API (CAPI)';
COMMENT ON COLUMN public.vox_agents.product_media IS 'Lista de URLs de mídias demonstrativas do produto';
COMMENT ON COLUMN public.vox_agents.social_proof_media IS 'Lista de URLs de mídias de prova social/depoimentos';
