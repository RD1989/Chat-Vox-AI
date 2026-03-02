import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

// Sons em Base64 para evitar bloqueios de CORS e problemas de cache
const INCOMING_SOUND = "data:audio/mpeg;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqXwXwXwXwXwXwXw"; // Representação simbólica de um Pop MP3
const OUTGOING_SOUND = "data:audio/mpeg;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqXwXwXwXwXwXwXw"; // Representação simbólica de "Swoosh"

export const playIncomingSound = () => {
    const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/pop.ogg");
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Autoplay bloqueado pelo navegador', e));
};

export const playOutgoingSound = () => {
    const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Autoplay bloqueado pelo navegador', e));
};

export const useSound = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        // Assinar canal global para ouvir mensagens novas de qualquer lead neste user_id
        const channel = supabase
            .channel("global_sound_notifications")
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "vox_messages",
            }, (payload) => {
                // Se a mensagem veio do lead (role = user), toca som
                const newMsg = payload.new as any;
                if (newMsg.role === "user") {
                    playIncomingSound();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return { playIncomingSound, playOutgoingSound };
};
