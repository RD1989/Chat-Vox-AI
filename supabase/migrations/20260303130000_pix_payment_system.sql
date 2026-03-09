-- Tabela para gerenciar transações de pagamento Pix
CREATE TABLE IF NOT EXISTS public.vox_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_slug TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, expired, cancelled
    pix_id TEXT, -- ID retornado pela EFI (txid ou e2eid)
    pix_qrcode_base64 TEXT,
    pix_copiapasta TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.vox_payments ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can view their own payments" ON public.vox_payments
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Logs de Webhooks (Auditoria e Debug)
CREATE TABLE IF NOT EXISTS public.vox_payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.vox_payments(id) ON DELETE SET NULL,
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.vox_payment_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs
CREATE POLICY "Admins can view payment logs" ON public.vox_payment_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Trigger para updated_at
CREATE TRIGGER set_updated_at_payments
BEFORE UPDATE ON public.vox_payments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Adicionar chaves EFI em system_settings se não existirem
INSERT INTO public.system_settings (key, value) VALUES 
('efi_client_id', ''),
('efi_client_secret', ''),
('efi_account_id', ''), -- ID de Conta para tokenização (frontend)
('efi_pix_key', ''), -- Chave Pix para recebimento
('efi_certificate_p12', ''), -- Certificado em Base64
('efi_sandbox', 'true')
ON CONFLICT (key) DO NOTHING;
