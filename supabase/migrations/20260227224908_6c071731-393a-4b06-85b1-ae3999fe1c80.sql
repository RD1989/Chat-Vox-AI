CREATE TABLE public.admin_metric_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_key text NOT NULL UNIQUE,
  label text NOT NULL,
  operator text NOT NULL DEFAULT 'lt' CHECK (operator IN ('lt', 'gt', 'eq')),
  threshold numeric NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_metric_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage metric alerts" ON public.admin_metric_alerts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default alerts
INSERT INTO public.admin_metric_alerts (metric_key, label, operator, threshold, severity) VALUES
  ('conversion_rate', 'Taxa de Conversão baixa', 'lt', 10, 'critical'),
  ('leads_today', 'Leads diários abaixo do esperado', 'lt', 5, 'warning'),
  ('active_user_pct', 'Usuários ativos abaixo do esperado', 'lt', 50, 'critical'),
  ('avg_score', 'Score médio baixo', 'lt', 40, 'warning'),
  ('bot_engagement', 'Engajamento do bot baixo', 'lt', 20, 'info');