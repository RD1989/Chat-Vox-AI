import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Eye, EyeOff, Key } from "lucide-react";

const AdminApiKeys = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [openrouterModel, setOpenrouterModel] = useState("google/gemini-2.0-flash-001");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", ["openrouter_api_key", "openrouter_model"]);

      if (data) {
        const keyRow = data.find((r) => r.key === "openrouter_api_key");
        const modelRow = data.find((r) => r.key === "openrouter_model");
        if (keyRow?.value) setOpenrouterKey(keyRow.value);
        if (modelRow?.value) setOpenrouterModel(modelRow.value);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const upserts = [
      {
        key: "openrouter_api_key",
        value: openrouterKey,
        description: "Chave API do OpenRouter para o chat IA",
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      },
      {
        key: "openrouter_model",
        value: openrouterModel,
        description: "Modelo padrão do OpenRouter",
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      },
    ];

    for (const row of upserts) {
      const { error } = await supabase
        .from("system_settings")
        .upsert(row as any, { onConflict: "key" });
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    toast({ title: "Configurações de API salvas!" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Chave API</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure a chave API do OpenRouter que será usada por todos os usuários do sistema.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key size={16} className="text-primary" />
            <CardTitle className="text-sm">OpenRouter API</CardTitle>
          </div>
          <CardDescription>
            Obtenha sua chave em{" "}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              openrouter.ai/keys
            </a>
            . Esta chave será compartilhada entre todos os usuários.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Chave API</Label>
            <div className="flex gap-2">
              <Input
                type={showKey ? "text" : "password"}
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                placeholder="sk-or-v1-..."
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Modelo Padrão</Label>
            <Input
              value={openrouterModel}
              onChange={(e) => setOpenrouterModel(e.target.value)}
              placeholder="google/gemini-2.0-flash-001"
            />
            <p className="text-[10px] text-muted-foreground">
              Ex: google/gemini-2.0-flash-001, openai/gpt-4o-mini, anthropic/claude-3-haiku
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
        Salvar Configurações
      </Button>
    </div>
  );
};

export default AdminApiKeys;

