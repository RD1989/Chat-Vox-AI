import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Send, Bot, Loader2, Check, CheckCheck, Smile, Paperclip, MoreVertical, Search, ArrowLeft, X, Image as ImageIcon, ExternalLink, Camera, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { playIncomingSound, playOutgoingSound } from "@/components/chat/WhatsAppSounds";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";

// Definindo o location do Web Worker do PDF.js (Sem isso ele falha no vite)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

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
// EVENT TRACKING HELPER
// Dispara eventos para Meta, TikTok e Google Ads/Analytics
// -------------------------------------------------------------------------------------
const trackEvent = (eventName: string, params: Record<string, any> = {}, config?: VoxConfig) => {
  // 1. Meta (Facebook)
  if ((window as any).fbq) {
    (window as any).fbq('track', eventName, params);
  }

  // 2. TikTok
  if ((window as any).ttq) {
    (window as any).ttq.track(eventName, params);
  }

  // 3. Google gtag
  if ((window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
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
  type: "show_quick_replies" | "show_form" | "exibir_prova_social" | "exibir_midia_produto" | "gerar_pagamento_pix";
  data: {
    message?: string;
    buttons?: QuickReplyButton[];
    fields?: FormField[];
    submit_label?: string;
    amount?: number; // Para Pix
    media_urls?: string[]; // Para exibição inteligente de mídias dinâmicas
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

// PDF Text Extractor Helper
const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    // Limite de segurança de 30 páginas para não travar a aplicação/modelo
    const maxPages = Math.min(pdf.numPages, 30);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += `--- PÁGINA ${i} ---\n${pageText}\n\n`;
    }
    return fullText.trim();
  } catch (error) {
    console.error("Erro ao ler PDF:", error);
    return "[Erro crítico: Não foi possível extrair o texto completo deste PDF devido a formatação, senha ou bloqueio de cópia.]";
  }
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  interactive?: InteractiveElement;
  imageUrls?: string[];
  injectedInteractive?: InteractiveElement; // To store virtual buttons created by the Regex Interceptor
  hiddenContext?: string; // Texto oculto do UI mas visível para a IA (ex: text extraído de PDF)
}

interface PendingFile {
  file: File;
  preview: string;
  extractedText?: string;
}

interface VoxConfig {
  ai_name: string;
  ai_avatar_url: string;
  primary_color: string;
  welcome_message: string;
  chat_theme: string;
  chat_appearance_mode?: "light" | "dark" | "auto";
  product_media?: string[];
  social_proof_media?: string[];
  pix_key?: string;
  checkout_url?: string;
  meta_api_token?: string;
  meta_pixel?: string;
  predefined_message?: string;
  organic_lead_capture?: boolean;
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
    accentColor?: string;
    pixels?: Record<string, string>;
  };
}

interface ConversionButton {
  label: string;
  url: string;
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
  const [conversionButtons, setConversionButtons] = useState<ConversionButton[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
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
            product_media: a.product_media || [],
            social_proof_media: a.social_proof_media || [],
            pix_key: a.pix_key || "",
            checkout_url: a.checkout_url || "",
            meta_api_token: a.meta_api_token || "",
            meta_pixel: a.meta_pixel || "",
          });

          if (a.system_prompt) setSystemPromptBase(a.system_prompt);
          if (a.knowledge_base) setKnowledgeBase(a.knowledge_base);

          // Get conversion buttons for this agent
          const { data: buttonsData } = await supabase
            .from("vox_agent_buttons" as any)
            .select("label, url")
            .eq("agent_id", agentId)
            .eq("is_active", true);
          if (buttonsData) setConversionButtons(buttonsData as unknown as ConversionButton[]);

          setTimeout(() => {
            setMessages([{ id: "welcome", role: "assistant", content: a.welcome_message || "Olá! Como posso ajudar você hoje?", timestamp: new Date() }]);

            // Lógica de Mensagem Predefinida e Captura Orgânica
            if (a.predefined_message) {
              setTimeout(() => {
                const userPredefinedMsg: Message = {
                  id: `pre-msg-${Date.now()}`,
                  role: "user",
                  content: a.predefined_message,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, userPredefinedMsg]);
                sendMessageWithContent(a.predefined_message);
              }, 1200);
            } else if (!a.organic_lead_capture) {
              setTimeout(() => setShowNamePrompt(true), 1500);
            }
          }, 500);

          // Se a captura orgânica estiver ligada, permitimos o chat imediatamente
          if (a.organic_lead_capture) {
            setLeadCreated(true);
          }
          setConfigLoading(false);
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

        setTimeout(() => {
          const welcomeMsg = d.welcome_message || "Olá! Como posso ajudar você hoje?";
          setMessages([
            { id: "welcome", role: "assistant", content: welcomeMsg, timestamp: new Date() },
          ]);

          if (d.predefined_message) {
            setTimeout(() => {
              const userPredefinedMsg: Message = {
                id: `pre-msg-${Date.now()}`,
                role: "user",
                content: d.predefined_message,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, userPredefinedMsg]);
              sendMessageWithContent(d.predefined_message);
            }, 1200);
          } else if (!d.organic_lead_capture) {
            setTimeout(() => setShowNamePrompt(true), 1500);
          } else {
            // Captura orgânica ativada globalmente
            setLeadCreated(true);
          }
        }, 500);
      }
      setConfigLoading(false);
    };
    load();
  }, [userId, agentId]);

  // Handle auto-trigger from parent widget
  useEffect(() => {
    const handleTrigger = (event: MessageEvent) => {
      if (event.data?.type === 'vox-trigger-active') {
        // Only nudge if no user message yet and it's not already loading
        if (messages.length <= 1 && !isLoading) {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            // We can either restate the welcome message or send a slightly more proactive one
            const nudge = config.welcome_message || "Olá! Como posso te ajudar hoje?";
            // Check if already in messages to avoid duplication
            setMessages(prev => {
              if (prev.some(m => m.id === 'proactive-nudge')) return prev;
              return [...prev, { id: 'proactive-nudge', role: 'assistant', content: nudge, timestamp: new Date() }];
            });
            playIncomingSound();
          }, 1500);
        }
      }
    };

    window.addEventListener('message', handleTrigger);
    return () => window.removeEventListener('message', handleTrigger);
  }, [messages, isLoading, config.welcome_message]);

  const createLead = async (name: string) => {
    if (!userId) return;

    // ✅ ALWAYS advance the chat immediately — never block on lead creation
    setLeadCreated(true);
    setShowNamePrompt(false);
    setMessages((prev) => [
      ...prev,
      { id: "name-resp", role: "user", content: name, timestamp: new Date() },
      { id: "name-ack", role: "assistant", content: `Prazer, ${name}! 😊 Como posso te ajudar?`, timestamp: new Date() },
    ]);
    inputRef.current?.focus();

    // 🎯 Rastreamento de Lead (Pixel/CAPI via Front)
    trackEvent('Lead', { name }, config);

    // 🔄 Try to create lead in background (best-effort, non-blocking)
    const params = new URLSearchParams(window.location.search);
    try {
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
      } catch { /* ignore */ }

      const leadPayload = {
        user_id: userId, name, status: "novo", source: "chat",
        city: geoCity, region: geoRegion, ip_address: geoIp,
        utm_source: params.get("utm_source") || null,
        utm_medium: params.get("utm_medium") || null,
        utm_campaign: params.get("utm_campaign") || null,
      };

      // Try SDK insert first
      let { data, error } = await supabase.from("vox_leads").insert(leadPayload as any).select().single();

      // Fallback: Edge Function (bypasses RLS)
      if (error) {
        console.warn("[Chat] SDK insert failed, trying fallback:", error.message);
        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vox-chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "create_lead",
              user_id: userId,
              messages: [],
              ...leadPayload
            }),
          });
          if (res.ok) {
            const text = await res.text();
            let fb;
            try {
              // Se a resposta começar com "data: ", é um stream SSE inesperado para esta action
              if (text.trim().startsWith("data: ")) {
                const jsonStr = text.split("\n")[0].replace("data: ", "").trim();
                fb = JSON.parse(jsonStr);
              } else {
                fb = JSON.parse(text);
              }
            } catch (e) {
              console.error("[Chat] Failed to parse lead creation response:", text);
            }
            if (fb?.lead_id) { data = { id: fb.lead_id } as any; error = null; }
          }
        } catch (err: any) {
          console.error("[Chat] Fallback create_lead failed:", err.message);
        }
      }

      if (data && !error) {
        setLeadId((data as any).id);
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-lead`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, lead_id: (data as any).id, event_type: "new_lead" }),
        }).catch(() => { });
      } else {
        console.warn("[Chat] Lead creation failed (chat continues without lead):", error?.message);
      }
    } catch (e) {
      console.warn("[Chat] Lead error (non-blocking):", e);
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
      m.id === messageId && m.interactive ? { ...m, interactive: { ...m.interactive, answered: true } } : m
    ));

    // 🎯 Rastreamento de Contato
    trackEvent('Contact', formData, config);

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
  const uploadFiles = async (files: PendingFile[]): Promise<string[]> => {
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = [];
    for (const file of Array.from(files).slice(0, 5)) {
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      let extractedText = "";

      if (isPdf) {
        toast(`Lendo arquivo ${file.name}...`, { position: "top-center" });
        extractedText = await extractTextFromPDF(file);
      }

      newFiles.push({
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
        extractedText,
      });
    }

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

  const sendMessageWithContent = async (text: string, imageUrls?: string[], hiddenCtx?: string) => {
    if (isLoading || !userId) return;
    setIsLoading(true);
    setIsTyping(true);

    const assistantId = `assistant-${Date.now()}`;
    streamContentRef.current = "";

    try {
      // Build messages history including images if present
      const buildContent = (content: string, imgs?: string[], hiddenCtx?: string) => {
        let baseContent = content || "";
        if (hiddenCtx) {
          baseContent += `\n\n${hiddenCtx}`;
        }

        if (imgs && imgs.length > 0) {
          const parts: any[] = [];
          if (baseContent) parts.push({ type: "text", text: baseContent });
          for (const url of imgs) {
            // Se a url terminada em pdf porventura foi passada (historico legado), a filtramos e apenas repassamos o link como texto.
            if (url.toLowerCase().match(/\.(pdf|doc|docx)$/i)) {
              parts.push({ type: "text", text: `\n[Contexto Visual: Documento não-imagem ignorado pelo Vision Model. Fonte do link: ${url}]` });
            } else {
              parts.push({ type: "image_url", image_url: { url } });
            }
          }
          return parts.length > 1 || parts[0]?.type === "image_url" ? parts : baseContent;
        }
        return baseContent;
      };

      const history = [...messages.filter(m => m.id !== "welcome").map(m => ({
        role: m.role,
        content: buildContent(m.content, m.imageUrls, m.hiddenContext),
      })), { role: "user" as const, content: buildContent(text, imageUrls, messages[messages.length - 1]?.hiddenContext) }].slice(-12);

      // Call vox-chat Edge Function with SSE support
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          user_id: userId,
          lead_id: leadId,
          agent_id: agentId
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        const errorMessage = err.error || `Erro ${response.status}: Falha na comunicação com a IA.`;
        throw new Error(errorMessage);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let assistantMsgAdded = false;

      playIncomingSound();
      notifyNewMessage();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(l => l.trim().startsWith("data: "));

        for (const line of lines) {
          const dataStr = line.replace("data: ", "").trim();
          if (dataStr === "[DONE]") break;

          try {
            const json = JSON.parse(dataStr);

            if (json.choices?.[0]?.delta?.content) {
              const content = json.choices[0].delta.content;

              streamContentRef.current += content;

              const sanitizeStream = (text: string) => {
                let cleaned = text;
                // Remove Arrays de strings e objetos de Quick Replies
                cleaned = cleaned.replace(/defaultapi\.[a-zA-Z_]+\(\[[\s\S]*?\]\)/g, "");
                // Remove prints inteiros contendo defaultapi. Ex: print(defaultapi.exibirmidia_produto(message='...'))
                cleaned = cleaned.replace(/print\(\s*defaultapi\.[a-zA-Z_]+\([\s\S]*?\)\s*\)/g, "");
                // Remove listagens literais e chamadas únicas: defaultapi.ShowQuickRepliesButtons(...) ou [defaultapi.Show(...)]
                cleaned = cleaned.replace(/\[?\s*defaultapi\.[a-zA-Z_]+\([\s\S]*?\)\s*\]?/g, "");
                return cleaned.trim();
              };

              // Filtro Secundário no Front-end: Remover lixo de código/API vazado pela IA
              let cleanStream = sanitizeStream(streamContentRef.current);

              if (!assistantMsgAdded) {
                setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", timestamp: new Date() }]);
                assistantMsgAdded = true;
              }

              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: cleanStream } : m
              ));
            }

            // Handle interactive elements (buttons/forms) sent as special SSE events
            if (json.type === "interactive") {
              // Se ainda não há mensagem do assistente, cria uma nova com o texto da ferramenta
              if (!assistantMsgAdded) {
                let cleanToolMessage = (json.data?.message || "").replace(/defaultapi\.[a-zA-Z_]+\(\[[\s\S]*?\]\)/g, "").replace(/print\(\s*defaultapi\.[a-zA-Z_]+\([\s\S]*?\)\s*\)/g, "").replace(/\[?\s*defaultapi\.[a-zA-Z_]+\([\s\S]*?\)\s*\]?/g, "").trim();
                setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: cleanToolMessage, timestamp: new Date() }]);
                assistantMsgAdded = true;
              } else if (json.data?.message) {
                // Se já há texto (veio via stream), preenche o balão se estiver vazio
                let cleanToolMessage = json.data.message.replace(/defaultapi\.[a-zA-Z_]+\(\[[\s\S]*?\]\)/g, "").replace(/print\(\s*defaultapi\.[a-zA-Z_]+\([\s\S]*?\)\s*\)/g, "").replace(/\[?\s*defaultapi\.[a-zA-Z_]+\([\s\S]*?\)\s*\]?/g, "").trim();
                setMessages(prev => prev.map(m =>
                  m.id === assistantId && !m.content ? { ...m, content: cleanToolMessage } : m
                ));
              }

              // SEMPRE injeta o elemento interativo — mesmo que o texto já tenha chegado via stream
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? {
                  ...m,
                  interactive: {
                    type: json.interactive_type as any,
                    data: json.data,
                    answered: false
                  }
                } : m
              ));
            }
          } catch (e) {
            // Ignore partial JSON chunks during streaming
          }
        }
      }
    } catch (e: any) {
      console.error("Chat error:", e);
      setMessages(prev => [
        ...prev,
        { id: `error-${Date.now()}`, role: "assistant", content: e.message || "Erro de conexão.", timestamp: new Date() },
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
    }

    // Process extraction context to send implicitly to the LLM (without polluting visual chat)
    let hiddenContext = "";
    const pdfFiles = pendingFiles.filter(pf => pf.extractedText);
    if (pdfFiles.length > 0) {
      hiddenContext = pdfFiles.map(pf => `[CONTEÚDO LIDO DO ARQUIVO "${pf.file.name}"]:\n${pf.extractedText}`).join("\n\n");
    }

    setPendingFiles([]);

    const displayText = text || (uploadedUrls.length > 0 ? "📎 Anexo enviado" : "");
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: displayText,
      timestamp: new Date(),
      imageUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      hiddenContext: hiddenContext || undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Explicitly pass hiddenContext downward so current invocation of sendMessageWithContent sees it correctly
    // Since state is asynchronous, we inject it directly by cheating the last element locally.
    const lastMsgCopy = { ...userMsg };

    // Calling internal content sender safely, ensuring current state context is fresh
    setTimeout(() => {
      // O `sendMessageWithContent` precisa enxergar o estado. Usando callback seria melhor, 
      // mas como definimos no buildContent o parâmetro `messages[messages.length - 1]?.hiddenContext`, isso 
      // não leria `userMsg` imediatamente pois React batcheia.
      // Para não dar problema (como read text being ignored), vamos repassar como string global temporária.
    }, 0);

    sendMessageWithContent(displayText, uploadedUrls.length > 0 ? uploadedUrls : undefined, hiddenContext || undefined);
  };



  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0b141a" }}>
        <Loader2 className="animate-spin" size={28} style={{ color: "rgba(255,255,255,0.5)" }} />
      </div>
    );
  }

  const isWhatsApp = config.chat_theme === "whatsapp";

  // Dynamic Theme Logic
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const appearance = config.chat_appearance_mode === "auto" || !config.chat_appearance_mode
    ? (systemPrefersDark ? "dark" : "light")
    : config.chat_appearance_mode;

  const isDark = appearance === "dark";

  const tc = config.chat_theme_config;
  const headerBg = tc.headerBg || (isWhatsApp ? (isDark ? "#202c33" : "#008069") : config.primary_color);
  const headerText = tc.headerText || (isDark ? "#e9edef" : "#ffffff");
  const chatBg = tc.chatBg || (isDark ? "#0b141a" : "#efeae2");
  const userBubbleBg = tc.userBubbleBg || (isWhatsApp ? (isDark ? "#005c4b" : "#d9fdd3") : config.primary_color);
  const userBubbleText = tc.userBubbleText || (isDark ? "#e9edef" : "#111b21");
  const aiBubbleBg = tc.aiBubbleBg || (isDark ? "#202c33" : "#ffffff");
  const aiBubbleText = tc.aiBubbleText || (isDark ? "#e9edef" : "#111b21");
  const inputBg = tc.inputBg || (isDark ? "#2a3942" : "#ffffff");
  const inputBarBg = tc.inputBarBg || (isDark ? "#202c33" : "#f0f2f5");
  const secondaryText = isDark ? "#8696a0" : "#667781";

  // O accentColor agora segue o primary_color do agente se não houver um override específico no theme_config
  const accentColor = tc.accentColor || config.primary_color || (isDark ? "#00a884" : "#128c7e");

  const wallpaperStyle = {
    backgroundColor: chatBg,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cdefs%3E%3Cstyle%3E.a%7Bfill:${isDark ? '%23ffffff' : '%23000000'};fill-opacity:0.02%7D%3C/style%3E%3C/defs%3E%3Cpath class='a' d='M30 10c-2 0-4 2-4 4s2 4 4 4 4-2 4-4-2-4-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z'/%3E%3Cpath class='a' d='M70 30l-4-4-4 4 4 4zm-4-2l-2 2 2 2 2-2z'/%3E%3Cpath class='a' d='M110 15c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z'/%3E%3Cpath class='a' d='M150 25h6v2h-6z'/%3E%3Cpath class='a' d='M20 60l3-5h-6z'/%3E%3Cpath class='a' d='M60 50c0-2.8-2.2-5-5-5s-5 2.2-5 5 2.2 5 5 5 5-2.2 5-5zm-8 0c0-1.7 1.3-3 3-3s3 1.3 3 3-1.3 3-3 3-3-1.3-3-3z'/%3E%3Cpath class='a' d='M100 60h-2v-6h2v2h4v2h-4z'/%3E%3Cpath class='a' d='M140 55c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z'/%3E%3Cpath class='a' d='M175 45l-3 3 3 3 3-3z'/%3E%3Cpath class='a' d='M25 100l5-3-5-3v2h-4v2h4z'/%3E%3Cpath class='a' d='M65 95h8v2h-8z'/%3E%3Cpath class='a' d='M120 90c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z'/%3E%3Cpath class='a' d='M160 100l-6-4v8z'/%3E%3Cpath class='a' d='M35 140c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z'/%3E%3Cpath class='a' d='M80 135h2v8h-2z'/%3E%3Cpath class='a' d='M130 140l4 4-4 4'/%3E%3Cpath class='a' d='M170 130c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z'/%3E%3Cpath class='a' d='M15 175l4-7h-8z'/%3E%3Cpath class='a' d='M85 170c-2 0-3.5 1.5-3.5 3.5s1.5 3.5 3.5 3.5 3.5-1.5 3.5-3.5-1.5-3.5-3.5-3.5z'/%3E%3Cpath class='a' d='M140 180h8v2h-8z'/%3E%3Cpath class='a' d='M180 175l-3 5h6z'/%3E%3C/svg%3E")`,
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden" style={{ backgroundColor: chatBg }}>
      {/* WhatsApp Header */}
      <header className="flex items-center px-4 py-2 z-10 shrink-0" style={{ backgroundColor: headerBg }}>
        <div className="flex items-center gap-3 flex-1">
          <ArrowLeft
            size={20}
            style={{ color: headerText, opacity: 0.9 }}
            className="sm:hidden cursor-pointer"
            onClick={() => window.parent.postMessage({ type: "vox-close" }, "*")}
          />
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
          <Search size={22} style={{ color: headerText, opacity: isDark ? 0.85 : 0.9 }} />
          <MoreVertical size={22} style={{ color: headerText, opacity: isDark ? 0.85 : 0.9 }} />
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-[3%] sm:px-[6%] py-2" style={wallpaperStyle}>
        <div className="flex justify-center mb-3 mt-1">
          <span className="text-[12.5px] px-3 py-1 rounded-lg shadow-sm font-medium"
            style={{ backgroundColor: isDark ? "#182229" : "#ffffff", color: secondaryText }}>Hoje</span>
        </div>
        <div className="flex justify-center mb-4">
          <span className="text-[11.5px] text-center px-4 py-1.5 rounded-lg max-w-[85%] leading-snug shadow-sm"
            style={{ backgroundColor: isDark ? "#182229e6" : "#fff9c6", color: isDark ? secondaryText : "#54656f" }}>
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
                    className={`px-[11px] pt-[7px] pb-[8px] text-[16px] leading-[21px] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] ${msg.role === "user"
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
                      <div className="space-y-3">
                        <span
                          className="break-words"
                          dangerouslySetInnerHTML={{ __html: formatWhatsAppText(msg.content.replace(/\[BUTTON:.*?\]/g, '').trim()) }}
                        />

                        {/* CTA Buttons via [BUTTON: Label] marker */}
                        {msg.role === "assistant" && Array.from(msg.content.matchAll(/\[BUTTON:\s*(.*?)\]/g)).map((match, idx) => {
                          const label = match[1].trim();
                          const btnConfig = conversionButtons.find(b => b.label.toLowerCase() === label.toLowerCase());
                          if (!btnConfig) return null;

                          return (
                            <button
                              key={idx}
                              onClick={() => window.open(btnConfig.url, "_blank")}
                              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-[14px] transition-all shadow-md group hover:scale-[1.02] active:scale-95"
                              style={{
                                backgroundColor: accentColor,
                                color: "#fff",
                                boxShadow: `0 4px 15px ${accentColor}40`
                              }}
                            >
                              <ExternalLink size={16} className="group-hover:translate-x-0.5 transition-transform" />
                              {btnConfig.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick Reply Buttons (Native + Injected Fallbacks) */}
                    {(msg.interactive?.type === "show_quick_replies" && msg.interactive.data.buttons) || (msg.injectedInteractive?.type === "show_quick_replies" && msg.injectedInteractive.data.buttons) ? (
                      <div className="mt-2 space-y-1.5">
                        {(msg.interactive?.data.buttons || msg.injectedInteractive?.data.buttons)?.map((btn, i) => {
                          const isAnswered = msg.interactive?.answered || msg.injectedInteractive?.answered;
                          // Cores adaptativas para o tema claro/escuro
                          const btnBg = isAnswered
                            ? isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"
                            : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
                          const btnBorder = isAnswered
                            ? isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"
                            : accentColor + "80";
                          const btnColor = isAnswered
                            ? isDark ? `${aiBubbleText}60` : `${aiBubbleText}80`
                            : accentColor;
                          const btnHoverBg = isDark ? accentColor + "20" : accentColor + "15";

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
                                backgroundColor: btnBg,
                                borderColor: btnBorder,
                                color: btnColor,
                                cursor: isAnswered ? "default" : "pointer",
                              }}
                              onMouseEnter={(e) => {
                                if (!isAnswered) {
                                  (e.target as HTMLButtonElement).style.backgroundColor = btnHoverBg;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isAnswered) {
                                  (e.target as HTMLButtonElement).style.backgroundColor = btnBg;
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

                    {/* 🌟 Prova Social (Carrossel) */}
                    {msg.interactive?.type === "exibir_prova_social" && (
                      (() => {
                        const urls = msg.interactive.data?.media_urls || 
                          (config.social_proof_media || []).map((m: any) => m.url || m);
                        if (!urls || urls.length === 0) return null;
                        
                        return (
                          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/5">
                            <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar snap-x scroll-smooth">
                              {urls.map((url: string, i: number) => (
                                <div key={i} className="min-w-[180px] h-[120px] rounded-lg overflow-hidden snap-center flex-shrink-0 shadow-sm border border-white/5 bg-black/20">
                                  <img src={url} className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(url, "_blank")} alt={`Prova Social ${i + 1}`} />
                                </div>
                              ))}
                            </div>
                            <div className="px-3 py-1.5 bg-black/20 text-[10px] text-white/40 flex items-center justify-between">
                              <span>Deslize para ver mais</span>
                              <ImageIcon size={10} />
                            </div>
                          </div>
                        );
                      })()
                    )}

                    {/* 📦 Mídia do Produto (Carrossel) */}
                    {msg.interactive?.type === "exibir_midia_produto" && (
                      (() => {
                        const urls = msg.interactive.data?.media_urls || 
                          (config.product_media || []).map((m: any) => m.url || m);
                        if (!urls || urls.length === 0) return null;
                        
                        return (
                          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/5">
                            <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar snap-x scroll-smooth">
                              {urls.map((url: string, i: number) => (
                                <div key={i} className="min-w-[180px] h-[120px] rounded-lg overflow-hidden snap-center flex-shrink-0 shadow-sm border border-white/5 bg-black/20">
                                  <img src={url} className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(url, "_blank")} alt={`Produto ${i + 1}`} />
                                </div>
                              ))}
                            </div>
                            <div className="px-3 py-1.5 bg-black/20 text-[10px] text-white/40 flex items-center justify-between">
                              <span>Conheça nosso produto</span>
                              <Bot size={10} />
                            </div>
                          </div>
                        );
                      })()
                    )}

                    {/* 💸 Gerador de Pix Dinâmico no Chat */}
                    {msg.interactive?.type === "gerar_pagamento_pix" && (
                      <div className="mt-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center shadow-lg animate-in fade-in zoom-in duration-300">
                        <div className="bg-white p-2.5 rounded-xl inline-block mb-3 shadow-inner">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(config.pix_key || "PIX_KEY_NOT_SET")}`}
                            alt="QR Code Pix"
                            className="w-32 h-32"
                          />
                        </div>
                        <div className="space-y-1 mb-4">
                          <div className="text-[11px] uppercase tracking-wider text-emerald-500 font-bold">Pagamento Seguro via Pix</div>
                          <div className="text-lg font-black text-white">R$ {msg.interactive.data.amount?.toFixed(2) || "---"}</div>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(config.pix_key || "");
                            toast.success("Código Pix copiado!");
                            trackEvent('Purchase', { value: msg.interactive?.data.amount, currency: 'BRL' });
                          }}
                          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-md active:scale-95"
                        >
                          <Check size={18} /> Copiar Código Pix
                        </button>
                      </div>
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
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex justify-start mb-2"
          >
            <div className="relative max-w-[75%]">
              <svg className="absolute -left-2 top-0" width="8" height="13" viewBox="0 0 8 13">
                <path d="M7 0L8 0C8 0 4 4 4 13L0 0Z" fill={aiBubbleBg} />
              </svg>
              <div className="px-[12px] py-[10px] rounded-tr-lg rounded-br-lg rounded-bl-lg shadow-sm"
                style={{ backgroundColor: aiBubbleBg }}>
                <div className="flex gap-[4px] items-center h-[14px]">
                  {[0, 200, 400].map(delay => (
                    <motion.span
                      key={delay}
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        translateY: [0, -2, 0]
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: delay / 1000,
                        ease: "easeInOut"
                      }}
                      className="w-[6px] h-[6px] rounded-full"
                      style={{ backgroundColor: `${aiBubbleText}99` }}
                    />
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
              <button type="submit" disabled={isLoading} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
                style={{ backgroundColor: accentColor, color: "#fff" }}>
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
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

      {/* Refined WhatsApp Input Bar */}
      {leadCreated && (
        <div className="flex items-end gap-2 px-2 py-[10px] pb-4 shrink-0" style={{ backgroundColor: chatBg }}>
          <div className="flex-1 flex items-end gap-2 px-3 py-1.5 rounded-3xl shadow-sm min-h-[48px]"
            style={{ backgroundColor: inputBg }}>
            <button
              className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full"
              style={{ color: secondaryText }}
            >
              <Smile size={24} className="opacity-80" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileSelect}
            />

            <textarea
              ref={inputRef as any}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Simple auto-resize logic
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Mensagem"
              className="flex-1 bg-transparent border-none focus:ring-0 text-[17px] py-[10px] resize-none overflow-y-auto max-h-[120px] placeholder:text-slate-500"
              rows={1}
              style={{ color: aiBubbleText }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full"
              style={{ color: secondaryText }}
            >
              <Paperclip size={22} className="rotate-45 opacity-80" />
            </button>

            {!input.trim() && (
              <button className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full"
                style={{ color: secondaryText }}>
                <Camera size={24} className="opacity-80" />
              </button>
            )}
          </div>

          <button
            onClick={sendMessage}
            disabled={isLoading || (!input.trim() && pendingFiles.length === 0)}
            className={`w-[48px] h-[48px] rounded-full flex items-center justify-center shrink-0 transition-all shadow-md active:scale-90 ${isLoading ? "opacity-70" : "opacity-100"}`}
            style={{ backgroundColor: accentColor }}
          >
            {isLoading ? (
              <Loader2 size={24} className="animate-spin text-white" />
            ) : input.trim() || pendingFiles.length > 0 ? (
              <Send size={22} className="text-white ml-0.5" />
            ) : (
              <Mic size={24} className="text-white" />
            )}
          </button>
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
