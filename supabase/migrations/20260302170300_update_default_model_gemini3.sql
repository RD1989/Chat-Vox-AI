-- Update global model setting to Gemini 3 Flash Preview
INSERT INTO public.system_settings (key, value, description)
VALUES ('openrouter_model', 'google/gemini-3-flash-preview', 'Modelo padrão do OpenRouter')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

INSERT INTO public.system_settings (key, value, description)
VALUES ('vision_model', 'google/gemini-3-flash-preview', 'Modelo Vision padrão do OpenRouter')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
