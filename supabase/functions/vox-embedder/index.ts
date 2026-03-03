import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
        const { text } = await req.json();

        if (!text) {
            throw new Error("Texto é obrigatório para gerar embedding.");
        }

        const googleApiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
        if (!googleApiKey) {
            throw new Error("GOOGLE_GENERATIVE_AI_API_KEY não configurada.");
        }

        console.log(`[vox-embedder] Generating embedding for: ${text.substring(0, 50)}...`);

        // Call Gemini Embedding API (text-embedding-004)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${googleApiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "models/text-embedding-004",
                    content: { parts: [{ text }] },
                }),
            }
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || "Erro desconhecido na API do Gemini.");
        }

        const embedding = data.embedding?.values;

        if (!embedding) {
            throw new Error("Falha ao obter vetor de embedding da resposta.");
        }

        return new Response(JSON.stringify({ embedding }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("[vox-embedder] Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
