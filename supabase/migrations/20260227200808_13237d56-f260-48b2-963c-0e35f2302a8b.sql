
-- Knowledge base table for storing FAQ/context entries
CREATE TABLE public.vox_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'geral',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.vox_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own knowledge" ON public.vox_knowledge
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can read knowledge for chat" ON public.vox_knowledge
  FOR SELECT USING (true);

-- Rate limiting table
CREATE TABLE public.vox_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  user_id UUID NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_vox_rate_limits_ip_window ON public.vox_rate_limits (ip_address, user_id, window_start);

-- Cleanup function for expired rate limit windows
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.vox_rate_limits WHERE window_start < now() - interval '1 hour';
$$;
