import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio_data, audio_format, user_id, lead_id, messages, mode } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get OpenRouter API key
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["audio_api_key", "openrouter_api_key"]);

    // Prefer dedicated audio key, fallback to general openrouter key
    const audioKey = settings?.find((s: any) => s.key === "audio_api_key")?.value;
    const fallbackKey = settings?.find((s: any) => s.key === "openrouter_api_key")?.value;
    const apiKey = audioKey || fallbackKey;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Audio API key not configured. Set it in the admin panel." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get voice settings
    const { data: voxSettings } = await supabase
      .from("vox_settings")
      .select("voice_enabled, voice_response_pct, voice_name, voice_speed, voice_show_text, voice_accent, ai_name, system_prompt")
      .eq("user_id", user_id)
      .maybeSingle();

    const vs = voxSettings as any;

    // === MODE: TRANSCRIBE (user sent audio) ===
    if (mode === "transcribe") {
      if (!audio_data) {
        return new Response(
          JSON.stringify({ error: "audio_data is required for transcription" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": supabaseUrl,
          "X-Title": "Vox AI Audio",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini-audio-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Transcreva este áudio fielmente em português brasileiro. Retorne APENAS o texto transcrito, sem comentários." },
                {
                  type: "input_audio",
                  input_audio: {
                    data: audio_data,
                    format: audio_format || "wav",
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Transcription error:", response.status, errorText);
        return new Response(
          JSON.stringify({ error: `Transcription failed: ${response.status}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await response.json();
      const transcription = result.choices?.[0]?.message?.content || "";

      return new Response(
        JSON.stringify({ transcription }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === MODE: TTS (generate audio response) ===
    if (mode === "tts") {
      const textToSpeak = messages?.[0]?.content;
      if (!textToSpeak) {
        return new Response(
          JSON.stringify({ error: "text content is required for TTS" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const voiceName = vs?.voice_name || "alloy";
      const voiceSpeed = vs?.voice_speed || 1.0;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": supabaseUrl,
          "X-Title": "Vox AI TTS",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini-audio-preview",
          modalities: ["text", "audio"],
          audio: {
            voice: voiceName,
            format: "mp3",
            speed: voiceSpeed,
          },
          messages: [
            {
              role: "system",
              content: `Você é ${vs?.ai_name || "Vox"}. Repita o texto a seguir de forma natural em ${vs?.voice_accent || "pt-BR"}. Não adicione nada, apenas reproduza o texto em voz.`,
            },
            {
              role: "user",
              content: textToSpeak,
            },
          ],
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("TTS error:", response.status, errorText);
        return new Response(
          JSON.stringify({ error: `TTS failed: ${response.status}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await response.json();
      const audioData = result.choices?.[0]?.message?.audio?.data;
      const audioTranscript = result.choices?.[0]?.message?.audio?.transcript;

      return new Response(
        JSON.stringify({ 
          audio_data: audioData || null,
          transcript: audioTranscript || textToSpeak,
          format: "mp3",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid mode. Use 'transcribe' or 'tts'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("vox-audio error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
