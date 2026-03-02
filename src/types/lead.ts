export interface Lead {
  id: string;
  created_at: string;
  nome: string;
  whatsapp: string;
  servico_interesse: string;
  status: string;
  notas: string | null;
}

export type LeadInsert = Omit<Lead, 'id' | 'created_at'>;

export const LEAD_STATUSES = ['Novo', 'Agendado', 'Atendido', 'Arquivado'] as const;

export const SERVICES = [
  'Botox',
  'Preenchimento',
  'Enzimas',
  'Criolipólise',
  'Endolaser',
  'Luz Pulsada',
  'Lifting',
  'Bioestimulador de Colágeno',
  'Peeling',
  'Limpeza de Pele',
] as const;
