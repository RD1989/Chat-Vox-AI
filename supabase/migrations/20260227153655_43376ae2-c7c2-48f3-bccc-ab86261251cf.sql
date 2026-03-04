
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vox Settings (chat config per user)
CREATE TABLE public.vox_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_name TEXT NOT NULL DEFAULT 'Vox',
  ai_avatar_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#6366f1',
  welcome_message TEXT NOT NULL DEFAULT 'Olá! Como posso ajudar você hoje?',
  meta_pixel TEXT,
  tiktok_pixel TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.vox_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own settings" ON public.vox_settings FOR ALL USING (auth.uid() = user_id);

-- Vox Leads
CREATE TABLE public.vox_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'novo',
  source TEXT,
  ip_address TEXT,
  city TEXT,
  region TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  qualified BOOLEAN NOT NULL DEFAULT false,
  qualification_score INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vox_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own leads" ON public.vox_leads FOR ALL USING (auth.uid() = user_id);

-- Vox Messages
CREATE TABLE public.vox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.vox_leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vox_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own messages" ON public.vox_messages FOR ALL USING (auth.uid() = user_id);

-- Enable realtime for leads and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.vox_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vox_messages;
