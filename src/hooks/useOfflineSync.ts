import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import Dexie, { Table } from "dexie";
import { toast } from "./use-toast";

// Configuração do banco de dados local com Dexie
export class AppDatabase extends Dexie {
    leads!: Table<any, string>;
    messages!: Table<any, string>;
    syncQueue!: Table<{ id?: number; action: string; table: string; data: any; timestamp: number }, number>;

    constructor() {
        super("VoxAppDB");
        this.version(1).stores({
            leads: "id, user_id, status, updated_at",
            messages: "id, lead_id, user_id, created_at",
            syncQueue: "++id, action, table, timestamp"
        });
    }
}

export const db = new AppDatabase();

export const useOfflineSync = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;

        const syncPendingActions = async () => {
            const isOnline = navigator.onLine;
            if (!isOnline) return;

            const queue = await db.syncQueue.orderBy("timestamp").toArray();
            if (queue.length === 0) return;

            let successCount = 0;

            for (const item of queue) {
                try {
                    if (item.action === "UPDATE" && item.table === "vox_leads") {
                        const { error } = await supabase
                            .from("vox_leads")
                            .update(item.data)
                            .eq("id", item.data.id);

                        if (!error) {
                            await db.syncQueue.delete(item.id!);
                            successCount++;
                        }
                    }
                    // Adicionar mais ações conforme necessário (INSERT, DELETE)
                } catch (error) {
                    console.error("Sync error for item:", item, error);
                }
            }

            if (successCount > 0) {
                toast({
                    title: "Sincronização concluída",
                    description: `${successCount} alterações locais enviadas para a nuvem.`,
                });
            }
        };

        // Sincronizar ao carregar e quando a conexão voltar
        syncPendingActions();
        window.addEventListener("online", syncPendingActions);

        return () => {
            window.removeEventListener("online", syncPendingActions);
        };
    }, [user]);

    // Função para salvar offline e na fila
    const updateLeadOffline = async (leadId: string, updates: any) => {
        const isOnline = navigator.onLine;

        // 1. Atualizar localmente
        await db.leads.update(leadId, updates);

        // 2. Se online, tentar Supabase; se falhar ou offline, pôr na fila
        if (isOnline) {
            const { error } = await supabase.from("vox_leads").update(updates).eq("id", leadId);
            if (error) {
                await db.syncQueue.add({
                    action: "UPDATE",
                    table: "vox_leads",
                    data: { id: leadId, ...updates },
                    timestamp: Date.now()
                });
                toast({ title: "Salvo localmente", description: "Alterações aguardando rede.", variant: "secondary" });
            }
        } else {
            await db.syncQueue.add({
                action: "UPDATE",
                table: "vox_leads",
                data: { id: leadId, ...updates },
                timestamp: Date.now()
            });
            toast({ title: "Modo Offline", description: "Alteração salva localmente.", variant: "secondary" });
        }
    };

    return { updateLeadOffline, db };
};
