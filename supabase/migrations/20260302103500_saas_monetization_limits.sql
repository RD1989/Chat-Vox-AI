
-- Sincronizar preços e limites da tabela plans com o Marketing (Pricing.tsx)
-- Preços em centavos (integer)

-- 1. Garantir que a coluna agent_limit existe
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS agent_limit integer DEFAULT 1;

-- 2. Atualizar limites e preços
UPDATE public.plans SET 
  price_brl = 0, 
  lead_limit = 25, 
  agent_limit = 1 
WHERE slug = 'free';

UPDATE public.plans SET 
  price_brl = 9790, 
  lead_limit = 300, 
  agent_limit = 1 
WHERE slug = 'starter';

UPDATE public.plans SET 
  price_brl = 19790, 
  lead_limit = 3000, 
  agent_limit = 3 
WHERE slug = 'pro';

UPDATE public.plans SET 
  price_brl = 39790, 
  lead_limit = 10000, -- Cap de segurança para o plano Scale na API
  agent_limit = 100 
WHERE slug = 'scale';

-- 3. Inserir planos faltantes caso não existam
INSERT INTO public.plans (slug, name, price_brl, lead_limit, agent_limit)
SELECT 'free', 'Free', 0, 25, 1 WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'free');

INSERT INTO public.plans (slug, name, price_brl, lead_limit, agent_limit)
SELECT 'starter', 'Starter', 9790, 300, 1 WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'starter');

INSERT INTO public.plans (slug, name, price_brl, lead_limit, agent_limit)
SELECT 'pro', 'Pro', 19790, 3000, 3 WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'pro');

INSERT INTO public.plans (slug, name, price_brl, lead_limit, agent_limit)
SELECT 'scale', 'Scale', 39790, 10000, 100 WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'scale');
