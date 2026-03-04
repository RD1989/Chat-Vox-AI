import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Send, Bot, Loader2, Check, CheckCheck, Smile, Paperclip, Mic, MoreVertical, Search, ArrowLeft, X, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AudioRecorder from "@/components/chat/AudioRecorder";
import AudioPlayer from "@/components/chat/AudioPlayer";
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

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  interactive?: InteractiveElement;
  audioData?: string;
  audioFormat?: string;
  isAudioMessage?: boolean;
  imageUrls?: string[];
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
  };
  voice_enabled: boolean;
  voice_response_pct: number;
  voice_name: string;
  voice_speed: number;
  voice_show_text: boolean;
  voice_accent: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vox-chat`;
const AUDIO_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vox-audio`;

const formatTime = (date: Date) => {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const PublicChat = () => {
  const { userId } = useParams<{ userId: string }>();
  const agentId = new URLSearchParams(window.location.search).get("agent");
  const { notifyNewMessage } = useBackgroundNotification();
  const [config, setConfig] = useState<VoxConfig>({
    ai_name: "ChatVox",
    ai_avatar_url: "",
    primary_color: "#6366f1",
    welcome_message: "Olá! Como posso ajudar você hoje?",
    chat_theme: "whatsapp",
    chat_theme_config: {},
    voice_enabled: false,
    voice_response_pct: 50,
    voice_name: "alloy",
    voice_speed: 1.0,
    voice_show_text: true,
    voice_accent: "pt-BR",
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [leadCreated, setLeadCreated] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamContentRef = useRef("");

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

          // Fetch global settings as fallback for identity
          const { data: globalSettings } = await supabase
            .from("vox_settings")
            .select("ai_name, ai_avatar_url")
            .eq("user_id", userId)
            .maybeSingle();

          const g = globalSettings as any;

          setConfig({
            ai_name: a.name || g?.ai_name || "ChatVox",
            ai_avatar_url: a.ai_avatar_url || g?.ai_avatar_url || "",
            primary_color: a.primary_color || "#6366f1",
            welcome_message: a.welcome_message || "Olá! Como posso ajudar você hoje?",
            chat_theme: a.chat_theme || "whatsapp",
            chat_theme_config: a.chat_theme_config || {},
            voice_enabled: a.voice_enabled || false,
            voice_response_pct: a.voice_response_pct ?? 50,
            voice_name: a.voice_name || "alloy",
            voice_speed: a.voice_speed ?? 1.0,
            voice_show_text: a.voice_show_text ?? true,
            voice_accent: a.voice_accent || "pt-BR",
          });
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
          ai_name: d.ai_name || "ChatVox",
          ai_avatar_url: d.ai_avatar_url || "",
          primary_color: d.primary_color || "#6366f1",
          welcome_message: d.welcome_message || "Olá! Como posso ajudar você hoje?",
          chat_theme: d.chat_theme || "whatsapp",
          chat_theme_config: d.chat_theme_config || {},
          voice_enabled: d.voice_enabled || false,
          voice_response_pct: d.voice_response_pct ?? 50,
          voice_name: d.voice_name || "alloy",
          voice_speed: d.voice_speed ?? 1.0,
          voice_show_text: d.voice_show_text ?? true,
          voice_accent: d.voice_accent || "pt-BR",
        });
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

  const handleFormSubmit = (formData: Record<string, string>, messageId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId && m.interactive
        ? { ...m, interactive: { ...m.interactive, answered: true } }
        : m
    ));
    const formText = Object.entries(formData)
      .map(([key, val]) => `${key}: ${val}`)
      .join("\n");
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: formText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    sendMessageWithContent(formText);
  };

  // Generate TTS for assistant response
  const generateTTS = async (text: string, messageId: string) => {
    try {
      const resp = await fetch(AUDIO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, mode: "tts", messages: [{ content: text }] }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.audio_data) {
          setMessages(prev => prev.map(m =>
            m.id === messageId
              ? { ...m, audioData: data.audio_data, audioFormat: data.format || "mp3" }
              : m
          ));
        }
      }
    } catch (e) {
      console.error("TTS error:", e);
    }
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

    try {
      // 1. Fetch API Keys and Knowledge Base from Supabase (Frontend)
      const { data: settings } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", ["openrouter_api_key", "openrouter_model"]);

      const apiKey = settings?.find((s) => s.key === "openrouter_api_key")?.value;
      const model = settings?.find((s) => s.key === "openrouter_model")?.value || "google/gemini-2.0-flash-001";

      if (!apiKey) throw new Error("API Key not configured");

      // Fetch Knowledge Base
      let knowledgeQuery = supabase
        .from("vox_knowledge")
        .select("title, content, category")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (agentId) {
        knowledgeQuery = knowledgeQuery.or(`agent_id.eq.${agentId},agent_id.is.null`);
      }
      const { data: knowledgeEntries } = await knowledgeQuery;

      // Fetch Brain Config (structured fields + system_prompt)
      const brainFields = "system_prompt, ai_persona, ai_tone, ai_objective, ai_restrictions, ai_cta, ai_qualification_question";
      let brain: any = {};
      if (agentId) {
        const { data: agentData } = await supabase.from("vox_agents").select(brainFields).eq("id", agentId).single();
        if (agentData) brain = agentData;
      }
      // Always fetch global settings as fallback
      const { data: globalBrain } = await supabase.from("vox_settings").select(brainFields).eq("user_id", userId).single();

      // Merge: agent-specific overrides global (field by field)
      const gb = globalBrain || {};
      const persona = brain.ai_persona || (gb as any).ai_persona || "";
      const tone = brain.ai_tone || (gb as any).ai_tone || "profissional";
      const objective = brain.ai_objective || (gb as any).ai_objective || "";
      const restrictions = brain.ai_restrictions || (gb as any).ai_restrictions || "";
      const cta = brain.ai_cta || (gb as any).ai_cta || "";
      const qualQuestion = brain.ai_qualification_question || (gb as any).ai_qualification_question || "";
      const customPrompt = brain.system_prompt || (gb as any).system_prompt || "";

      // Build professional system prompt
      const promptParts: string[] = [];

      if (persona) {
        promptParts.push(`PERSONA:\n${persona}`);
      } else {
        promptParts.push("Você é um assistente de IA amigável e profissional.");
      }

      promptParts.push(`TOM DE VOZ: Responda sempre de forma ${tone}.`);

      if (objective) {
        promptParts.push(`OBJETIVO PRINCIPAL:\n${objective}`);
      }

      if (cta) {
        promptParts.push(`CHAMADA PARA AÇÃO (CTA):\n${cta}`);
      }

      if (qualQuestion) {
        promptParts.push(`PERGUNTA DE QUALIFICAÇÃO:\nDurante a conversa, faça naturalmente a seguinte pergunta para qualificar o lead: "${qualQuestion}"`);
      }

      if (restrictions) {
        promptParts.push(`RESTRIÇÕES IMPORTANTES:\n${restrictions}`);
      }

      if (customPrompt) {
        promptParts.push(`INSTRUÇÕES ADICIONAIS:\n${customPrompt}`);
      }

      // Build knowledge context
      let knowledgeContext = "";
      if (knowledgeEntries && knowledgeEntries.length > 0) {
        knowledgeContext = "\n\nBASE DE CONHECIMENTO:\n" +
          knowledgeEntries.map((e: any) => `[${e.category?.toUpperCase()}] ${e.title}:\n${e.content}`).join("\n\n");
      }

      promptParts.push("Responda sempre em português brasileiro de forma natural e humanizada.");

      const fullSystemPrompt = promptParts.join("\n\n") + knowledgeContext;

      // 2. Build History
      const history = messages
        .filter(m => m.id !== "welcome")
        .map(m => {
          if (m.imageUrls && m.imageUrls.length > 0) {
            const content: any[] = [{ type: "text", text: m.content }];
            m.imageUrls.forEach(url => content.push({ type: "image_url", image_url: { url } }));
            return { role: m.role, content };
          }
          return { role: m.role, content: m.content };
        });

      const currentContent: any = imageUrls && imageUrls.length > 0
        ? [{ type: "text", text }, ...imageUrls.map(url => ({ type: "image_url", image_url: { url } }))]
        : text;

      history.push({ role: "user", content: currentContent });

      // 3. Call OpenRouter Direct (Frontend Fallback)
      const assistantId = `assistant-${Date.now()}`;
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", timestamp: new Date() }]);
      setIsTyping(false);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "ChatVox Public",
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "system", content: fullSystemPrompt }, ...history],
          stream: true,
        }),
      });

      if (!response.ok) throw new Error("OpenRouter API error");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.trim().startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") continue;
              try {
                const json = JSON.parse(dataStr);
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) {
                  fullText += delta;
                  setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m));
                }
              } catch (e) { /* partial json */ }
            }
          }
        }
      }

      // 4. Save to Database (background)
      if (leadId) {
        // Save user message
        await supabase.from("vox_messages").insert({
          user_id: userId,
          lead_id: leadId,
          role: "user",
          content: text,
          message_type: imageUrls && imageUrls.length > 0 ? "image" : "text",
          metadata: imageUrls && imageUrls.length > 0 ? { image_urls: imageUrls } : null,
        });

        // Save assistant message
        await supabase.from("vox_messages").insert({
          user_id: userId,
          lead_id: leadId,
          role: "assistant",
          content: fullText,
          message_type: "text",
        });
      }

      // Generate TTS if voice enabled
      if (config.voice_enabled && fullText.trim()) {
        const shouldGenerateAudio = (Math.random() * 100) < config.voice_response_pct;
        if (shouldGenerateAudio) {
          generateTTS(fullText, assistantId);
        }
      }

    } catch (e: any) {
      console.error("Chat error:", e);
      setMessages(prev => [
        ...prev,
        { id: `error-${Date.now()}`, role: "assistant", content: "Erro ao processar mensagem. Verifique a chave API.", timestamp: new Date() },
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

  // Handle audio recording
  const handleAudioRecorded = async (base64: string, format: string) => {
    if (!userId || isLoading) return;
    setIsTranscribing(true);

    playOutgoingSound();

    // Show audio message from user (WhatsApp-style: no transcription visible)
    const audioMsgId = `audio-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: audioMsgId,
      role: "user",
      content: "🎤 Mensagem de áudio",
      timestamp: new Date(),
      isAudioMessage: true,
      audioData: base64,
      audioFormat: format,
    }]);

    try {
      const resp = await fetch(AUDIO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio_data: base64,
          audio_format: format,
          user_id: userId,
          mode: "transcribe",
        }),
      });

      if (!resp.ok) throw new Error("Transcription failed");

      const data = await resp.json();
      const transcription = data.transcription?.trim();

      setIsTranscribing(false);

      if (transcription) {
        // Send transcription to bot internally — user still sees "🎤 Mensagem de áudio"
        sendMessageWithContent(transcription);
      } else {
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Desculpe, não consegui entender o áudio. Pode tentar novamente?",
          timestamp: new Date(),
        }]);
      }
    } catch (e) {
      console.error("Audio transcription error:", e);
      setIsTranscribing(false);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "⚠️ Erro ao processar o áudio. Tente novamente.",
        timestamp: new Date(),
      }]);
    }
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
              {isTranscribing ? "transcrevendo áudio..." : isTyping ? "digitando..." : "online"}
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
          {messages.map((msg) => (
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
                  {/* Audio Player for assistant messages with audio */}
                  {msg.audioData && msg.role === "assistant" && (
                    <AudioPlayer
                      audioData={msg.audioData}
                      format={msg.audioFormat}
                      bubbleColor={aiBubbleBg}
                      textColor={aiBubbleText}
                    />
                  )}

                  {/* Audio Player for user audio messages */}
                  {msg.isAudioMessage && msg.audioData && msg.role === "user" && (
                    <AudioPlayer
                      audioData={msg.audioData}
                      format={msg.audioFormat || "webm"}
                      bubbleColor={userBubbleBg}
                      textColor={userBubbleText}
                    />
                  )}

                  {/* Text content - hide for user audio messages, show conditionally for assistant audio */}
                  {msg.isAudioMessage && msg.role === "user" ? null : (
                    (!msg.audioData || config.voice_show_text || msg.role === "user") && (
                      <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                    )
                  )}

                  {/* Quick Reply Buttons */}
                  {msg.interactive?.type === "show_quick_replies" && msg.interactive.data.buttons && (
                    <div className="mt-2 space-y-1.5">
                      {msg.interactive.data.buttons.map((btn, i) => (
                        <button
                          key={i}
                          onClick={() => !msg.interactive?.answered && handleButtonClick(btn, msg.id)}
                          disabled={msg.interactive?.answered || isLoading}
                          className="w-full text-left px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-150 border"
                          style={{
                            backgroundColor: msg.interactive?.answered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)",
                            borderColor: msg.interactive?.answered ? "rgba(255,255,255,0.08)" : accentColor + "60",
                            color: msg.interactive?.answered ? `${aiBubbleText}80` : accentColor,
                            cursor: msg.interactive?.answered ? "default" : "pointer",
                          }}
                          onMouseEnter={(e) => {
                            if (!msg.interactive?.answered) {
                              (e.target as HTMLButtonElement).style.backgroundColor = accentColor + "20";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!msg.interactive?.answered) {
                              (e.target as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.08)";
                            }
                          }}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}

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
          ))}
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
                style={{ backgroundColor: inputBg, color: aiBubbleText }} />
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
        <div className="flex items-center gap-1 px-2 py-[5px]" style={{ backgroundColor: inputBarBg }}>
          {isRecording ? (
            <AudioRecorder
              onAudioRecorded={handleAudioRecorded}
              disabled={isLoading || isTranscribing}
              accentColor={accentColor}
              onRecordingChange={setIsRecording}
            />
          ) : (
            <>
              <button className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full"
                style={{ color: `${aiBubbleText}80` }}><Smile size={24} /></button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full"
                style={{ color: `${aiBubbleText}80` }}
              >
                <Paperclip size={22} className="rotate-45" />
              </button>
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex-1 flex items-center">
                <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder="Mensagem" disabled={isLoading || isTranscribing}
                  className="w-full rounded-lg px-3 py-[9px] text-[15px] outline-none border-none"
                  style={{ backgroundColor: inputBg, color: "#e9edef" }} />
              </form>
              {(input.trim() || pendingFiles.length > 0) ? (
                <button onClick={() => sendMessage()} disabled={isLoading}
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                  {isLoading ? <Loader2 size={22} className="animate-spin" style={{ color: `${aiBubbleText}80` }} />
                    : <Send size={20} style={{ color: accentColor }} />}
                </button>
              ) : (
                <AudioRecorder
                  onAudioRecorded={handleAudioRecorded}
                  disabled={isLoading || isTranscribing}
                  accentColor={accentColor}
                  onRecordingChange={setIsRecording}
                />
              )}
            </>
          )}
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
