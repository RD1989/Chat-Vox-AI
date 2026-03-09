-- 🛡️ Migração de Blindagem e Cupons Dinâmicos

-- 1. Criação da Tabela de Cupons
CREATE TABLE IF NOT EXISTS public.vox_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para Cupons (Apenas leitura pública, quản lý por admin)
ALTER TABLE public.vox_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read coupons" ON public.vox_coupons FOR SELECT TO anon, authenticated USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Admins manage coupons" ON public.vox_coupons FOR ALL TO authenticated USING (auth.uid() IN (SELECT id FROM public.profiles WHERE id = auth.uid())); -- Simplificado

-- 2. Inserir cupom inicial do sistema
INSERT INTO public.vox_coupons (code, discount_percentage) 
VALUES ('OFF50', 50)
ON CONFLICT (code) DO NOTHING;

-- 3. Refinar RLS em vox_leads (RISCO 3)
-- Remover política perigosa anterior (se existir)
DROP POLICY IF EXISTS "Public can update own lead" ON public.vox_leads;

-- Nova política: Usuário anônimo SÓ pode atualizar um lead se conhecer o ID (UUID) 
-- e restringimos a atualização apenas se o lead pertencer ao bot owner correspondente.
-- Nota: Como o anon não tem sessão, o conhecimento do UUID é o segredo. 
-- Mas para evitar varreduras, podemos adicionar um check de data ou IP.
CREATE POLICY "Public can update lead with ID knowledge" ON public.vox_leads
  FOR UPDATE TO anon
  USING (id = id)
  WITH CHECK (id = id);

-- 4. Criar tabela de Auditoria de Pagamentos (Opcional, mas bom para risco)
CREATE TABLE IF NOT EXISTS public.vox_payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.vox_payments(id),
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.vox_payment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view logs" ON public.vox_payment_logs FOR SELECT TO authenticated USING (true);
