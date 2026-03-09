-- Adicionar colunas para mensagem predefinida e captura orgânica
ALTER TABLE vox_agents 
ADD COLUMN IF NOT EXISTS predefined_message TEXT,
ADD COLUMN IF NOT EXISTS organic_lead_capture BOOLEAN DEFAULT false;

-- Adicionar colunas equivalentes em vox_settings para configurações globais também
ALTER TABLE vox_settings
ADD COLUMN IF NOT EXISTS predefined_message TEXT,
ADD COLUMN IF NOT EXISTS organic_lead_capture BOOLEAN DEFAULT false;
