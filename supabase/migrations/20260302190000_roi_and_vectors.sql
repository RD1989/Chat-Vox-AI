-- 1. Enable the pgvector extension to work with embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to vox_knowledge
-- Gemini text-embedding-004 uses 768 dimensions
ALTER TABLE vox_knowledge ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. Add ROI related columns to vox_leads
ALTER TABLE vox_leads ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(12,2) DEFAULT 0;
ALTER TABLE vox_leads ADD COLUMN IF NOT EXISTS acquisition_cost DECIMAL(12,2) DEFAULT 0;

-- 4. Add average conversion value to vox_agents (for ROI calculation)
ALTER TABLE vox_agents ADD COLUMN IF NOT EXISTS avg_conversion_value DECIMAL(12,2) DEFAULT 0;

-- 5. Create a function for match_knowledge (Vector Search)
-- This allows searching knowledge entries by semantic similarity
CREATE OR REPLACE FUNCTION match_knowledge (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid,
  p_agent_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  category text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vk.id,
    vk.title,
    vk.content,
    vk.category,
    1 - (vk.embedding <=> query_embedding) AS similarity
  FROM vox_knowledge vk
  WHERE 
    vk.user_id = p_user_id
    AND vk.is_active = true
    AND (
      p_agent_id IS NULL 
      OR vk.agent_id = p_agent_id 
      OR vk.agent_id IS NULL
    )
    AND 1 - (vk.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 6. Comments for documentation
COMMENT ON COLUMN vox_knowledge.embedding IS 'Representação vetorial do conteúdo para busca semântica';
COMMENT ON COLUMN vox_leads.estimated_value IS 'Valor estimado do lead em pipeline';
COMMENT ON COLUMN vox_leads.acquisition_cost IS 'Custo para adquirir este lead (ex: tráfego pago)';
COMMENT ON COLUMN vox_agents.avg_conversion_value IS 'Valor médio de uma venda fechada por este agente';
