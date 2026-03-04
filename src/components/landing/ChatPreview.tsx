import { useState, useEffect, useRef } from "react";
import { Check, Mic, Paperclip, Smile, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const messages = [
  { role: "bot", text: "E aí! 🔥 Vi que você se interessou. Posso te fazer uma pergunta rápida?", time: "10:31" },
  { role: "user", text: "Pode sim, manda aí", time: "10:32" },
  { role: "bot", text: "Quanto você tá faturando hoje? Quem aplica esse método sai de 5k pra 30k em 60 dias 💰", time: "10:32" },
  { role: "user", text: "Tô em 8k, quero chegar nos 30", time: "10:33" },
  { role: "bot", text: "Perfeito! Vou te mandar um material exclusivo. Qual seu melhor email? 📩", time: "10:33" },
];

const TypingIndicator = () => (
  <div className="relative max-w-[70px] bg-white rounded-lg rounded-tl-none px-4 py-2.5 flex gap-1 shadow-sm ml-2">
    {/* WhatsApp tail */}
    <div className="absolute -left-2 top-0 w-0 h-0 border-t-[8px] border-t-white border-l-[8px] border-l-transparent" />
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-2 h-2 rounded-full bg-[#9e9e9e]"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

const DoubleCheck = ({ read }: { read?: boolean }) => (
  <span className="inline-flex ml-1">
    <Check size={13} className={read ? "text-[#53bdeb]" : "text-[#8696a0]"} strokeWidth={2.5} />
    <Check size={13} className={`-ml-2 ${read ? "text-[#53bdeb]" : "text-[#8696a0]"}`} strokeWidth={2.5} />
  </span>
);

const ChatPreview = () => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleCount >= messages.length) {
      const timeout = setTimeout(() => {
        setVisibleCount(0);
        setShowTyping(true);
      }, 4000);
      return () => clearTimeout(timeout);
    }

    setShowTyping(true);
    const typingDelay = messages[visibleCount].role === "bot" ? 1500 : 800;
    const timeout = setTimeout(() => {
      setShowTyping(false);
      setVisibleCount((c) => c + 1);
    }, typingDelay);

    return () => clearTimeout(timeout);
  }, [visibleCount]);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleCount, showTyping]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl border border-[#2a2a2a] w-full h-full max-w-md mx-auto flex flex-col bg-[#0b141a]"
    >
      {/* WhatsApp Header */}
      <div className="bg-[#202c33] px-3 py-2.5 flex items-center gap-3">
        {/* Back arrow */}
        <svg viewBox="0 0 24 24" width="22" height="22" className="text-[#aebac1] shrink-0">
          <path fill="currentColor" d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8z" />
        </svg>
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-[#2a3942]">
          <img
            src="/attendant-avatar.jpg"
            alt="Atendente"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Name & status */}
        <div className="flex-1 min-w-0">
          <p className="text-[#e9edef] font-medium text-[15px] truncate">Ana • Atendente IA</p>
          <p className="text-[#8696a0] text-[12px]">online</p>
        </div>
        {/* Action icons */}
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 24 24" width="20" height="20" className="text-[#aebac1]">
            <path fill="currentColor" d="M15.9 14.3H15l-.3-.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-.6 4.3-1.6l.3.3v.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2 4.6-4.6 4.6z" />
          </svg>
          <svg viewBox="0 0 24 24" width="20" height="20" className="text-[#aebac1]">
            <path fill="currentColor" d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z" />
          </svg>
        </div>
      </div>

      {/* Chat body - WhatsApp wallpaper */}
      <div
        ref={containerRef}
        className="px-3 py-3 space-y-1.5 flex-1 overflow-y-auto"
        style={{
          backgroundColor: "#0b141a",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {/* Date chip */}
        <div className="flex justify-center mb-2">
          <span className="bg-[#182229] text-[#8696a0] text-[11px] px-3 py-1 rounded-md shadow-sm">
            HOJE
          </span>
        </div>

        <AnimatePresence>
          {messages.slice(0, visibleCount).map((msg, i) => (
            <motion.div
              key={`${i}-${visibleCount > messages.length ? "r" : ""}`}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`relative max-w-[80%] px-2.5 pt-1.5 pb-1 rounded-lg shadow-sm ${msg.role === "bot"
                    ? "bg-[#202c33] rounded-tl-none ml-2"
                    : "bg-[#005c4b] rounded-tr-none mr-2"
                  }`}
              >
                {/* Tail */}
                {msg.role === "bot" && (
                  <div className="absolute -left-2 top-0 w-0 h-0 border-t-[8px] border-t-[#202c33] border-l-[8px] border-l-transparent" />
                )}
                {msg.role === "user" && (
                  <div className="absolute -right-2 top-0 w-0 h-0 border-t-[8px] border-t-[#005c4b] border-r-[8px] border-r-transparent" />
                )}
                <p className="text-[14px] text-[#e9edef] leading-[19px] pr-14">{msg.text}</p>
                <div className="flex items-center justify-end gap-0.5 -mt-3.5 float-right ml-2">
                  <span className="text-[11px] text-[#8696a0]">{msg.time}</span>
                  {msg.role === "user" && <DoubleCheck read />}
                </div>
                <div className="clear-both" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {showTyping && visibleCount < messages.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={messages[visibleCount]?.role === "user" ? "flex justify-end" : ""}
          >
            <TypingIndicator />
          </motion.div>
        )}
      </div>

      {/* WhatsApp Input Bar */}
      <div className="bg-[#202c33] px-2.5 py-2 flex items-center gap-2">
        <Smile size={22} className="text-[#8696a0] shrink-0" />
        <Paperclip size={22} className="text-[#8696a0] shrink-0 rotate-45" />
        <div className="flex-1 bg-[#2a3942] rounded-lg px-3 py-2 text-[14px] text-[#8696a0]">
          Mensagem
        </div>
        <Camera size={22} className="text-[#8696a0] shrink-0" />
        <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center shrink-0">
          <Mic size={20} className="text-[#0b141a]" />
        </div>
      </div>
    </motion.div>
  );
};

export default ChatPreview;
