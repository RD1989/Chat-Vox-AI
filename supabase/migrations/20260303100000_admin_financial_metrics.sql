-- Função para calcular o custo total estimado de mensagens de um usuário
-- Assume-se um custo médio de R$ 0,005 por mensagem (Gemini Flash)
CREATE OR REPLACE FUNCTION get_user_estimated_ia_cost(_user_id uuid)
RETURNS float AS $$
DECLARE
    msg_count integer;
BEGIN
    SELECT COUNT(*) INTO msg_count FROM public.vox_messages WHERE user_id = _user_id;
    RETURN msg_count * 0.005; -- Custo em Reais
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View para consolidar métricas financeiras administrativas
CREATE OR REPLACE VIEW admin_financial_performance AS
SELECT 
    p.slug as plan_slug,
    p.name as plan_name,
    COUNT(pr.id) as active_users,
    SUM(p.price_brl) / 100.0 as total_revenue, -- Convertendo centavos para Real
    SUM(get_user_estimated_ia_cost(pr.id)) as total_ia_cost,
    (SUM(p.price_brl) / 100.0) - SUM(get_user_estimated_ia_cost(pr.id)) as net_profit
FROM public.profiles pr
JOIN public.plans p ON pr.plan = p.slug
WHERE pr.is_active = true
GROUP BY p.slug, p.name;

-- Adicionar configurações globais de sistema se não existirem
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('global_ia_cost_per_msg', '0.005', 'Custo médio estimado por mensagem de IA para cálculos de ROI Admin'),
    ('default_ai_model', 'google/gemini-2.0-flash-001', 'Modelo padrão do sistema para novos agentes')
ON CONFLICT (key) DO NOTHING;
