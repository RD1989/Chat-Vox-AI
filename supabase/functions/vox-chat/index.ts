import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// Tool definitions for interactive elements
const INTERACTIVE_TOOLS = [
  {
    type: "function",
    function: {
      name: "show_quick_replies",
      description: "Exibe botões de resposta rápida para o usuário escolher. É OBRIGATÓRIO O USO DESSA FERRAMENTA toda vez que você oferecer opções de múltipla escolha ao lead, como escolher um serviço (X ou Y), confirmar algo, ou navegar no fluxo de conversa.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Mensagem de texto que acompanha os botões" },
          buttons: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string", description: "Texto exibido no botão" },
                value: { type: "string", description: "Valor enviado quando o botão é clicado" },
              },
              required: ["label", "value"],
            },
            description: "Lista de botões (máximo 5)",
          },
        },
        required: ["message", "buttons"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "show_form",
      description: "Exibe um formulário inline para o lead preencher dados de contato ou informações necessárias. Use quando precisar coletar múltiplas informações de uma vez, como nome, email, telefone, ou dados específicos do serviço.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Mensagem explicativa antes do formulário" },
          fields: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Identificador do campo (ex: email, phone)" },
                label: { type: "string", description: "Rótulo exibido ao usuário" },
                type: { type: "string", enum: ["text", "email", "tel", "number", "textarea", "select"], description: "Tipo do campo" },
                placeholder: { type: "string", description: "Texto placeholder" },
                required: { type: "boolean", description: "Se o campo é obrigatório" },
                options: {
                  type: "array",
                  items: { type: "string" },
                  description: "Opções para campos do tipo select",
                },
              },
              required: ["name", "label", "type"],
            },
            description: "Lista de campos do formulário",
          },
          submit_label: { type: "string", description: "Texto do botão de enviar (default: Enviar)" },
        },
        required: ["message", "fields"],
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // ── Fallback lead creation (bypass RLS via service_role) ──
    if (body.action === "create_lead") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { user_id, name, status, source, city, region, ip_address, utm_source, utm_medium, utm_campaign } = body;
      const { data, error } = await supabase.from("vox_leads").insert({
        user_id, name, status: status || "novo", source: source || "chat",
        city, region, ip_address, utm_source, utm_medium, utm_campaign,
      }).select("id").single();

      if (error) {
        console.error("[vox-chat] create_lead error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ lead_id: data.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, user_id, lead_id, agent_id } = body;
    console.log(`[vox-chat] Request starting: user=${user_id}, lead=${lead_id}, agent=${agent_id}`);

    if (!messages || !Array.isArray(messages) || !user_id) {
      return new Response(
        JSON.stringify({ error: "messages (array) and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // --- Rate Limiting ---
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    const { count: requestCount } = await supabase
      .from("vox_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", clientIp)
      .eq("user_id", user_id)
      .gte("window_start", windowStart);

    if ((requestCount || 0) >= RATE_LIMIT_MAX) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }

    await supabase.from("vox_rate_limits").insert({
      ip_address: clientIp,
      user_id: user_id,
      window_start: new Date().toISOString(),
    });

    if (Math.random() < 0.05) {
      supabase.rpc("cleanup_rate_limits").then(() => { }).catch(() => { });
    }

    // --- Fetch Settings ---
    const settingsKeys = ["openrouter_api_key", "openrouter_model", "vision_model"];
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", settingsKeys);

    const apiKey = settings?.find((s: any) => s.key === "openrouter_api_key")?.value;
    const globalModel = settings?.find((s: any) => s.key === "openrouter_model")?.value || "google/gemini-3-flash-preview";
    const globalVisionModel = settings?.find((s: any) => s.key === "vision_model")?.value || "google/gemini-3-flash-preview";

    if (!apiKey) {
      console.error("[vox-chat] API Key missing in system_settings");
      return new Response(
        JSON.stringify({ error: "OpenRouter API key not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Check User Plan and Limits (SAS PROFITABILITY) ---
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user_id)
      .single();

    const currentPlan = profile?.plan || "free";

    // Fetch plan limits
    const { data: planLimits } = await supabase
      .from("plans")
      .select("lead_limit, request_limit")
      .eq("slug", currentPlan)
      .single();

    // Count messages (Total usage for the user)
    const { count: messageCount } = await supabase
      .from("vox_messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id);

    // Hard Stop: Request Limit (Messages)
    const requestLimitReached = planLimits?.request_limit !== null && (messageCount || 0) >= planLimits?.request_limit;

    if (requestLimitReached) {
      return new Response(
        JSON.stringify({
          error: "Cota de mensagens atingida para seu plano (" + currentPlan + ").",
          details: "Você utilizou " + messageCount + " de " + planLimits?.request_limit + " mensagens permitidas. Faça upgrade para o plano Scale para uso ilimitado."
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count leads
    const { count: leadCount } = await supabase
      .from("vox_leads")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id);

    const limitReached = planLimits?.lead_limit !== null && (leadCount || 0) >= planLimits.lead_limit;

    if (limitReached) {
      return new Response(
        JSON.stringify({ error: "Limite de leads atingido para o plano " + currentPlan + ". Faça upgrade para continuar capturando." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Fetch Vox Settings (agent-specific or user-level fallback) ---
    let vs: any = null;
    if (agent_id) {
      const { data: agentData } = await supabase
        .from("vox_agents")
        .select("*")
        .eq("id", agent_id)
        .eq("user_id", user_id)
        .maybeSingle();
      if (agentData) vs = agentData;
    }

    // --- Lead History & Recognition ---
    let leadRecognitionNote = "";
    if (lead_id) {
      const { count: msgCount } = await supabase
        .from("vox_messages")
        .select("*", { count: "exact", head: true })
        .eq("lead_id", lead_id);

      if (msgCount && msgCount > 10) {
        leadRecognitionNote = "\n[NOTA: Este é um lead recorrente e já conversou bastante. Seja mais informal e acolhedor.]";
      } else if (msgCount && msgCount > 0) {
        leadRecognitionNote = "\n[NOTA: O lead retornou para continuar a conversa. Retome do ponto onde pararam.]";
      }
    }

    // Fallback to user-level vox_settings
    if (!vs) {
      const { data: voxSettings } = await supabase
        .from("vox_settings")
        .select("*")
        .eq("user_id", user_id)
        .maybeSingle();
      vs = voxSettings;
    }

    const aiName = vs?.ai_name || vs?.name || "Vox";
    const webhookUrl = vs?.webhook_url || null;

    // Determine models to use (Agent specific override)
    const model = vs?.openrouter_model || globalModel;
    const visionModel = vs?.vision_model || globalVisionModel;

    console.log(`[vox-chat] Agent: ${aiName}, Using model: ${model}, Vision: ${visionModel}`);

    // --- Fetch Knowledge Base (Semantic Search using Vector DB) ---
    let knowledgeContext = "";
    const lastUserMsg = messages[messages.length - 1];
    const userText = (typeof lastUserMsg?.content === "string"
      ? lastUserMsg.content
      : Array.isArray(lastUserMsg?.content)
        ? lastUserMsg.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join(" ")
        : ""
    ).trim();

    if (userText) {
      try {
        // 1. Generate query embedding
        const googleApiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
        const embedRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${googleApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "models/text-embedding-004",
              content: { parts: [{ text: userText }] },
            }),
          }
        );
        const embedData = await embedRes.json();
        const queryEmbedding = embedData.embedding?.values;

        if (queryEmbedding) {
          // 2. Search using match_knowledge RPC
          const { data: matchResult, error: matchError } = await supabase.rpc("match_knowledge", {
            query_embedding: queryEmbedding,
            match_threshold: 0.5,
            match_count: 5,
            p_user_id: user_id,
            p_agent_id: agent_id || null
          });

          if (!matchError && matchResult && matchResult.length > 0) {
            knowledgeContext = "\n\nBASE DE CONHECIMENTO (BUSCA SEMÂNTICA):\n" +
              matchResult.map((e: any) =>
                `[FONTE: ${e.title}] (${e.category})\n${e.content}`
              ).join("\n---\n");
            console.log(`[vox-chat] Semantic search found ${matchResult.length} relevant entries.`);
          }
        }
      } catch (e) {
        console.error("[vox-chat] Semantic search failed, falling back to basic context:", e);
      }
    }

    // --- Fetch Conversion Buttons ---
    let conversionButtonsPrompt = "";
    if (agent_id) {
      const { data: buttons } = await supabase
        .from("vox_agent_buttons")
        .select("label, description")
        .eq("agent_id", agent_id)
        .eq("is_active", true);

      if (buttons && buttons.length > 0) {
        conversionButtonsPrompt = "\n\nBOTÕES DE CONVERSÃO DISPONÍVEIS (MUITO IMPORTANTE):\n" +
          "Você tem acesso a 'Atalhos de Conversão' rápidos. Quando o lead demonstrar interesse em um desses tópicos, você DEVE encerrar sua resposta chamando o botão usando o marcador exato: [BUTTON: Rótulo do Botão].\n" +
          "Instrução: Use apenas UM botão por mensagem, o mais relevante.\n" +
          "Botões disponíveis para este agente:\n" +
          buttons.map((b: any) => `- [BUTTON: ${b.label}]: ${b.description || 'Use este botão para conversão'}`).join("\n");
      }
    }

    // --- Build System Prompt ---
    const customPrompt = vs?.system_prompt?.trim();
    const interactiveInstructions = `

ELEMENTOS INTERATIVOS (MUITO IMPORTANTE):
Você tem a OBRIGAÇÃO de usar ferramentas especiais de interface gráfica para interagir com o usuário, abandonando textos planos de opções.

⚠️ REGRA DE OURO PARA CONTEXTO:
Toda vez que você usar uma ferramenta (show_quick_replies ou show_form), você DEVE preencher o campo 'message' com a pergunta ou o texto de contexto que descreve as opções. 
Exemplo: Se você vai mostrar botões de planos, a 'message' deve ser "Qual desses planos faz mais sentido para o seu momento atual?".
Isso é vital porque o usuário precisa ler a pergunta ANTES de clicar nos botões.

1. show_quick_replies: Você DEVE usar essa ferramenta SEMPRE que for oferecer respostas de múltipla escolha para o usuário.
   - Exemplo absoluto: Se a pergunta for "Você prefere X ou Y?", você NÃO pode escrever as opções em texto. Você DEVE usar a ferramenta show_quick_replies chamando os botões "X" e "Y".
   - Regra de Ouro: Nunca liste opções como "1. Teste 2. Outro" em formato de texto. SEMPRE os chame via 'show_quick_replies'.
   - Use para Sim/Não, escolher dia da semana, escolher orçamento, etc.

2. show_form: Use para coletar múltiplas informações complexas de uma vez (nome, email, etc).

REGRAS DE USO (OBRIGATÓRIO):
- USE BOTÕES (show_quick_replies) ASSIM QUE HOUVEREM ESCOLHAS PARA O USUÁRIO (2 a 5 opções sempre serão botões).
- Use formulário quando precisar de 2+ informações de uma vez.
- Não deixe de ser estratégico, use os botões a todo momento para engajar o usuário.
- Quando o lead responder a um botão/formulário, continue o diálogo e prossiga se baseando na escolha do botão.
${conversionButtonsPrompt}

ANÁLISE DE IMAGENS E DOCUMENTOS:
- Você pode receber imagens (fotos, comprovantes, documentos, screenshots)
- Analise cada imagem com atenção e descreva o que você vê
- Se receber um comprovante de pagamento (PIX, transferência, boleto), identifique: valor, data, beneficiário
- Se receber um documento, extraia as informações relevantes
- Confirme ao lead que você recebeu e entendeu o conteúdo da imagem
- Use as informações da imagem para avançar no atendimento`;

    const basePrompt = customPrompt
      ? customPrompt + interactiveInstructions
      : `Você é ${aiName}, um assistente de IA amigável e profissional. Você ajuda leads a tirar dúvidas, agendar consultas e conhecer os serviços oferecidos. Seja conciso, educado e focado em converter leads em clientes. Sempre responda em português brasileiro.

ESTRUTURA DE PENSAMENTO (CHAIN OF THOUGHT):
1. ATENÇÃO: Identifique a intenção do usuário e se ele é um cliente recorrente.
2. CONTEXTO: Use a Base de Conhecimento fornecida para responder com precisão.
3. CONVERSÃO: Se o lead demonstrar interesse real, use 'show_form' para capturar dados ou 'show_quick_replies' para agendar.

REGRAS IMPORTANTES:
- Seja natural e humano, não robótico.
- Comunique-se de forma simples e humana. Evite termos técnicos complexos ou linguagem rebuscada. Use a forma mais simples e direta possível para ser entendido por qualquer pessoa.
- Se o histórico de mensagens for longo, reconheça que já estão conversando há algum tempo.
- Se o lead pedir atendimento humano, utilize o tom de transição suave.
- Nunca invente informações fora da Base de Conhecimento.
- FONTE ÚNICA DE VERDADE: Use APENAS a Base de Conhecimento para dados da empresa.
- SE NÃO SOUBER: Responda que não tem a informação e ofereça transbordo humano.
- NÃO INVENTE: Nunca crie telefones, preços ou endereços que não estejam na Base.` + interactiveInstructions;

    const systemPrompt = basePrompt + knowledgeContext + leadRecognitionNote;

    // --- Dynamic Lead Scoring (Initial Heuristics) ---
    if (lead_id) {
      const lastUserMsg = messages[messages.length - 1];
      const userText = (typeof lastUserMsg?.content === "string" ? lastUserMsg.content : "").toLowerCase();

      let scoreBoost = 0;
      if (userText.includes("@")) scoreBoost += 20;
      if (userText.match(/\d{8,}/)) scoreBoost += 20; // Possible phone
      if (userText.includes("preço") || userText.includes("valor") || userText.includes("quanto")) scoreBoost += 10;
      if (userText.includes("comprar") || userText.includes("contratar") || userText.includes("agendar")) scoreBoost += 30;

      if (scoreBoost > 0) {
        // We get current score first
        const { data: currentLead } = await supabase.from("vox_leads").select("qualification_score").eq("id", lead_id).single();
        const newScore = Math.min((currentLead?.qualification_score || 0) + scoreBoost, 100);

        await supabase.from("vox_leads").update({
          qualification_score: newScore,
          status: newScore > 70 ? "Quente" : newScore > 30 ? "Morno" : "Frio",
          qualified: newScore > 70,
          estimated_value: newScore > 70 ? (vs?.avg_conversion_value || 0) : 0,
          acquisition_cost: 5,
          updated_at: new Date().toISOString()
        } as any).eq("id", lead_id);
      }
    }

    // --- Save User Message ---
    if (lead_id) {
      const lastUserMsg = messages[messages.length - 1];
      if (lastUserMsg?.role === "user") {
        const textContent = typeof lastUserMsg.content === "string"
          ? lastUserMsg.content
          : Array.isArray(lastUserMsg.content)
            ? lastUserMsg.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join(" ")
            : "";
        const imageUrls = Array.isArray(lastUserMsg.content)
          ? lastUserMsg.content.filter((c: any) => c.type === "image_url").map((c: any) => c.image_url?.url)
          : [];

        await supabase.from("vox_messages").insert({
          user_id,
          lead_id,
          role: "user",
          content: textContent || "📎 Anexo",
          message_type: imageUrls.length > 0 ? "image" : "text",
          metadata: imageUrls.length > 0 ? { image_urls: imageUrls } : null,
        });
      }
    }

    // --- Detect if conversation has images (multimodal) ---
    const hasImages = messages.some((m: any) =>
      Array.isArray(m.content) && m.content.some((c: any) => c.type === "image_url")
    );

    // Model Selection logic based on Plan (Financial Protection)
    let selectedModel = hasImages ? visionModel : model;

    // Free and Starter plans are RESTRICTED to Flash models (lowest cost, highest margin)
    if (currentPlan === "free" || currentPlan === "starter") {
      selectedModel = "google/gemini-2.0-flash-001";
    }
    console.log(`[vox-chat] Final model selected: ${selectedModel} (Plan: ${currentPlan})`);

    // --- Call OpenRouter ---
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": supabaseUrl,
        "X-Title": "Vox AI Chat",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: INTERACTIVE_TOOLS,
        stream: true,
        max_tokens: 1024,
      }),
    });

    console.log(`[vox-chat] OpenRouter response status: ${response.status}`);

    if (!response.ok) {
      let errorMsg = `OpenRouter API error: ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.error?.message) {
          errorMsg = errorJson.error.message;
        }
      } catch (e) {
        // Se não for JSON, tenta pegar como texto
        try {
          const errorText = await response.text();
          if (errorText) errorMsg = errorText;
        } catch (e2) { }
      }

      console.error(`[vox-chat] Error from OpenRouter:`, errorMsg);

      // Sugestão amigável para erro 429 comum no OpenRouter
      if (response.status === 429 && errorMsg.toLowerCase().includes("credit")) {
        errorMsg = "Créditos insuficientes no OpenRouter. Por favor, recarregue sua conta para continuar usando o chat.";
      } else if (response.status === 429) {
        errorMsg = "Limite de requisições atingido no OpenRouter ou modelo congestionado. Tente novamente em alguns instantes ou troque o modelo no painel admin.";
      }

      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Stream Response + Collect Tool Calls ---
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let fullContent = "";
    const toolCalls: Record<number, { id: string; name: string; arguments: string }> = {};

    (async () => {
      try {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue;
            if (!trimmed.startsWith("data: ")) continue;
            const jsonStr = trimmed.slice(6).trim();
            if (jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const choice = parsed.choices?.[0];
              if (!choice) continue;

              const delta = choice.delta;

              // Handle text content
              if (delta?.content) {
                fullContent += delta.content;
                // Forward text SSE to client
                await writer.write(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: delta.content } }] })}\n\n`));
              }

              // Handle tool calls
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  if (!toolCalls[idx]) {
                    toolCalls[idx] = { id: tc.id || "", name: tc.function?.name || "", arguments: "" };
                  }
                  if (tc.function?.name) toolCalls[idx].name = tc.function.name;
                  if (tc.function?.arguments) toolCalls[idx].arguments += tc.function.arguments;
                  if (tc.id) toolCalls[idx].id = tc.id;
                }
              }
            } catch { /* partial JSON */ }
          }
        }

        // Process remaining buffer
        if (buffer.trim()) {
          const trimmed = buffer.trim();
          if (trimmed.startsWith("data: ") && !trimmed.includes("[DONE]")) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const delta = parsed.choices?.[0]?.delta;
              if (delta?.content) {
                fullContent += delta.content;
                await writer.write(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: delta.content } }] })}\n\n`));
              }
            } catch { }
          }
        }

        // --- Send interactive elements as special SSE events ---
        for (const idx of Object.keys(toolCalls).sort()) {
          const tc = toolCalls[Number(idx)];
          try {
            const args = JSON.parse(tc.arguments);
            await writer.write(encoder.encode(`data: ${JSON.stringify({
              type: "interactive",
              interactive_type: tc.name,
              data: args,
            })}\n\n`));
          } catch (e) {
            console.error("Failed to parse tool call args:", e, tc.arguments);
          }
        }

        await writer.write(encoder.encode("data: [DONE]\n\n"));

        // --- Post-stream: Save + Qualify + Webhook ---
        const savedContent = fullContent.trim() || Object.values(toolCalls).map(tc => {
          try { return JSON.parse(tc.arguments)?.message || ""; } catch { return ""; }
        }).filter(Boolean).join("\n");

        if (lead_id && savedContent) {
          await supabase.from("vox_messages").insert({
            user_id,
            lead_id,
            role: "assistant",
            content: savedContent,
            message_type: Object.keys(toolCalls).length > 0 ? "interactive" : "text",
            metadata: Object.keys(toolCalls).length > 0 ? {
              tool_calls: Object.values(toolCalls).map(tc => ({
                name: tc.name,
                arguments: (() => { try { return JSON.parse(tc.arguments); } catch { return tc.arguments; } })(),
              }))
            } : null,
          });

          // Auto-qualify + auto-tag + handoff detection
          const { count } = await supabase
            .from("vox_messages")
            .select("*", { count: "exact", head: true })
            .eq("lead_id", lead_id);

          if (count && count >= 4) {
            const msgCount = count || 0;
            let score = Math.min(msgCount * 10, 60);
            const fullConvo = messages.map((m: any) => m.content).join(" ").toLowerCase();

            const buySignals = ["preço", "valor", "quanto custa", "agendar", "comprar", "contratar", "orçamento", "disponível", "quando posso", "como funciona"];
            for (const signal of buySignals) {
              if (fullConvo.includes(signal)) score += 8;
            }
            score = Math.min(score, 100);
            const qualified = score >= 60;

            // Auto-generate tags based on conversation
            const autoTags: string[] = [];
            if (score >= 80) autoTags.push("Quente");
            else if (score >= 60) autoTags.push("Morno");
            else autoTags.push("Frio");

            const highTicketSignals = ["high ticket", "premium", "vip", "enterprise", "personalizado"];
            if (highTicketSignals.some(s => fullConvo.includes(s))) autoTags.push("High Ticket");

            const urgencySignals = ["urgente", "agora", "hoje", "imediato", "rápido"];
            if (urgencySignals.some(s => fullConvo.includes(s))) autoTags.push("Urgente");

            // Detect handoff request
            const handoffSignals = ["falar com humano", "atendente", "pessoa real", "falar com alguém", "atendimento humano", "falar com uma pessoa", "quero falar com alguem"];
            const handoffRequested = handoffSignals.some(s => fullConvo.includes(s));
            if (handoffRequested) autoTags.push("Transbordo");

            // Merge with existing tags
            const { data: existingLead } = await supabase
              .from("vox_leads")
              .select("tags")
              .eq("id", lead_id)
              .single();

            const existingTags: string[] = (existingLead as any)?.tags || [];
            const mergedTags = [...new Set([...existingTags, ...autoTags])];

            await supabase
              .from("vox_leads")
              .update({
                qualification_score: score,
                qualified,
                status: qualified ? "qualificado" : "novo",
                tags: mergedTags,
                handoff_requested: handoffRequested || (existingLead as any)?.handoff_requested || false,
                updated_at: new Date().toISOString(),
              })
              .eq("id", lead_id);
          }

          // Webhook
          if (webhookUrl) {
            try {
              const { data: leadData } = await supabase
                .from("vox_leads")
                .select("*")
                .eq("id", lead_id)
                .single();

              await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  event: "message.received",
                  lead: leadData,
                  message: { role: "assistant", content: savedContent },
                  timestamp: new Date().toISOString(),
                }),
              });
            } catch (e) {
              console.error("Webhook error:", e);
            }
          }
        }
      } catch (e) {
        console.error("Stream processing error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("vox-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
