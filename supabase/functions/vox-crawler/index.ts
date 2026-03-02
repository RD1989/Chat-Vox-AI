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
        const { url, user_id, agent_id } = await req.json();

        if (!url || !user_id) {
            throw new Error("URL e User ID são obrigatórios.");
        }

        console.log(`[vox-crawler] Crawling URL: ${url}`);

        // 1. Fetch the page
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Falha ao acessar a URL: ${response.statusText}`);
        const html = await response.text();

        // 2. Simple clean up of the HTML to save tokens (remove script/style)
        const cleanHtml = html
            .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
            .replace(/<[^>]*>?/gm, " ") // replace tags with spaces
            .replace(/\s+/g, " ") // collapse whitespace
            .trim()
            .slice(0, 15000); // Limit context size

        // 3. Use Gemini to extract knowledge
        const googleApiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
        if (!googleApiKey) throw new Error("Google API Key não configurada.");

        const prompt = `Você é um extrator de conhecimento especializado. 
Analise o texto abaixo extraído de um site e resuma as informações MAIS IMPORTANTES para serem usadas por um bot de atendimento.
Foque em: Serviços oferecidos, Preços, FAQ, Horários e Políticas.
Gere um resumo estruturado e direto no idioma original do site.

TEXTO DO SITE:
${cleanHtml}`;

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.2 }
                })
            }
        );

        const geminiData = await geminiRes.json();
        const extractedContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!extractedContent) throw new Error("Falha na extração com Gemini.");

        // 4. Insert into vox_knowledge
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data, error: kbError } = await supabase
            .from("vox_knowledge")
            .insert({
                user_id,
                agent_id: agent_id || null,
                title: `Crawl: ${new URL(url).hostname}`,
                content: extractedContent,
                category: "geral",
                is_active: true
            })
            .select()
            .single();

        if (kbError) throw kbError;

        return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("[vox-crawler] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
