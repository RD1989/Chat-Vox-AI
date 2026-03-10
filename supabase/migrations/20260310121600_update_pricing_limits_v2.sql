
-- Reestruturação de Planos e Preços - Março 2026
-- Preços em centavos (integer)

-- 1. Atualizar limites e preços para cada plano
UPDATE public.plans SET 
  price_brl = 0, 
  lead_limit = 5, 
  request_limit = 50,
  agent_limit = 1 
WHERE slug = 'free';

UPDATE public.plans SET 
  price_brl = 4790, 
  lead_limit = 300, 
  request_limit = 1000, -- Definindo um limite razoável para Starter
  agent_limit = 3 
WHERE slug = 'starter';

UPDATE public.plans SET 
  price_brl = 9790, 
  lead_limit = 3000, 
  request_limit = 10000, -- Definindo um limite razoável para Pro
  agent_limit = 10 
WHERE slug = 'pro';

UPDATE public.plans SET 
  price_brl = 19790, 
  lead_limit = 10000, -- Cap de segurança para o plano Scale na API
  request_limit = 50000,
  agent_limit = 100 
WHERE slug = 'scale';

-- 2. Garantir que os planos existam com os valores corretos
INSERT INTO public.plans (slug, name, price_brl, lead_limit, request_limit, agent_limit)
SELECT 'free', 'Free', 0, 5, 50, 1 WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'free');

INSERT INTO public.plans (slug, name, price_brl, lead_limit, request_limit, agent_limit)
SELECT 'starter', 'Starter', 4790, 300, 1000, 3 WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'starter');

INSERT INTO public.plans (slug, name, price_brl, lead_limit, request_limit, agent_limit)
SELECT 'pro', 'Pro', 9790, 3000, 10000, 10 WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'pro');

INSERT INTO public.plans (slug, name, price_brl, lead_limit, request_limit, agent_limit)
SELECT 'scale', 'Scale', 19790, 10000, 50000, 100 WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE slug = 'scale');

-- 3. Atualizar Cupons de Desconto
-- Desativar OFF50 antigo
UPDATE public.vox_coupons SET is_active = false WHERE code = 'OFF50';

-- Inserir ou atualizar OFF30 (30% de desconto)
INSERT INTO public.vox_coupons (code, discount_percentage, is_active, max_uses, current_uses, description)
SELECT 'OFF30', 30, true, 1000, 0, 'Desconto de 30% no primeiro mês ou trimestre'
WHERE NOT EXISTS (SELECT 1 FROM public.vox_coupons WHERE code = 'OFF30');

UPDATE public.vox_coupons SET 
  discount_percentage = 30,
  is_active = true
WHERE code = 'OFF30';
