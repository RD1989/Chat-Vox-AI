-- Adicionar limite de requisições (mensagens) aos planos
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS request_limit integer;

-- Atualizar limites por plano
-- Free: 100 mensagens
UPDATE public.plans SET request_limit = 100 WHERE slug = 'free';

-- Starter: 2.000 mensagens
UPDATE public.plans SET request_limit = 2000 WHERE slug = 'starter';

-- Pro: 10.000 mensagens
UPDATE public.plans SET request_limit = 10000 WHERE slug = 'pro';

-- Scale: Ilimitado (NULL)
UPDATE public.plans SET request_limit = NULL WHERE slug = 'scale';
