
-- Enable RLS on rate limits (service role only access via edge function)
ALTER TABLE public.vox_rate_limits ENABLE ROW LEVEL SECURITY;

-- Fix search path on cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  DELETE FROM public.vox_rate_limits WHERE window_start < now() - interval '1 hour';
$$;
