import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, Mic, Play, Gauge, Globe, MessageSquare } from "lucide-react";

const VOICES = [
  { id: "alloy", label: "Alloy", desc: "Neutra e versátil" },
  { id: "ash", label: "Ash", desc: "Firme e confiante" },
  { id: "ballad", label: "Ballad", desc: "Suave e melódica" },
  { id: "coral", label: "Coral", desc: "Calorosa e amigável" },
  { id: "echo", label: "Echo", desc: "Profunda e grave" },
  { id: "fable", label: "Fable", desc: "Expressiva e dinâmica" },
  { id: "nova", label: "Nova", desc: "Jovem e energética" },
  { id: "onyx", label: "Onyx", desc: "Autoritária e séria" },
  { id: "sage", label: "Sage", desc: "Calma e sábia" },
  { id: "shimmer", label: "Shimmer", desc: "Brilhante e clara" },
];

const ACCENTS = [
  { id: "pt-BR", label: "🇧🇷 Português Brasileiro" },
  { id: "pt-PT", label: "🇵🇹 Português Europeu" },
  { id: "en-US", label: "🇺🇸 English (US)" },
  { id: "es-ES", label: "🇪🇸 Español" },
];

interface VoiceSettingsProps {
  voiceEnabled: boolean;
  voiceResponsePct: number;
  voiceName: string;
  voiceSpeed: number;
  voiceShowText: boolean;
  voiceAccent: string;
  onUpdate: (key: string, value: string | number | boolean) => void;
}

const VoiceSettings = ({
  voiceEnabled,
  voiceResponsePct,
  voiceName,
  voiceSpeed,
  voiceShowText,
  voiceAccent,
  onUpdate,
}: VoiceSettingsProps) => {
  const [previewPlaying, setPreviewPlaying] = useState(false);

  return (
    <div className="space-y-4">
      {/* Master Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Volume2 size={15} className="text-primary" /> Respostas em Áudio
          </CardTitle>
          <CardDescription>
            Permita que a IA responda com áudio, criando uma experiência mais humana e envolvente no chat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
            <div>
              <p className="text-sm font-medium text-foreground">Ativar respostas em áudio</p>
              <p className="text-[10px] text-muted-foreground">A IA poderá enviar mensagens de voz além de texto</p>
            </div>
            <Switch
              checked={voiceEnabled}
              onCheckedChange={(v) => onUpdate("voice_enabled", v)}
            />
          </div>

          {voiceEnabled && (
            <>
              {/* Response percentage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare size={12} />
                    Porcentagem de respostas em áudio
                  </Label>
                  <Badge variant="secondary" className="text-xs font-mono">{voiceResponsePct}%</Badge>
                </div>
                <Slider
                  value={[voiceResponsePct]}
                  onValueChange={([v]) => onUpdate("voice_response_pct", v)}
                  min={10}
                  max={100}
                  step={10}
                  className="w-full"
                />
                <p className="text-[10px] text-muted-foreground">
                  Define em quantas respostas a IA enviará áudio. 100% = todas as respostas terão áudio.
                </p>
              </div>

              {/* Show text with audio */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                <div>
                  <p className="text-sm font-medium text-foreground">Exibir texto junto com áudio</p>
                  <p className="text-[10px] text-muted-foreground">Mostra o texto da mensagem além do player de áudio</p>
                </div>
                <Switch
                  checked={voiceShowText}
                  onCheckedChange={(v) => onUpdate("voice_show_text", v)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {voiceEnabled && (
        <>
          {/* Voice Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Mic size={15} className="text-primary" /> Escolha de Voz
              </CardTitle>
              <CardDescription>
                Selecione a voz que melhor representa sua marca.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => onUpdate("voice_name", voice.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      voiceName === voice.id
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border hover:border-primary/40 hover:bg-accent/30"
                    }`}
                  >
                    <p className="text-xs font-semibold text-foreground">{voice.label}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{voice.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Speed & Accent */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Gauge size={15} className="text-primary" /> Velocidade & Sotaque
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Speed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Gauge size={12} />
                    Velocidade da fala
                  </Label>
                  <Badge variant="secondary" className="text-xs font-mono">{voiceSpeed}x</Badge>
                </div>
                <Slider
                  value={[voiceSpeed * 10]}
                  onValueChange={([v]) => onUpdate("voice_speed", Math.round(v) / 10)}
                  min={7}
                  max={12}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>Lento (0.7x)</span>
                  <span>Normal (1.0x)</span>
                  <span>Rápido (1.2x)</span>
                </div>
              </div>

              {/* Accent */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Globe size={12} />
                  Sotaque / Idioma
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCENTS.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => onUpdate("voice_accent", acc.id)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                        voiceAccent === acc.id
                          ? "border-primary bg-primary/10 ring-1 ring-primary/30 font-medium"
                          : "border-border hover:border-primary/40 hover:bg-accent/30"
                      }`}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default VoiceSettings;
