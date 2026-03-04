import { useEffect, useState, useCallback, useRef } from "react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2, MessageSquare, Search, User, Bot, Send, ArrowLeft, Clock,
  Headphones, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  qualified: boolean;
  city: string | null;
  created_at: string;
  handoff_requested: boolean;
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
  message_type: string;
}

const Conversations = () => {
  const { user } = useAuth();
  const { request } = useApi();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [humanMessage, setHumanMessage] = useState("");
  const [sendingHuman, setSendingHuman] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchLeads = useCallback(async () => {
    if (!user) return;
    const { data } = await request<any[]>(`leads?user_id=${user.id}`);
    if (data) setLeads(data as unknown as Lead[]);
    setLoading(false);
  }, [user, request]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = useCallback(async (leadId: string) => {
    if (!user) return;
    setMessagesLoading(true);
    const { data } = await request<any[]>(`messages?lead_id=${leadId}`);
    if (data) setMessages(data as unknown as Message[]);
    setMessagesLoading(false);
  }, [user, request]);

  const selectLead = (lead: Lead) => {
    setSelectedLead(lead);
    fetchMessages(lead.id);
    setHumanMessage("");
  };

  const sendHumanMessage = async () => {
    if (!humanMessage.trim() || !selectedLead || !user) return;
    setSendingHuman(true);

    const { data: newMsg, error } = await request("messages", {
      method: "POST",
      body: JSON.stringify({
        user_id: user.id,
        lead_id: selectedLead.id,
        role: "assistant",
        content: humanMessage.trim(),
        message_type: "human",
      })
    });

    if (!error) {
      // Mark handoff as resolved, update status
      await request(`leads?id=${selectedLead.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          handoff_requested: false,
          status: "em_atendimento",
        })
      });

      if (newMsg) {
        setMessages(prev => [...prev, newMsg]);
      }

      setHumanMessage("");
      toast({ title: "Mensagem enviada ao lead" });
    } else {
      toast({ title: "Erro ao enviar", variant: "destructive" });
    }
    setSendingHuman(false);
  };

  const filteredLeads = leads.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.phone?.includes(searchQuery)
  );

  // Sort: handoff_requested first
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (a.handoff_requested && !b.handoff_requested) return -1;
    if (!a.handoff_requested && b.handoff_requested) return 1;
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Conversas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitore conversas em tempo real. Responda diretamente quando a IA solicitar transbordo.
        </p>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Lead List */}
        <Card className={`${selectedLead ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 lg:w-96 shrink-0 border-border/50 overflow-hidden`}>
          <div className="p-3 border-b border-border/50">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar lead..."
                className="pl-9 h-9 text-xs bg-accent/30"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {sortedLeads.length > 0 ? (
              <div className="divide-y divide-border/30">
                {sortedLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => selectLead(lead)}
                    className={`w-full text-left px-4 py-3 hover:bg-accent/30 transition-colors ${selectedLead?.id === lead.id ? "bg-accent/50" : ""
                      } ${lead.handoff_requested ? "bg-warning/5" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-primary">
                            {lead.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        {lead.handoff_requested && (
                          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-warning flex items-center justify-center">
                            <Headphones size={8} className="text-warning-foreground" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
                          <span className="text-[9px] text-muted-foreground shrink-0">
                            {format(new Date(lead.created_at), "dd/MM", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {lead.handoff_requested ? (
                            <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 border-warning text-warning">
                              <Headphones size={7} className="mr-0.5" /> Transbordo
                            </Badge>
                          ) : (
                            <Badge
                              variant={lead.qualified ? "default" : "secondary"}
                              className="text-[8px] px-1.5 py-0 h-4"
                            >
                              {lead.qualified ? "Qualificado" : lead.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4">
                <MessageSquare size={28} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Nenhum lead encontrado" : "Nenhuma conversa ainda"}
                </p>
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className={`${selectedLead ? "flex" : "hidden md:flex"} flex-col flex-1 border-border/50 overflow-hidden`}>
          {selectedLead ? (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSelectedLead(null)}>
                  <ArrowLeft size={16} />
                </Button>
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">
                    {selectedLead.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{selectedLead.name}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock size={9} />
                    {format(new Date(selectedLead.created_at), "dd MMM yyyy · HH:mm", { locale: ptBR })}
                    {selectedLead.email && ` · ${selectedLead.email}`}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {selectedLead.handoff_requested && (
                    <Badge variant="outline" className="text-[9px] border-warning text-warning gap-1">
                      <AlertTriangle size={10} /> Aguardando humano
                    </Badge>
                  )}
                  <Badge variant={selectedLead.qualified ? "default" : "secondary"} className="text-[9px]">
                    {selectedLead.qualified ? "Qualificado" : selectedLead.status}
                  </Badge>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="animate-spin text-primary" size={20} />
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div className="flex items-end gap-2 max-w-[80%]">
                            {msg.role === "assistant" && (
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-1 ${msg.message_type === "human" ? "bg-warning/10" : "bg-primary/10"
                                }`}>
                                {msg.message_type === "human" ? (
                                  <Headphones size={12} className="text-warning" />
                                ) : (
                                  <Bot size={12} className="text-primary" />
                                )}
                              </div>
                            )}
                            <div
                              className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : msg.message_type === "human"
                                  ? "bg-warning/10 text-foreground rounded-bl-md border border-warning/20"
                                  : "bg-accent text-foreground rounded-bl-md"
                                }`}
                            >
                              {msg.message_type === "human" && (
                                <p className="text-[9px] font-bold text-warning mb-1 flex items-center gap-1">
                                  <Headphones size={8} /> Atendente humano
                                </p>
                              )}
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={`text-[9px] mt-1 ${msg.role === "user" ? "text-primary-foreground/50" : "text-muted-foreground"
                                }`}>
                                {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            {msg.role === "user" && (
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mb-1">
                                <User size={12} className="text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <MessageSquare size={28} className="mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhuma mensagem nesta conversa</p>
                  </div>
                )}
              </ScrollArea>

              {/* Human reply input */}
              <div className="border-t border-border/50 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Headphones size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={humanMessage}
                      onChange={(e) => setHumanMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendHumanMessage()}
                      placeholder="Responder como humano..."
                      className="pl-9 h-10 text-sm bg-accent/30"
                    />
                  </div>
                  <Button
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl"
                    disabled={!humanMessage.trim() || sendingHuman}
                    onClick={sendHumanMessage}
                  >
                    <Send size={16} />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">
                  💡 Sua resposta aparecerá no chat do lead como mensagem do atendente humano.
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent/50 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={28} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Selecione uma conversa</p>
                <p className="text-xs text-muted-foreground">
                  Escolha um lead na lista para visualizar e responder as mensagens
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Conversations;
