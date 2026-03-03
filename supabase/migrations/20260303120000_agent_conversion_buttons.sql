-- Tabela para armazenar links estratégicos que a IA pode disparar como botões
CREATE TABLE IF NOT EXISTS public.vox_agent_buttons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.vox_agents(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.vox_agent_buttons ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can manage their own agent buttons" ON public.vox_agent_buttons
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.vox_agents
            WHERE vox_agents.id = vox_agent_buttons.agent_id
            AND vox_agents.user_id = auth.uid()
        )
    );

CREATE POLICY "Public can read active agent buttons" ON public.vox_agent_buttons
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.vox_agent_buttons
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
