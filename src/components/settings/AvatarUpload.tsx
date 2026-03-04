import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Bot, Upload, Loader2, Trash2 } from "lucide-react";

interface AvatarUploadProps {
  userId: string;
  currentUrl: string;
  onUrlChange: (url: string) => void;
}

export const AvatarUpload = ({ userId, currentUrl, onUrlChange }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });

    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    onUrlChange(urlData.publicUrl);
    toast({ title: "Avatar atualizado!" });
    setUploading(false);
  };

  const handleRemove = () => {
    onUrlChange("");
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs font-semibold text-muted-foreground">Avatar da IA</Label>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border shrink-0">
          {currentUrl ? (
            <img src={currentUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <Bot size={24} className="text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-xs"
          >
            {uploading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Upload size={14} className="mr-1.5" />}
            {uploading ? "Enviando..." : "Enviar imagem"}
          </Button>
          {currentUrl && (
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove} className="text-xs text-destructive hover:text-destructive">
              <Trash2 size={12} className="mr-1" /> Remover
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Ou cole uma URL</Label>
        <Input
          value={currentUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://..."
          className="text-xs h-8"
        />
      </div>
    </div>
  );
};
