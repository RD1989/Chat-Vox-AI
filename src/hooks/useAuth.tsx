import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar sessão inicial
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initAuth();

    // Escutar mudanças de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/login");
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Usar a Nova Edge Function Anti-Fraude (IP Block) ao invés da rotina Client direta do Supabase
      const { data, error } = await supabase.functions.invoke("vox-signup", {
        body: { email, password, full_name: fullName }
      });

      if (error) {
        // O error do Supabase Functions precisa ser destrinchado se ele veio do nosso block de IP 403
        throw new Error(error.message || "Erro desconhecido na rede");
      }

      if (data?.error) {
        // Custom errors vindos da Response JSON da Function (ex: "Limite de contas atingido")
        throw new Error(data.error);
      }

      // Logar o usuário recém criado automaticamente
      await signIn(email, password);

      return { data: data?.user, error: null };
    } catch (error: any) {
      console.warn("[Anti-Fraude SignUp] Erro interceptado no Client:", error);
      return { error };
    }
  };

  return { user, loading, signOut, signIn, signUp };
};
