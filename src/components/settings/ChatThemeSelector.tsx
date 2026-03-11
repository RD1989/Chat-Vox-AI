import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bot, Send, Check, Palette, Layout, Paintbrush } from "lucide-react";

interface ChatTheme {
  name: string;
  headerBg: string;
  headerText: string;
  chatBg: string;
  userBubbleBg: string;
  userBubbleText: string;
  aiBubbleBg: string;
  aiBubbleText: string;
  inputBg: string;
  inputBarBg: string;
  fontFamily: string;
}

const WHATSAPP_THEME: ChatTheme = {
  name: "WhatsApp",
  headerBg: "#00a884",
  headerText: "#ffffff",
  chatBg: "#0b141a",
  userBubbleBg: "#005c4b",
  userBubbleText: "#e9edef",
  aiBubbleBg: "#1f2c34",
  aiBubbleText: "#e9edef",
  inputBg: "#2a3942",
  inputBarBg: "#1a2228",
  fontFamily: "sans-serif",
};

const PRESET_TEMPLATES: ChatTheme[] = [
  {
    name: "Elegante Escuro",
    headerBg: "#1a1a2e",
    headerText: "#e0e0ff",
    chatBg: "#16213e",
    userBubbleBg: "#0f3460",
    userBubbleText: "#e0e0ff",
    aiBubbleBg: "#1a1a2e",
    aiBubbleText: "#c9c9e0",
    inputBg: "#0f3460",
    inputBarBg: "#1a1a2e",
    fontFamily: "sans-serif",
  },
  {
    name: "Coral Suave",
    headerBg: "#e8655a",
    headerText: "#ffffff",
    chatBg: "#fdf6f0",
    userBubbleBg: "#e8655a",
    userBubbleText: "#ffffff",
    aiBubbleBg: "#ffffff",
    aiBubbleText: "#333333",
    inputBg: "#ffffff",
    inputBarBg: "#f5ebe0",
    fontFamily: "sans-serif",
  },
  {
    name: "Neon Moderno",
    headerBg: "#7c3aed",
    headerText: "#ffffff",
    chatBg: "#0f0f23",
    userBubbleBg: "#7c3aed",
    userBubbleText: "#ffffff",
    aiBubbleBg: "#1e1e3f",
    aiBubbleText: "#d4d4f7",
    inputBg: "#1e1e3f",
    inputBarBg: "#141428",
    fontFamily: "sans-serif",
  },
  {
    name: "Verde Natureza",
    headerBg: "#2d6a4f",
    headerText: "#ffffff",
    chatBg: "#f0f7f4",
    userBubbleBg: "#2d6a4f",
    userBubbleText: "#ffffff",
    aiBubbleBg: "#ffffff",
    aiBubbleText: "#1b4332",
    inputBg: "#ffffff",
    inputBarBg: "#d8f3dc",
    fontFamily: "sans-serif",
  },
  {
    name: "Azul Profissional",
    headerBg: "#1e3a5f",
    headerText: "#ffffff",
    chatBg: "#f0f4f8",
    userBubbleBg: "#1e3a5f",
    userBubbleText: "#ffffff",
    aiBubbleBg: "#ffffff",
    aiBubbleText: "#1e3a5f",
    inputBg: "#ffffff",
    inputBarBg: "#e2e8f0",
    fontFamily: "sans-serif",
  },
  {
    name: "Rosa Delicado",
    headerBg: "#be185d",
    headerText: "#ffffff",
    chatBg: "#fdf2f8",
    userBubbleBg: "#be185d",
    userBubbleText: "#ffffff",
    aiBubbleBg: "#ffffff",
    aiBubbleText: "#831843",
    inputBg: "#ffffff",
    inputBarBg: "#fce7f3",
    fontFamily: "sans-serif",
  },
];

interface ChatThemeSelectorProps {
  activeMode: "whatsapp" | "template" | "custom";
  onModeChange: (mode: "whatsapp" | "template" | "custom") => void;
  themeConfig: ChatTheme;
  onThemeChange: (theme: ChatTheme) => void;
  primaryColor: string;
  aiName: string;
  aiAvatarUrl: string;
}

const ChatPreviewMini = ({ theme, aiName, aiAvatarUrl }: { theme: ChatTheme; aiName: string; aiAvatarUrl: string }) => (
  <div className="rounded-xl overflow-hidden border border-border shadow-sm w-full max-w-[260px]" style={{ fontSize: "10px" }}>
    {/* Header */}
    <div className="flex items-center gap-2 px-3 py-2" style={{ backgroundColor: theme.headerBg, color: theme.headerText }}>
      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
        {aiAvatarUrl ? (
          <img src={aiAvatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Bot size={12} style={{ color: theme.headerText }} />
        )}
      </div>
      <div className="flex flex-col">
        <span className="font-semibold text-[11px] leading-tight">{aiName}</span>
        <span className="text-[9px] opacity-70 leading-tight">online</span>
      </div>
    </div>
    {/* Messages */}
    <div className="px-2 py-3 space-y-1.5" style={{ backgroundColor: theme.chatBg, minHeight: 80 }}>
      <div className="flex justify-start">
        <div className="px-2 py-1 rounded-lg rounded-tl-sm text-[10px] max-w-[75%]" style={{ backgroundColor: theme.aiBubbleBg, color: theme.aiBubbleText }}>
          Olá! Como posso ajudar?
        </div>
      </div>
      <div className="flex justify-end">
        <div className="px-2 py-1 rounded-lg rounded-tr-sm text-[10px] max-w-[75%]" style={{ backgroundColor: theme.userBubbleBg, color: theme.userBubbleText }}>
          Quero saber mais!
        </div>
      </div>
    </div>
    {/* Input */}
    <div className="px-2 py-1.5 flex items-center gap-1" style={{ backgroundColor: theme.inputBarBg }}>
      <div className="flex-1 rounded-full px-2 py-1 text-[9px] opacity-50" style={{ backgroundColor: theme.inputBg, color: theme.aiBubbleText }}>
        Digite...
      </div>
      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.headerBg }}>
        <Send size={8} style={{ color: theme.headerText }} />
      </div>
    </div>
  </div>
);

export const ChatThemeSelector = ({
  activeMode,
  onModeChange,
  themeConfig,
  onThemeChange,
  primaryColor,
  aiName,
  aiAvatarUrl,
}: ChatThemeSelectorProps) => {
  const modes = [
    { key: "whatsapp" as const, label: "Padrão WhatsApp", icon: Layout, desc: "Visual inspirado no WhatsApp" },
    { key: "template" as const, label: "Templates Prontos", icon: Palette, desc: "Escolha um tema pré-definido" },
    { key: "custom" as const, label: "Customizável", icon: Paintbrush, desc: "Personalize todas as cores" },
  ];

  const handleModeSelect = (mode: "whatsapp" | "template" | "custom") => {
    onModeChange(mode);
    if (mode === "whatsapp") {
      onThemeChange({ ...WHATSAPP_THEME });
    }
  };

  const handleTemplateSelect = (template: ChatTheme) => {
    onThemeChange(template);
  };

  const updateThemeColor = (key: keyof ChatTheme, value: string) => {
    onThemeChange({ ...themeConfig, [key]: value });
  };

  const currentPreview = activeMode === "whatsapp" 
    ? { ...WHATSAPP_THEME }
    : themeConfig;

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => handleModeSelect(m.key)}
            className={`relative p-4 rounded-xl border-2 text-left transition-all ${
              activeMode === m.key
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/30"
            }`}
          >
            {activeMode === m.key && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check size={12} className="text-primary-foreground" />
              </div>
            )}
            <m.icon size={20} className={activeMode === m.key ? "text-primary mb-2" : "text-muted-foreground mb-2"} />
            <p className="text-sm font-semibold text-foreground">{m.label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings panel */}
        <div className="space-y-4">
          {activeMode === "whatsapp" && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  O tema WhatsApp usa automaticamente sua <strong>cor principal</strong> no header. 
                  Altere a cor na aba <strong>Aparência</strong> para personalizar.
                </p>
              </CardContent>
            </Card>
          )}

          {activeMode === "template" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => handleTemplateSelect(tpl)}
                  className={`p-0 rounded-xl border-2 overflow-hidden transition-all ${
                    themeConfig.name === tpl.name ? "border-primary shadow-md" : "border-border hover:border-primary/40"
                  }`}
                >
                  <ChatPreviewMini theme={tpl} aiName={aiName} aiAvatarUrl={aiAvatarUrl} />
                  <p className="text-[10px] font-medium text-foreground py-1.5 text-center bg-card">{tpl.name}</p>
                </button>
              ))}
            </div>
          )}

          {activeMode === "custom" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Personalizar Cores</CardTitle>
                <CardDescription>Defina cada cor do chat manualmente.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: "headerBg", label: "Fundo do Header" },
                  { key: "headerText", label: "Texto do Header" },
                  { key: "chatBg", label: "Fundo do Chat" },
                  { key: "userBubbleBg", label: "Balão do Usuário" },
                  { key: "userBubbleText", label: "Texto do Usuário" },
                  { key: "aiBubbleBg", label: "Balão da IA" },
                  { key: "aiBubbleText", label: "Texto da IA" },
                  { key: "inputBg", label: "Fundo do Input" },
                  { key: "inputBarBg", label: "Barra do Input" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={(themeConfig as any)[key] || "#000000"}
                      onChange={(e) => updateThemeColor(key as keyof ChatTheme, e.target.value)}
                      className="w-8 h-8 rounded-lg border border-border cursor-pointer shrink-0"
                    />
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">{label}</Label>
                    </div>
                    <Input
                      value={(themeConfig as any)[key] || ""}
                      onChange={(e) => updateThemeColor(key as keyof ChatTheme, e.target.value)}
                      className="w-28 h-8 text-xs font-mono"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Preview</p>
          <ChatPreviewMini theme={currentPreview} aiName={aiName} aiAvatarUrl={aiAvatarUrl} />
        </div>
      </div>
    </div>
  );
};

export type { ChatTheme };
