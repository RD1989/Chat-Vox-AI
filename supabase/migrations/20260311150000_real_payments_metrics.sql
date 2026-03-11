-- Atualizar View para métricas reais baseadas em pagamentos confirmados
CREATE OR REPLACE VIEW admin_financial_performance AS
SELECT 
    p.slug as plan_slug,
    p.name as plan_name,
    COUNT(DISTINCT vp.user_id) as active_users,
    COALESCE(SUM(vp.amount_cents) FILTER (WHERE vp.status = 'paid'), 0) / 100.0 as total_revenue,
    COALESCE(SUM(get_user_estimated_ia_cost(vp.user_id)) FILTER (WHERE vp.status = 'paid'), 0) as total_ia_cost,
    (COALESCE(SUM(vp.amount_cents) FILTER (WHERE vp.status = 'paid'), 0) / 100.0) - COALESCE(SUM(get_user_estimated_ia_cost(vp.user_id)) FILTER (WHERE vp.status = 'paid'), 0) as net_profit
FROM public.vox_payments vp
JOIN public.plans p ON vp.plan_slug = p.slug
GROUP BY p.slug, p.name;

-- Definir Sandbox como falso (Produção) para receber pagamentos reais via Efí
UPDATE public.system_settings 
SET value = 'false' 
WHERE key = 'efi_sandbox';
