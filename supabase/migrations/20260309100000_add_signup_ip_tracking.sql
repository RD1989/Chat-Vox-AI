-- Criação da coluna de rastreamento de IP se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='signup_ip') THEN
        ALTER TABLE profiles ADD COLUMN signup_ip text;
        
        -- Adicionando índice para otimizar a checagem de anti-fraude na Edge Function
        CREATE INDEX idx_profiles_signup_ip ON profiles(signup_ip);
    END IF;
END $$;
