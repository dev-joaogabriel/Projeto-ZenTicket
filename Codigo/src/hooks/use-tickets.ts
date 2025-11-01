import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

export type TicketStatus = "Aberto" | "Em Andamento" | "Pendente" | "Resolvido" | "Fechado";
export type TicketPrioridade = "Crítica" | "Alta" | "Média" | "Baixa";

export interface Ticket {
  id: string;
  titulo: string;
  descricao: string;
  status: TicketStatus;
  prioridade: TicketPrioridade;
  categoria: string;
  subcategoria?: string;
  usuario: string;
  departamento: string; // Ex.: "TI", "Financeiro", "RH", "Operações"
  dataCriacao: string; // ISO string
  dataAtualizacao: string; // ISO string
  slaVencimento?: string; // ISO string
  /** Indica se já temos os dados completos (detalhe) persistidos localmente */
  hasFullDetail?: boolean;
}

const SLA_HOURS: Record<TicketPrioridade, number> = {
  Crítica: 2,
  Alta: 8,
  Média: 24,
  Baixa: 72,
};

export function computeSlaStatus(ticket: Ticket) {
  if (!ticket.slaVencimento) return { status: "Normal", hoursUntil: Infinity as number };
  const now = Date.now();
  const deadline = new Date(ticket.slaVencimento).getTime();
  const hoursUntil = (deadline - now) / (1000 * 60 * 60);
  if (hoursUntil < 0) return { status: "Vencido" as const, hoursUntil };
  if (hoursUntil < 2) return { status: "Crítico" as const, hoursUntil };
  return { status: "Normal" as const, hoursUntil };
}

function withComputedSla(prioridade: TicketPrioridade): string {
  const hours = SLA_HOURS[prioridade];
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

export interface AddTicketInput {
  id?: string;
  titulo: string;
  descricao: string;
  categoria: string;
  prioridade: TicketPrioridade;
  usuario: string;
  departamento: string;
  subcategoria?: string;
}

export function useTickets() {
  const [tickets, setTickets] = useLocalStorage<Ticket[]>("tickets", []);

  const addTicket = useCallback((input: AddTicketInput): Ticket => {
    const now = new Date().toISOString();
    const newTicket: Ticket = {
      id: input.id ?? generateTicketId(),
      titulo: input.titulo,
      descricao: input.descricao,
      categoria: input.categoria,
      subcategoria: input.subcategoria,
      prioridade: input.prioridade,
      status: "Aberto",
      usuario: input.usuario,
      departamento: input.departamento,
      dataCriacao: now,
      dataAtualizacao: now,
      slaVencimento: withComputedSla(input.prioridade),
    };
    setTickets((prev) => [newTicket, ...prev]);
    return newTicket;
  }, [setTickets]);

  const updateTicket = useCallback((id: string, changes: Partial<Ticket>) => {
    setTickets((prev) => prev.map(t => t.id === id ? { ...t, ...changes, dataAtualizacao: new Date().toISOString() } : t));
  }, [setTickets]);

  /**
   * Atualiza (ou cria) um ticket com detalhes completos vindos do backend (ex: descrição).
   * Mantém campos já existentes e marca hasFullDetail=true para evitar refetch desnecessário.
   */
  const upsertTicketDetail = useCallback((detail: Partial<Ticket> & { id: string }) => {
    setTickets(prev => {
      const exists = prev.find(t => t.id === detail.id);
      if (exists) {
        return prev.map(t => t.id === detail.id ? { ...t, ...detail, hasFullDetail: true } : t);
      }
      // Caso não exista, cria um registro mínimo
      const now = new Date().toISOString();
      const newTicket: Ticket = {
        id: detail.id,
        titulo: detail.titulo ?? "(Sem título)",
        descricao: detail.descricao ?? "",
        status: (detail.status as TicketStatus) || "Aberto",
        prioridade: (detail.prioridade as TicketPrioridade) || "Média",
        categoria: detail.categoria ?? "",
        usuario: detail.usuario ?? "",
        departamento: detail.departamento ?? "",
        dataCriacao: detail.dataCriacao ?? now,
        dataAtualizacao: detail.dataAtualizacao ?? now,
        slaVencimento: detail.slaVencimento,
        subcategoria: detail.subcategoria,
        hasFullDetail: true,
      };
      return [newTicket, ...prev];
    });
  }, [setTickets]);

  const removeTicket = useCallback((id: string) => {
    setTickets((prev) => prev.filter(t => t.id !== id));
  }, [setTickets]);

  const replaceAll = useCallback((items: Ticket[]) => {
    setTickets(() => items);
  }, [setTickets]);

  return { tickets, addTicket, updateTicket, removeTicket, replaceAll, upsertTicketDetail };
}

function generateTicketId() {
  const now = new Date();
  const year = now.getFullYear();
  const num = Math.floor(Math.random() * 9999) + 1;
  return `HD-${year}-${num.toString().padStart(4, "0")}`;
}
