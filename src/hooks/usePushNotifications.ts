import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const usePushNotifications = (userId: string | undefined) => {
  const permissionRef = useRef<NotificationPermission>("default");

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") {
      permissionRef.current = "granted";
      return true;
    }
    if (Notification.permission === "denied") return false;

    const result = await Notification.requestPermission();
    permissionRef.current = result;
    return result === "granted";
  }, []);

  const showNotification = useCallback((title: string, body: string) => {
    if (permissionRef.current !== "granted") return;
    try {
      const n = new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "vox-lead",
      } as NotificationOptions);
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch {
      // SW fallback or unsupported
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    requestPermission();

    const channel = supabase
      .channel("push_leads")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "vox_leads",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;

          // Notify on qualification
          if (newData.qualified && !oldData?.qualified) {
            showNotification(
              "🔥 Lead Qualificado!",
              `${newData.name} atingiu score ${newData.qualification_score}. Abra o painel para ver.`
            );
            toast({
              title: "🔥 Lead Qualificado!",
              description: `${newData.name} foi qualificado com score ${newData.qualification_score}`,
            });
          }

          // Notify on handoff request
          if (newData.handoff_requested && !oldData?.handoff_requested) {
            showNotification(
              "🙋 Transbordo Solicitado",
              `${newData.name} precisa de atendimento humano!`
            );
            toast({
              title: "🙋 Transbordo Humano",
              description: `${newData.name} solicitou atendimento humano`,
              variant: "destructive",
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vox_leads",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newLead = payload.new as any;
          showNotification(
            "✨ Novo Lead!",
            `${newLead.name} iniciou uma conversa.`
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, requestPermission, showNotification]);

  return { requestPermission };
};
