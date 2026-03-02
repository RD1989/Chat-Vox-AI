import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Send, Bot, Loader2, Check, CheckCheck, Smile, Paperclip, MoreVertical, Search, ArrowLeft, X, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { playIncomingSound, playOutgoingSound } from "@/components/chat/WhatsAppSounds";

// Background notification: flash title when tab is hidden
const useBackgroundNotification = () => {
  const isHiddenRef = useRef(false);
  const unreadCountRef = useRef(0);
  const originalTitleRef = useRef(document.title);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    originalTitleRef.current = document.title;

    const handleVisibility = () => {
      isHiddenRef.current = document.hidden;
      if (!document.hidden) {
        // User came back — reset
        unreadCountRef.current = 0;
        document.title = originalTitleRef.current;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.title = originalTitleRef.current;
    };
  }, []);

  const notifyNewMessage = useCallback(() => {
    if (!document.hidden) return;
    unreadCountRef.current += 1;
    const count = unreadCountRef.current;

    if (!intervalRef.current) {
      let toggle = true;
      intervalRef.current = setInterval(() => {
        document.title = toggle
          ? `(${count}) Nova mensagem!`
          : originalTitleRef.current;
        toggle = !toggle;
      }, 1000);
    }
  }, []);

  return { notifyNewMessage, isHiddenRef };
};

// -------------------------------------------------------------------------------------
// PIXEL INJECTOR HOOK (Por Agente)
// Injeta dinamicamente os códigos de Pixel no <head> com base no JSON salvo no Supabase
// -------------------------------------------------------------------------------------
const useTrackingPixels = (pixelsConfig?: Record<string, string>) => {
  useEffect(() => {
    if (!pixelsConfig) return;

    const injectedScripts: HTMLScriptElement[] = [];

    // 1. Meta (Facebook) Pixel
    if (pixelsConfig.meta_pixel) {
      const fbScript = document.createElement("script");
      fbScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelsConfig.meta_pixel}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(fbScript);
      injectedScripts.push(fbScript);
    }

    // 2. TikTok Pixel
    if (pixelsConfig.tiktok_pixel) {
      const ttScript = document.createElement("script");
      ttScript.innerHTML = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++
          )ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=i+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
          ttq.load('${pixelsConfig.tiktok_pixel}');
          ttq.page();
        }(window, document, 'ttq');
      `;
      document.head.appendChild(ttScript);
      injectedScripts.push(ttScript);
    }

    // 3. Google Ads / Analytics (gtag)
    const gtagId = pixelsConfig.google_ads || pixelsConfig.google_analytics;
    if (gtagId) {
      const gScriptAsync = document.createElement("script");
      gScriptAsync.async = true;
      gScriptAsync.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;

      const gScriptInit = document.createElement("script");
      gScriptInit.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gtagId}');
      `;
      document.head.appendChild(gScriptAsync);
      document.head.appendChild(gScriptInit);
      injectedScripts.push(gScriptAsync, gScriptInit);
    }

    // CLEANUP Ao desmontar a página, removemos as tags inseridas
    return () => {
      injectedScripts.forEach(script => {
        if (script.parentNode) script.parentNode.removeChild(script);
      });
    };
  }, [pixelsConfig]);
};

interface QuickReplyButton {
  label: string;
  value: string;
}

interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

interface InteractiveElement {
  type: "show_quick_replies" | "show_form";
  data: {
    message?: string;
    buttons?: QuickReplyButton[];
    fields?: FormField[];
    submit_label?: string;
  };
  answered?: boolean;
}

// Interceptor Regex for Fallback Markdown Lists -> Quick Replies
const parseTextToInteractiveOptions = (text: string) => {
  // Matches lists like "- Option", "* Option", "1. Option" or even just "• Option", separated by newlines
  const listRegex = /(?:(?:^|\n)(?:[-*•]|\d+\.)\s*(.+))+/i;
  const match = text.match(listRegex);

  if (match) {
    const listBlock = match[0];
    const beforeText = text.slice(0, match.index).trim();
    const afterText = text.slice((match.index || 0) + listBlock.length).trim();

    // Extract individual items
    const items = listBlock.split('\n')
      .map(line => line.replace(/^([-*•]|\d+\.)\s*/, '').trim())
      .map(line => line.replace(/^\*\*(.*?)\*\*(.*)/, '$1$2').trim()) // Remove leading bold markdown for button labels
      .filter(line => line.length > 0 && line.length <= 60); // limit length to avoid catching long paragraphs, allowing slightly longer for prices

    if (items.length >= 2 && items.length <= 6) {
      const remainingText = [beforeText, afterText].filter(Boolean).join("\n\n").trim();

      return {
        hasList: true,
        // Fallback to original text if stripping the list left absolutely nothing but we still want to show the list context
        cleanText: remainingText.length > 0 ? remainingText : text.replace(listBlock, '').trim() || text,
        buttons: items.map(item => ({ label: item, value: item }))
      };
    }
  }
  return { hasList: false, cleanText: text, buttons: [] };
};

// WhatsApp Text Formatter for Bold (* or **), Italic (_) and Strikethrough (~)
const formatWhatsAppText = (text: string) => {
  if (!text) return "";
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Múltiplo asterisco (Markdown)
    .replace(/\*(.*?)\*/g, '<b>$1</b>')   // Asterisco Simples (WhatsApp real)
    .replace(/_(.*?)_/g, '<i>$1</i>')
    .replace(/~(.*?)~/g, '<strike>$1</strike>')
    .replace(/\n/g, '<br />'); // Mantém as quebras de linha

  return formatted;
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  interactive?: InteractiveElement;
  imageUrls?: string[];
  injectedInteractive?: InteractiveElement; // To store virtual buttons created by the Regex Interceptor
}

interface VoxConfig {
  ai_name: string;
  ai_avatar_url: string;
  primary_color: string;
  welcome_message: string;
  chat_theme: string;
  chat_theme_config: {
    headerBg?: string;
    headerText?: string;
    chatBg?: string;
    userBubbleBg?: string;
    userBubbleText?: string;
    aiBubbleBg?: string;
    aiBubbleText?: string;
    inputBg?: string;
    inputBarBg?: string;
    pixels?: Record<string, string>;
  };
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vox-chat`;

const formatTime = (date: Date) => {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

// Utility to determine if text should be dark or light based on background color
const getContrastColor = (hexcolor: string) => {
  if (!hexcolor) return "#111111"; // Default to dark text

  // Remove hash if present
  let hex = hexcolor.replace('#', '');

  // Convert 3-char hex to 6-char
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  // Parse RGB
  const r = parseInt(hex.substr(0, 2), 16) || 255;
  const g = parseInt(hex.substr(2, 2), 16) || 255;
  const b = parseInt(hex.substr(4, 2), 16) || 255;

  // YIQ equation from W3C to check brightness
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

  return (yiq >= 128) ? "#111111" : "#F8F8F8";
};

const PublicChat = () => {
  const { userId } = useParams<{ userId: string }>();
  const agentId = new URLSearchParams(window.location.search).get("agent");
  const { notifyNewMessage } = useBackgroundNotification();
  const [config, setConfig] = useState<VoxConfig>({
    ai_name: "Chat Vox",
    ai_avatar_url: "",
    primary_color: "#6366f1",
    welcome_message: "Olá! Como posso ajudar você hoje?",
    chat_theme: "whatsapp",
    chat_theme_config: {},
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [leadCreated, setLeadCreated] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [systemPromptBase, setSystemPromptBase] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState("");
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamContentRef = useRef("");

  // Iniciar Hook Injetor Global de Pixels Baseado no Agent ID Atual
  useTrackingPixels(config.chat_theme_config.pixels);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Load vox config
  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      // If agent_id is provided, load agent-specific config
      if (agentId) {
        const { data: agentData } = await supabase
          .from("vox_agents")
          .select("*")
          .eq("id", agentId)
          .maybeSingle();
        if (agentData) {
          const a = agentData as any;
          setConfig({
            ai_name: a.name || "Chat Vox",
            ai_avatar_url: a.ai_avatar_url || "",
            primary_color: a.primary_color || "#6366f1",
            welcome_message: a.welcome_message || "Olá! Como posso ajudar você hoje?",
            chat_theme: a.chat_theme || "whatsapp",
            chat_theme_config: a.chat_theme_config || {},
          });

          if (a.system_prompt) setSystemPromptBase(a.system_prompt);
          if (a.knowledge_base) setKnowledgeBase(a.knowledge_base);

          setConfigLoading(false);
          setTimeout(() => {
            setMessages([{ id: "welcome", role: "assistant", content: a.welcome_message || "Olá! Como posso ajudar você hoje?", timestamp: new Date() }]);
            setTimeout(() => setShowNamePrompt(true), 1000);
          }, 500);
          return;
        }
      }

      // Fallback to vox_settings
      const { data } = await supabase
        .from("vox_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        const d = data as any;
        setConfig({
          ai_name: d.ai_name || "Chat Vox",
          ai_avatar_url: d.ai_avatar_url || "",
          primary_color: d.primary_color || "#6366f1",
          welcome_message: d.welcome_message || "Olá! Como posso ajudar você hoje?",
          chat_theme: d.chat_theme || "whatsapp",
          chat_theme_config: d.chat_theme_config || {},
        });

        if (d.system_prompt) setSystemPromptBase(d.system_prompt);

        // Get global knowledge base for the user
        const { data: kbData } = await supabase
          .from("vox_knowledge")
          .select("title, content")
          .eq("user_id", userId)
          .eq("is_active", true);

        if (kbData && kbData.length > 0) {
          const kbText = kbData.map((k: any) => `[${k.title}]\n${k.content}`).join("\n\n");
          setKnowledgeBase(kbText);
        }
      }
      setConfigLoading(false);

      setTimeout(() => {
        const welcomeMsg = data
          ? (data as any).welcome_message || "Olá! Como posso ajudar você hoje?"
          : "Olá! Como posso ajudar você hoje?";
        setMessages([
          { id: "welcome", role: "assistant", content: welcomeMsg, timestamp: new Date() },
        ]);
        setTimeout(() => {
          setShowNamePrompt(true);
        }, 1000);
      }, 500);
    };
    load();
  }, [userId, agentId]);

  const createLead = async (name: string) => {
    if (!userId) return;
    const params = new URLSearchParams(window.location.search);

    let geoCity: string | null = null;
    let geoRegion: string | null = null;
    let geoIp: string | null = null;
    try {
      const geoRes = await fetch("https://ip-api.com/json/?fields=status,city,regionName,query&lang=pt-BR");
      if (geoRes.ok) {
        const geo = await geoRes.json();
        if (geo.status === "success") {
          geoCity = geo.city || null;
          geoRegion = geo.regionName || null;
          geoIp = geo.query || null;
        }
      }
    } catch { /* silently ignore geo errors */ }

    const { data, error } = await supabase.from("vox_leads").insert({
      user_id: userId,
      name,
      status: "novo",
      source: "chat",
      city: geoCity,
      region: geoRegion,
      ip_address: geoIp,
      utm_source: params.get("utm_source") || null,
      utm_medium: params.get("utm_medium") || null,
      utm_campaign: params.get("utm_campaign") || null,
    } as any).select().single();

    if (data && !error) {
      const newLeadId = (data as any).id;
      setLeadId(newLeadId);
      setLeadCreated(true);
      setShowNamePrompt(false);
      setMessages((prev) => [
        ...prev,
        { id: "name-resp", role: "user", content: name, timestamp: new Date() },
        { id: "name-ack", role: "assistant", content: `Prazer, ${name}! 😊 Como posso te ajudar?`, timestamp: new Date() },
      ]);
      inputRef.current?.focus();

      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, lead_id: newLeadId, event_type: "new_lead" }),
      }).catch(() => { });
    }
  };

  const handleButtonClick = (button: QuickReplyButton, messageId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId && m.interactive
        ? { ...m, interactive: { ...m.interactive, answered: true } }
        : m
    ));
    setInput("");
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: button.value, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    sendMessageWithContent(button.value);
  };

  const handleFormSubmit = async (formData: Record<string, string>, messageId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId && m.interactive
        ? { ...m, interactive: { ...m.interactive, answered: true } }
        : m
    ));

    // Auto-save lead contact information silently to CRM DB
    if (leadId) {
      const updates: any = {};
      const emailKey = Object.keys(formData).find(k => k.toLowerCase().includes('email') || k.toLowerCase().includes('e-mail'));
      const phoneKey = Object.keys(formData).find(k => k.toLowerCase().includes('telefone') || k.toLowerCase().includes('whatsapp') || k.toLowerCase().includes('celular') || k.toLowerCase().includes('phone'));

      if (emailKey) updates.email = formData[emailKey];
      if (phoneKey) updates.phone = formData[phoneKey];

      if (Object.keys(updates).length > 0) {
        await supabase.from("vox_leads").update(updates).eq("id", leadId);
      }
    }

    const formText = Object.entries(formData)
      .map(([key, val]) => `${key}: ${val}`)
      .join("\n");
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: formText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    sendMessageWithContent(formText);
  };



  // Upload files to storage and get public URLs
  const uploadFiles = async (files: { file: File; preview: string }[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const { file } of files) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("chat-attachments")
        .upload(path, file, { contentType: file.type });
      if (!error) {
        const { data: urlData } = supabase.storage
          .from("chat-attachments")
          .getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
    }
    return urls;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 5).map(file => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    }));
    setPendingFiles(prev => [...prev, ...newFiles].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => {
      const updated = [...prev];
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const sendMessageWithContent = async (text: string, imageUrls?: string[]) => {
    if (isLoading || !userId) return;
    setIsLoading(true);
    setIsTyping(true);

    // Build message content - multimodal if images present
    const buildContent = (content: string, imgs?: string[]) => {
      if (imgs && imgs.length > 0) {
        const parts: any[] = [];
        if (content) parts.push({ type: "text", text: content });
        for (const url of imgs) {
          parts.push({ type: "image_url", image_url: { url } });
        }
        return parts;
      }
      return content;
    };

    const allMessages = [...messages.filter(m => m.id !== "welcome").map(m => ({
      role: m.role,
      content: buildContent(m.content, m.imageUrls),
    })), { role: "user" as const, content: text }];

    // Override last message if we have images for current send
    if (imageUrls && imageUrls.length > 0) {
      allMessages[allMessages.length - 1].content = buildContent(text, imageUrls);
    }

    // STRICT PURGE: Ensure only valid OpenAI roles and string/array content go to the Backend
    // This prevents "dirty" objects from breaking the Supabase/OpenRouter schema
    const strictCleanMessages = allMessages
      .map(m => ({
        role: m.role,
        content: m.content
      }))
      .filter(m => m.content && m.content.length > 0)
      .slice(-15); // SLIDING WINDOW: Keep only the last 15 interactions to avoid token limit crashes

    const assistantId = `assistant-${Date.now()}`;
    streamContentRef.current = "";

    try {
      const fullSystemContext = `
${systemPromptBase || `Você é ${config.ai_name}, um especialista em atendimento.`}

${knowledgeBase ? `BASE DE CONHECIMENTO DO NEGÓCIO:\n${knowledgeBase}` : ''}

DIRETRIZES DE PERSONALIDADE E ATENDIMENTO (OBRIGATÓRIO):
1. Aja de forma EXTREMAMENTE HUMANA, EMPÁTICA E CORTÊS. Como se fosse um especialista apaixonado pelo que faz no WhatsApp.
2. Seja sempre direto, ágil e nunca dê respostas robóticas ou engessadas. Responda de forma leve.
3. Use emojis estratégicos (😃, ✨, 🚀, 🙌) para manter o clima super amigável e acolhedor, mas sem exageros.
4. Foco Comercial: Sempre conduza a conversa de forma sutil para ajudar o cliente a avançar, escolher um serviço ou tirar dúvidas que levem ao fechamento.
5. Em hipótese alguma diga que você é uma IA ou Inteligência Artificial, atue sempre como "Atendimento da Equipe".

ELEMENTOS INTERATIVOS DEVEM SER USADOS OBRIGATORIAMENTE (Ferramentas):
Você tem a OBRIGAÇÃO de usar ferramentas de interface gráfica, nunca enviando opções de múltipla escolha ou pedindo e-mails de forma textual plana:

1. show_quick_replies: Use SEMPRE que for oferecer qualquer tipo de opções para o usuário. 
   - É EXTREMAMENTE PROIBIDO escrever as opções dentro do texto. SE VOCÊ FIZER UMA PERGUNTA DO TIPO "A ou B?", OS ITENS A E B DEVEM SER ENVIADOS COMO BOTÕES.
   - NUNCA coloque bullet points de opções de planos, serviços ou escolhas. Gere os botões visualmente.

2. show_form: OBRIGATÓRIO utilizar em algum momento estratégico da conversa para capturar o Telefone (WhatsApp) e o E-mail de forma profissional para cadastro do cliente.
   - Exemplo: Quando o lead avançar na qualificação ou pedir mais informações, lance a ferramenta de formulário solicitando os campos "E-mail" e "WhatsApp", e agradeça cordialmente.

FAÇA O USO DESTAS FERRAMENTAS A TODO MOMENTO ESTUDANDO O CONTEXTO.`;

      const strictInteractivePrompt = {
        role: "system" as const,
        content: fullSystemContext.trim()
      };

      const messagesWithPrompt = [strictInteractivePrompt, ...strictCleanMessages];

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesWithPrompt, user_id: userId, lead_id: leadId, agent_id: agentId }),
      });

      if (!resp.ok) {
        if (resp.status === 429) throw new Error("rate_limit");
        throw new Error("Failed to start stream");
      }
      if (!resp.body) throw new Error("Failed to start stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let rafPending = false;
      const assistantTimestamp = new Date();
      const interactiveElements: InteractiveElement[] = [];

      setIsTyping(false);
      playIncomingSound();
      notifyNewMessage();
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", timestamp: assistantTimestamp }]);

      const flushToState = () => {
        const current = streamContentRef.current;
        setMessages(prev => prev.map(m => {
          if (m.id === assistantId) {
            // Fallback interceptor on the final message
            const parsedOptions = parseTextToInteractiveOptions(current);
            if (parsedOptions.hasList && !m.interactive) {
              return {
                ...m,
                content: parsedOptions.cleanText,
                injectedInteractive: {
                  type: "show_quick_replies",
                  data: {
                    message: "Escolha uma das opções abaixo:",
                    buttons: parsedOptions.buttons
                  }
                }
              };
            }
            return { ...m, content: current };
          }
          return m;
        }));
        rafPending = false;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);

            if (parsed.type === "interactive") {
              interactiveElements.push({
                type: parsed.interactive_type,
                data: parsed.data,
              });
              continue;
            }

            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              streamContentRef.current += content;
              if (!rafPending) {
                rafPending = true;
                requestAnimationFrame(flushToState);
              }
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      flushToState();

      // Add interactive elements as separate messages
      if (interactiveElements.length > 0) {
        setTimeout(() => {
          setMessages(prev => {
            const newMsgs = [...prev];
            for (const ie of interactiveElements) {
              const interactiveMsg: Message = {
                id: `interactive-${Date.now()}-${Math.random()}`,
                role: "assistant",
                content: ie.data.message || "",
                timestamp: new Date(),
                interactive: ie,
              };
              newMsgs.push(interactiveMsg);
            }
            return newMsgs;
          });
        }, 300);
      }


    } catch (e: any) {
      console.error("Chat error:", e);
      setIsTyping(false);
      const errorMsg = e?.message === "rate_limit"
        ? "Você enviou muitas mensagens. Aguarde um momento e tente novamente."
        : "Desculpe, ocorreu um erro. Tente novamente.";
      setMessages(prev => [
        ...prev,
        { id: `error-${Date.now()}`, role: "assistant", content: errorMsg, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    const hasFiles = pendingFiles.length > 0;
    if ((!text && !hasFiles) || isLoading || !userId) return;

    playOutgoingSound();

    let uploadedUrls: string[] = [];
    if (hasFiles) {
      uploadedUrls = await uploadFiles(pendingFiles);
      setPendingFiles([]);
    }

    const displayText = text || (uploadedUrls.length > 0 ? "📎 Anexo enviado" : "");
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: displayText,
      timestamp: new Date(),
      imageUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    sendMessageWithContent(displayText, uploadedUrls.length > 0 ? uploadedUrls : undefined);
  };



  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0b141a" }}>
        <Loader2 className="animate-spin" size={28} style={{ color: "rgba(255,255,255,0.5)" }} />
      </div>
    );
  }

  const isWhatsApp = config.chat_theme === "whatsapp";
  const tc = config.chat_theme_config;
  const headerBg = tc.headerBg || (isWhatsApp ? "#1f2c34" : config.primary_color);
  const headerText = tc.headerText || "#e9edef";
  const chatBg = tc.chatBg || "#0b141a";
  const userBubbleBg = tc.userBubbleBg || (isWhatsApp ? "#005c4b" : config.primary_color);
  const userBubbleText = tc.userBubbleText || (isWhatsApp ? "#e9edef" : "#ffffff");
  const aiBubbleBg = tc.aiBubbleBg || "#1f2c34";
  const aiBubbleText = tc.aiBubbleText || "#e9edef";
  const inputBg = tc.inputBg || "#2a3942";
  const inputBarBg = tc.inputBarBg || "#1f2c34";
  const accentColor = "#00a884";

  const wallpaperStyle = {
    backgroundColor: chatBg,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cdefs%3E%3Cstyle%3E.a%7Bfill:%23ffffff;fill-opacity:0.02%7D%3C/style%3E%3C/defs%3E%3Cpath class='a' d='M30 10c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z'/%3E%3Cpath class='a' d='M70 30l-4-4-4 4 4 4zm-4-2l-2 2 2 2 2-2z'/%3E%3Cpath class='a' d='M110 15c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z'/%3E%3Cpath class='a' d='M150 25h6v2h-6z'/%3E%3Cpath class='a' d='M20 60l3-5h-6z'/%3E%3Cpath class='a' d='M60 50c0-2.8-2.2-5-5-5s-5 2.2-5 5 2.2 5 5 5 5-2.2 5-5zm-8 0c0-1.7 1.3-3 3-3s3 1.3 3 3-1.3 3-3 3-3-1.3-3-3z'/%3E%3Cpath class='a' d='M100 60h-2v-6h2v2h4v2h-4z'/%3E%3Cpath class='a' d='M140 55c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z'/%3E%3Cpath class='a' d='M175 45l-3 3 3 3 3-3z'/%3E%3Cpath class='a' d='M25 100l5-3-5-3v2h-4v2h4z'/%3E%3Cpath class='a' d='M65 95h8v2h-8z'/%3E%3Cpath class='a' d='M120 90c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z'/%3E%3Cpath class='a' d='M160 100l-6-4v8z'/%3E%3Cpath class='a' d='M35 140c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z'/%3E%3Cpath class='a' d='M80 135h2v8h-2z'/%3E%3Cpath class='a' d='M130 140l4 4-4 4'/%3E%3Cpath class='a' d='M170 130c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z'/%3E%3Cpath class='a' d='M15 175l4-7h-8z'/%3E%3Cpath class='a' d='M85 170c-2 0-3.5 1.5-3.5 3.5s1.5 3.5 3.5 3.5 3.5-1.5 3.5-3.5-1.5-3.5-3.5-3.5z'/%3E%3Cpath class='a' d='M140 180h8v2h-8z'/%3E%3Cpath class='a' d='M180 175l-3 5h6z'/%3E%3C/svg%3E")`,
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: chatBg }}>
      {/* WhatsApp Header */}
      <header className="flex items-center px-4 py-2 z-10" style={{ backgroundColor: headerBg }}>
        <div className="flex items-center gap-3 flex-1">
          <ArrowLeft size={20} style={{ color: headerText, opacity: 0.9 }} className="sm:hidden" />
          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            {config.ai_avatar_url ? (
              <img src={config.ai_avatar_url} alt={config.ai_name} className="w-full h-full object-cover" />
            ) : (
              <Bot size={20} style={{ color: headerText }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-normal text-[16px] leading-tight truncate" style={{ color: headerText }}>
              {config.ai_name}
            </h1>
            <p className="text-[13px] leading-tight" style={{ color: `${headerText}99` }}>
              {isTyping ? "digitando..." : "online"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <Search size={20} style={{ color: headerText, opacity: 0.85 }} />
          <MoreVertical size={20} style={{ color: headerText, opacity: 0.85 }} />
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-[3%] sm:px-[6%] py-2" style={wallpaperStyle}>
        <div className="flex justify-center mb-3 mt-1">
          <span className="text-[12.5px] px-3 py-1 rounded-lg shadow-sm"
            style={{ backgroundColor: "#182229", color: "#8696a0" }}>Hoje</span>
        </div>
        <div className="flex justify-center mb-4">
          <span className="text-[11.5px] text-center px-4 py-1.5 rounded-lg max-w-[85%] leading-snug"
            style={{ backgroundColor: "#182229e6", color: "#8696a0" }}>
            🔒 As mensagens são protegidas com criptografia de ponta a ponta.
          </span>
        </div>

        <AnimatePresence>
          {messages.map((msg) => {
            const hasText = msg.content && msg.content.trim().length > 0;
            const hasImages = msg.imageUrls && msg.imageUrls.length > 0;
            const hasNativeInteractive = msg.interactive &&
              (msg.interactive.type === "show_form" ||
                (msg.interactive.type === "show_quick_replies" && msg.interactive.data.buttons?.length));
            const hasInjectedInteractive = msg.injectedInteractive && msg.injectedInteractive.data.buttons?.length;

            // If the message is completely empty of any visual payload, hide the entire bubble
            const isCompletelyEmpty = !hasText && !hasImages && !hasNativeInteractive && !hasInjectedInteractive;

            if (isCompletelyEmpty) return null;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex mb-[3px] ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="relative max-w-[85%] sm:max-w-[75%]">
                  {/* SVG tail */}
                  {msg.role === "user" ? (
                    <svg className="absolute -right-2 top-0" width="8" height="13" viewBox="0 0 8 13">
                      <path d="M1 0L0 0C0 0 4 4 4 13L8 0Z" fill={userBubbleBg} />
                    </svg>
                  ) : (
                    <svg className="absolute -left-2 top-0" width="8" height="13" viewBox="0 0 8 13">
                      <path d="M7 0L8 0C8 0 4 4 4 13L0 0Z" fill={aiBubbleBg} />
                    </svg>
                  )}

                  <div
                    className={`px-[9px] pt-[6px] pb-[8px] text-[14.2px] leading-[19px] shadow-sm ${msg.role === "user"
                      ? "rounded-tl-lg rounded-bl-lg rounded-br-lg"
                      : "rounded-tr-lg rounded-br-lg rounded-bl-lg"
                      }`}
                    style={
                      msg.role === "user"
                        ? { backgroundColor: userBubbleBg, color: userBubbleText }
                        : { backgroundColor: aiBubbleBg, color: aiBubbleText }
                    }
                  >
                    {/* Image attachments */}
                    {msg.imageUrls && msg.imageUrls.length > 0 && (
                      <div className={`${msg.imageUrls.length > 1 ? "grid grid-cols-2 gap-1" : ""} mb-1 -mx-1 -mt-0.5 rounded overflow-hidden`}>
                        {msg.imageUrls.map((url, idx) => (
                          <img key={idx} src={url} alt="Anexo" className="w-full rounded object-cover cursor-pointer max-h-[200px]"
                            onClick={() => window.open(url, "_blank")} />
                        ))}
                      </div>
                    )}
                    {/* Text content */}
                    {msg.content?.trim() && (
                      <span
                        className="break-words"
                        dangerouslySetInnerHTML={{ __html: formatWhatsAppText(msg.content) }}
                      />
                    )}

                    {/* Quick Reply Buttons (Native + Injected Fallbacks) */}
                    {(msg.interactive?.type === "show_quick_replies" && msg.interactive.data.buttons) || (msg.injectedInteractive?.type === "show_quick_replies" && msg.injectedInteractive.data.buttons) ? (
                      <div className="mt-2 space-y-1.5">
                        {(msg.interactive?.data.buttons || msg.injectedInteractive?.data.buttons)?.map((btn, i) => {
                          const isAnswered = msg.interactive?.answered || msg.injectedInteractive?.answered;
                          return (
                            <button
                              key={i}
                              onClick={() => {
                                if (!isAnswered) {
                                  handleButtonClick(btn, msg.id);
                                  if (msg.injectedInteractive) {
                                    setMessages(prev => prev.map(m => m.id === msg.id && m.injectedInteractive ? { ...m, injectedInteractive: { ...m.injectedInteractive, answered: true } } : m));
                                  }
                                }
                              }}
                              disabled={isAnswered || isLoading}
                              className="w-full text-left px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-150 border"
                              style={{
                                backgroundColor: isAnswered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)",
                                borderColor: isAnswered ? "rgba(255,255,255,0.08)" : accentColor + "60",
                                color: isAnswered ? `${aiBubbleText}80` : accentColor,
                                cursor: isAnswered ? "default" : "pointer",
                              }}
                              onMouseEnter={(e) => {
                                if (!isAnswered) {
                                  (e.target as HTMLButtonElement).style.backgroundColor = accentColor + "20";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isAnswered) {
                                  (e.target as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.08)";
                                }
                              }}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    {/* Inline Form */}
                    {msg.interactive?.type === "show_form" && msg.interactive.data.fields && (
                      <InlineForm
                        fields={msg.interactive.data.fields}
                        submitLabel={msg.interactive.data.submit_label || "Enviar"}
                        answered={msg.interactive?.answered || false}
                        onSubmit={(data) => handleFormSubmit(data, msg.id)}
                        accentColor={accentColor}
                        inputBg={inputBg}
                        textColor={aiBubbleText}
                        isLoading={isLoading}
                      />
                    )}

                    {/* Time + ticks */}
                    <span className="float-right ml-2 mt-1 flex items-center gap-0.5 select-none"
                      style={{ fontSize: "11px", color: msg.role === "user" ? `${userBubbleText}99` : `${aiBubbleText}80` }}>
                      {formatTime(msg.timestamp)}
                      {msg.role === "user" && (
                        <CheckCheck size={16} style={{ color: "#53bdeb", marginLeft: "2px" }} />
                      )}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start mb-1">
            <div className="relative max-w-[75%]">
              <svg className="absolute -left-2 top-0" width="8" height="13" viewBox="0 0 8 13">
                <path d="M7 0L8 0C8 0 4 4 4 13L0 0Z" fill={aiBubbleBg} />
              </svg>
              <div className="px-4 py-3 rounded-tr-lg rounded-br-lg rounded-bl-lg shadow-sm"
                style={{ backgroundColor: aiBubbleBg }}>
                <div className="flex gap-[5px] items-center h-[19px]">
                  {[0, 200, 400].map(delay => (
                    <span key={delay} className="w-[7px] h-[7px] rounded-full animate-bounce"
                      style={{ backgroundColor: `${aiBubbleText}66`, animationDelay: `${delay}ms`, animationDuration: "1.2s" }} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Name prompt */}
      {showNamePrompt && !leadCreated && (
        <div className="px-3 pb-2" style={{ backgroundColor: inputBarBg }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-lg p-3" style={{ backgroundColor: aiBubbleBg }}>
            <p className="text-[14px] mb-3" style={{ color: aiBubbleText }}>
              Antes de começar, qual é o seu nome?
            </p>
            <form onSubmit={(e) => { e.preventDefault(); if (nameInput.trim()) createLead(nameInput.trim()); }}
              className="flex gap-2">
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                placeholder="Seu nome..." autoFocus
                className="flex-1 rounded-lg px-3 py-2 text-[14px] outline-none border-none"
                style={{ backgroundColor: inputBg, color: getContrastColor(inputBg) }} />
              <button type="submit" className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: accentColor, color: "#fff" }}>
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* File Preview */}
      {pendingFiles.length > 0 && leadCreated && (
        <div className="flex gap-2 px-3 py-2 overflow-x-auto" style={{ backgroundColor: inputBarBg }}>
          {pendingFiles.map((pf, i) => (
            <div key={i} className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-white/10">
              {pf.preview ? (
                <img src={pf.preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <Paperclip size={20} style={{ color: `${aiBubbleText}60` }} />
                </div>
              )}
              <button
                onClick={() => removePendingFile(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* WhatsApp Input Bar */}
      {leadCreated && (
        <div className="flex items-center gap-2 px-2 py-[8px]" style={{ backgroundColor: inputBarBg }}>
          <>
            <button className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full"
              style={{ color: `${aiBubbleText}80` }}><Smile size={24} /></button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full hover:bg-white/5 transition-colors"
              style={{ color: `${aiBubbleText}80` }}
            >
              <Paperclip size={22} className="rotate-45" />
            </button>
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex-1 flex items-center">
              <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Mensagem" disabled={isLoading}
                className="w-full rounded-lg px-4 py-[10px] text-[15px] outline-none border-none shadow-sm"
                style={{ backgroundColor: inputBg, color: getContrastColor(inputBg) }} />
            </form>
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || (!input.trim() && pendingFiles.length === 0)}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${input.trim() || pendingFiles.length > 0 ? "opacity-100" : "opacity-40"
                }`}
            >
              {isLoading ? <Loader2 size={22} className="animate-spin" style={{ color: `${aiBubbleText}80` }} />
                : <Send size={20} style={{ color: accentColor }} />}
            </button>
          </>
        </div>
      )}
    </div>
  );
};

// Inline Form Component
const InlineForm = ({
  fields,
  submitLabel,
  answered,
  onSubmit,
  accentColor,
  inputBg,
  textColor,
  isLoading,
}: {
  fields: FormField[];
  submitLabel: string;
  answered: boolean;
  onSubmit: (data: Record<string, string>) => void;
  accentColor: string;
  inputBg: string;
  textColor: string;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    for (const field of fields) {
      if (field.required && !formData[field.name]?.trim()) return;
    }
    onSubmit(formData);
  };

  if (answered) {
    return (
      <div className="mt-2 px-2 py-1.5 rounded text-[12px] italic" style={{ color: `${textColor}60` }}>
        ✅ Formulário enviado
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-[12px] mb-1 font-medium" style={{ color: `${textColor}cc` }}>
            {field.label} {field.required && <span style={{ color: "#ef4444" }}>*</span>}
          </label>
          {field.type === "select" ? (
            <select
              value={formData[field.name] || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
              className="w-full rounded-lg px-3 py-2 text-[13px] outline-none border-none"
              style={{ backgroundColor: inputBg, color: textColor }}
            >
              <option value="">{field.placeholder || "Selecione..."}</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === "textarea" ? (
            <textarea
              value={formData[field.name] || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={2}
              className="w-full rounded-lg px-3 py-2 text-[13px] outline-none border-none resize-none"
              style={{ backgroundColor: inputBg, color: textColor }}
            />
          ) : (
            <input
              type={field.type}
              value={formData[field.name] || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full rounded-lg px-3 py-2 text-[13px] outline-none border-none"
              style={{ backgroundColor: inputBg, color: textColor }}
            />
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 rounded-lg text-[13.5px] font-semibold transition-all"
        style={{ backgroundColor: accentColor, color: "#fff" }}
      >
        {submitLabel}
      </button>
    </form>
  );
};

export default PublicChat;
