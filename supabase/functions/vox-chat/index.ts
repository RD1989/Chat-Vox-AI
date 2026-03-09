import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// Helper to extract sections from prompt tags
const parseSystemPrompt = (prompt: string) => {
  const parseSection = (tag: string) => {
    const regex = new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, 'i');
    const match = prompt.match(regex);
    return match ? match[1].trim() : '';
  };
  return {
    voice_tone: parseSection('TONE'),
    priorities: parseSection('PRIORITIES'),
    restrictions: parseSection('RESTRICTIONS'),
    base_prompt: parseSection('BASE_PROMPT') || prompt.replace(/\[(TONE|PRIORITIES|RESTRICTIONS|BASE_PROMPT)\][\s\S]*?\[\/\1\]/gi, '').trim()
  };
};

// Tool definitions for interactive elements
const INTERACTIVE_TOOLS = [
  {
    type: "function",
    function: {
      name: "show_quick_replies",
      description: "OBRIGATÓRIO: Exibe botões clicáveis de resposta rápida para o usuário escolher entre opções. DEVE ser chamado SEMPRE que a mensagem contiver uma pergunta com opções (mesmo que implícita). NUNCA liste opções como '1, 2, 3' ou 'A, B, C' em texto puro — isso é proibido. Se você vai oferecer alternativas como 'Plano X ou Plano Y?', 'Prefere WhatsApp ou E-mail?', 'Sim ou Não?', use SEMPRE esta ferramenta para criar os botões. Crie de 2 a 5 botões por mensagem.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Mensagem de texto que acompanha os botões" },
          buttons: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string", description: "Texto exibido no botão (máx. 25 caracteres, curto e direto)" },
                value: { type: "string", description: "Valor enviado quando o botão é clicado (pode ser igual ao label)" },
              },
              required: ["label", "value"],
            },
            description: "Lista de botões (mínimo 2, máximo 5). Textos concisos.",
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
  {
    type: "function",
    function: {
      name: "exibir_prova_social",
      description: "Envia provas sociais, depoimentos e resultados de clientes para o lead. Use quando o lead estiver indeciso ou precisar de mais confiança para fechar.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Mensagem persuasiva que acompanha as provas sociais" },
        },
        required: ["message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "exibir_midia_produto",
      description: "Exibe fotos ou vídeos demonstrativos do produto ou serviço. Use quando o lead pedir para ver fotos, como funciona, ou demonstrar qualidade.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Mensagem descritiva das mídias enviadas" },
        },
        required: ["message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "gerar_pagamento_pix",
      description: "Gera um código Pix Copia e Cola e um QR Code para pagamento direto no chat. Use quando o lead decidir comprar ou pedir para pagar.",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Mensagem que acompanha o QR Code de pagamento" },
          amount: { type: "number", description: "Valor do pagamento em Reais (opcional, usa padrão do agente se vazio)" },
        },
        required: ["message"],
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
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

    // Skip validation for create_lead action as it has its own logic
    if (body.action !== "create_lead") {
      if (!messages || !Array.isArray(messages) || !user_id) {
        return new Response(
          JSON.stringify({ error: "messages (array) and user_id are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
    const { data: dbPlanLimits } = await supabase
      .from("plans")
      .select("lead_limit, request_limit")
      .eq("slug", currentPlan)
      .single();

    // Forçar escassez no plano Free, independente do que estiver na base legada
    const planLimits = currentPlan === "free"
      ? { lead_limit: 5, request_limit: 50 }
      : dbPlanLimits;

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

    // --- Build System Prompt (SKILL STYLE - HIGH CONVERSION) ---
    const rawPrompt = vs?.system_prompt || "";
    const parsed = parseSystemPrompt(rawPrompt);

    const interactiveInstructions = `
# 🧠 DIRETRIZES DE INTELIGÊNCIA ESTRATÉGICA

Você é um **Arquiteto de Vendas e Consultor Estratégico**.
Seu objetivo é **MAXIMIZAR A CONVERSÃO** usando as regras abaixo:

### 🎭 Sua Identidade e Tom de Voz
- **TOM CONFIGURADO**: ${parsed.voice_tone || "Profissional, consultivo e focado em conversão."}
- **DIRETRIZ**: Você DEVE seguir rigorosamente o tom acima. Se for 'Descontraído', use emojis e linguagem leve. Se for 'Formal', seja estritamente profissional.

### 🛠️ USO MESTRE DE FERRAMENTAS INTERATIVAS (LEI MÁXIMA — NUNCA ignore)
A interface do Vox é visual e interativa. **É ABSOLUTAMENTE PROIBIDO listar opções em texto simples (ex: "1. Opção A 2. Opção B" ou "A) ... B) ...").**

1. **show_quick_replies (Múltipla Escolha — OBRIGATÓRIO):**
   - **REGRA ABSOLUTA**: Toda vez que sua resposta terminar com uma pergunta que tenha 2 ou mais alternativas de resposta, você é OBRIGADO a chamar a ferramenta 'show_quick_replies' com os botões correspondentes.
   - Exemplos onde DEVE usar botões: "Qual plano te interessa? Starter ou Pro?", "Prefere falar por WhatsApp ou E-mail?", "Já conhecia o produto? (Sim / Não)", "Qual o seu maior desafio hoje? (Vendas / Atendimento / Tráfego)"
   - Crie de 2 a 5 botões por mensagem. Labels curtos (até 25 caracteres).
   - NUNCA use marcadores, numeração ou letras quando os botões estiverem disponíveis.

2. **show_form (Captura de Leads):**
   - Use assim que o lead demonstrar interesse real ou para "desbloquear" uma oferta.
   - Peça WhatsApp para "garantir a reserva".

3. **exibir_prova_social (Gatilho de Confiança):**
   - Use proativamente se o lead demonstrar dúvida ou pedir resultados.

4. **exibir_midia_produto (Demonstração Visual):**
   - Use para mostrar fotos reais ou demonstrações.

5. **gerar_pagamento_pix (O Fechamento):**
   - Use quando o lead perguntar o preço ou disser que "quer fechar".

### 📋 CAPTURA ORGÂNICA DE LEADS (Se aplicável)
- **REGRA**: Caso a captura automática esteja desativada, você deve obter o **Nome** e **WhatsApp** do lead de forma natural.
- **TÉCNICA**: "Antes de te passar os detalhes, com quem eu falo?" ou "Se a conexão cair, em qual WhatsApp posso te enviar o catálogo?".
- **ARMAZENAMENTO**: Assim que o lead fornecer esses dados, eles serão sincronizados no CRM. Continue o atendimento normalmente.

### ⚠️ REGRAS CRÍTICAS E PRIORIDADES
- **OBJETIVOS ATUAIS**: ${parsed.priorities || "Conduzir o lead para o fechamento ou captura de contato."}
- **RESTRIÇÕES (PROIBIDO)**: ${parsed.restrictions || "Não inventar informações não contidas na Base de Conhecimento."}
- **SEM CÓDIGO**: NUNCA escreva nomes de funções (tool_calls) no texto.
- **PROIBIDO listas em texto**: Se há alternativas → USE BOTÕES.

### 🎯 ESTRUTURA DE RESPOSTA
1. **Acolhimento**: 1 frase curta validando o lead.
2. **Entrega de Valor**: Responda usando a Base de Conhecimento.
3. **CTA Interativo**: Sempre termine com uma ferramenta ou pergunta de gancho. Se for pergunta de escolha → use botões.`;

    const basePrompt = `# PROMPT MASTER DE VENDAS
Você é ${aiName}, o especialista estrategista da empresa. 

${parsed.base_prompt || "Atue como um Consultor de Alta Conversão."}

${interactiveInstructions}`;

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
                // Filtro anti-vazamento de código no stream final
                const filteredContent = delta.content
                  .replace(/print\(defaultapi\..*?\)/g, "")
                  .replace(/default_api\..*?\(.*?\)/g, "")
                  .replace(/defaultapi\..*?\(.*?\)/g, "");

                if (filteredContent.trim() || delta.content.trim() === "") {
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: filteredContent } }] })}\n\n`));
                }
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
        // Limpeza final do conteúdo salvo para remover rastro de código alucinado
        const cleanSavedContent = fullContent
          .replace(/print\(defaultapi\..*?\)/gs, "")
          .replace(/default_api\..*?\(.*?\)/gs, "")
          .replace(/defaultapi\..*?\(.*?\)/gs, "")
          .trim();

        const savedContent = cleanSavedContent || Object.values(toolCalls).map(tc => {
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

          // Meta CAPI (Conversão via Servidor)
          if (vs?.meta_api_token && vs?.meta_pixel && lead_id) {
            try {
              const { data: leadData } = await supabase
                .from("vox_leads")
                .select("*")
                .eq("id", lead_id)
                .single();

              if (leadData) {
                // Evento de Lead (Ocorre quando capturamos nome/telefone)
                const eventName = leadData.phone || leadData.email ? "Contact" : "Lead";

                await fetch(`https://graph.facebook.com/v19.0/${vs.meta_pixel}/events?access_token=${vs.meta_api_token}`, {
                  method: "POST",
                  body: JSON.stringify({
                    data: [
                      {
                        event_name: eventName,
                        event_time: Math.floor(Date.now() / 1000),
                        action_source: "chat",
                        user_data: {
                          client_ip_address: clientIp,
                          client_user_agent: req.headers.get("user-agent"),
                          ph: leadData.phone ? [leadData.phone.replace(/\D/g, "")] : undefined,
                          em: leadData.email ? [leadData.email.toLowerCase().trim()] : undefined,
                          fn: [leadData.name.toLowerCase().trim()],
                        },
                        custom_data: {
                          agent_name: vs.name,
                          lead_id: lead_id,
                        }
                      }
                    ]
                  }),
                });
                console.log(`[CAPI] Evento ${eventName} enviado para ${vs.name}`);
              }
            } catch (capiError) {
              console.error("[CAPI] Erro ao enviar evento Meta:", capiError);
            }
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
