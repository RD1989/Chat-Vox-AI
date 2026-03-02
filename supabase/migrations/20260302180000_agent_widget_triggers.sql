-- Add widget trigger and position columns to vox_agents
ALTER TABLE vox_agents ADD COLUMN IF NOT EXISTS widget_trigger_seconds INTEGER DEFAULT 0;
ALTER TABLE vox_agents ADD COLUMN IF NOT EXISTS widget_trigger_scroll INTEGER DEFAULT 0;
ALTER TABLE vox_agents ADD COLUMN IF NOT EXISTS widget_position TEXT DEFAULT 'bottom-right';

-- Comment explaining the columns
COMMENT ON COLUMN vox_agents.widget_trigger_seconds IS 'Segundos de inatividade antes de abrir o widget automaticamente';
COMMENT ON COLUMN vox_agents.widget_trigger_scroll IS 'Porcentagem de scroll antes de abrir o widget automaticamente';
COMMENT ON COLUMN vox_agents.widget_position IS 'Posição do widget na tela (bottom-right ou bottom-left)';
