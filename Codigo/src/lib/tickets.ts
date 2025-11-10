import { api } from "./api";
import type { Ticket as StoreTicket, TicketPrioridade, TicketStatus } from "@/hooks/use-tickets";

// Backend DTOs (subset used by the list view)
export type ApiTicketSummary = {
    id: number;
    number: string;
    subject: string;
    status: "Open" | "InProgress" | "Pending" | "Resolved" | "Closed" | string;
    priority: "Urgent" | "High" | "Normal" | "Low" | string;
    department: string;
    customer: string;
    assignedAgent?: string | null;
    createdAt: string; // ISO
    updatedAt?: string | null; // ISO or null when never updated
    isOverdue: boolean;
    slaHours?: number | null;
    messageCount: number;
};

export type ApiListResponse<T> = {
    message?: string;
    data: {
        total: number;
        page: number;
        pageSize: number;
        items: T[];
    };
};

// Detail DTO (subset we care about)
export type ApiTicketDetail = ApiTicketSummary & {
    description: string;
    messages?: ApiMessage[];
};

export type ApiMessage = {
    id: number;
    ticketId: number;
    authorId: number;
    authorName: string;
    content: string;
    type: string;
    isInternal: boolean;
    isEdited: boolean;
    createdAt: string;
    updatedAt?: string | null;
    editedAt?: string | null;
};

const statusMapToPt: Record<string, TicketStatus> = {
    Open: "Aberto",
    InProgress: "Em Andamento",
    Pending: "Pendente",
    Resolved: "Resolvido",
    Closed: "Fechado",
};

const priorityMapToPt: Record<string, TicketPrioridade> = {
    Urgent: "Crítica",
    High: "Alta",
    Normal: "Média",
    Low: "Baixa",
};

const statusMapToEn: Record<TicketStatus, string> = {
    "Aberto": "Open",
    "Em Andamento": "InProgress",
    "Pendente": "Pending",
    "Resolvido": "Resolved",
    "Fechado": "Closed",
};

function addHours(iso: string, hours: number): string {
    const d = new Date(iso);
    d.setHours(d.getHours() + hours);
    return d.toISOString();
}

export function mapApiTicketToStore(t: ApiTicketSummary): StoreTicket {
    const status = statusMapToPt[t.status] ?? (t.status as TicketStatus);
    const prioridade = priorityMapToPt[t.priority] ?? (t.priority as TicketPrioridade);
    const slaVencimento = t.slaHours ? addHours(t.createdAt, t.slaHours) : undefined;

    return {
        id: t.number, // Keep human-friendly number as the external ID used in UI routes
        dbId: t.id,
        titulo: t.subject,
        descricao: "", // Summary payload doesn't include description
        status,
        prioridade,
        // Backend ainda não fornece categoria; exibir Setor (department) como fallback
        categoria: t.department || "",
        subcategoria: undefined,
        usuario: t.customer,
        departamento: t.department,
        dataCriacao: t.createdAt,
        dataAtualizacao: t.updatedAt ?? t.createdAt,
        slaVencimento,
    };
}

export async function listTickets(params?: { page?: number; pageSize?: number; q?: string }): Promise<{
    total: number;
    page: number;
    pageSize: number;
    items: StoreTicket[];
}> {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 50;
    const q = params?.q ?? "";
    const response = await api.get<ApiListResponse<ApiTicketSummary>>("/tickets", {
        params: { page, pageSize, q: q || undefined },
    });
    const data = response.data.data;
    return {
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        items: data.items.map(mapApiTicketToStore),
    };
}

// Create ticket
export type CreateTicketInput = {
    subject: string;
    description: string;
    priority: "Urgent" | "High" | "Normal" | "Low";
    departmentId: number;
    customerId?: number; // optional when caller is the customer
};

export type ApiResponse<T> = { message?: string; data: T };

export async function createTicket(input: CreateTicketInput): Promise<StoreTicket> {
    const res = await api.post<ApiResponse<ApiTicketDetail>>("/tickets", {
        subject: input.subject,
        description: input.description,
        priority: input.priority,
        departmentId: input.departmentId,
        customerId: input.customerId,
    });
    // Backend returns TicketDetailDto; map minimal fields compatible with list mapping
    const data = res.data.data;
    const summary: ApiTicketSummary = {
        id: data.id,
        number: data.number,
        subject: data.subject,
        status: data.status,
        priority: data.priority,
        department: data.department,
        customer: data.customer,
        assignedAgent: data.assignedAgent,
        createdAt: data.createdAt,
    updatedAt: data.updatedAt ?? data.createdAt,
        isOverdue: !!data.isOverdue,
        slaHours: data.slaHours,
        messageCount: data.messageCount ?? 0,
    };
    const store = mapApiTicketToStore(summary);
    // ensure dbId from detail is preserved
    store.dbId = data.id;
    return store;
}

export async function getTicketByNumber(number: string, persist?: (ticket: StoreTicket) => void): Promise<StoreTicket | null> {
    // Nova rota otimizada: /tickets/by-number/{number}
    try {
        const detail = await api.get<{ message?: string; data: ApiTicketDetail }>(`/tickets/by-number/${number}`);
        const d: ApiTicketDetail = detail.data.data as ApiTicketDetail;
        const summaryFromDetail: ApiTicketSummary = {
            id: d.id,
            number: d.number,
            subject: d.subject,
            status: d.status,
            priority: d.priority,
            department: d.department,
            customer: d.customer,
            assignedAgent: d.assignedAgent,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt ?? d.createdAt,
            isOverdue: !!d.isOverdue,
            slaHours: d.slaHours ?? undefined,
            messageCount: d.messageCount ?? 0,
        };
        const mapped = mapApiTicketToStore(summaryFromDetail);
        mapped.dbId = d.id;
        mapped.descricao = d.description ?? "";
        mapped.hasFullDetail = true;
        persist?.(mapped);
        return mapped;
    } catch (e: unknown) {
        // Se não encontrado, não faz sentido tentar fallback; apenas retorna null
        type HttpError = { response?: { status?: number } };
        const status = (e as HttpError)?.response?.status;
        if (status === 404) {
            return null;
        }
        // Em outros erros (ex: backend antigo sem rota), faz fallback para busca
        try {
            const list = await api.get<ApiListResponse<ApiTicketSummary>>("/tickets", {
                params: { q: number, page: 1, pageSize: 1 },
            });
            const item = list.data.data.items?.[0];
            if (!item || item.number !== number) return null;
            const legacyDetail = await api.get<{ message?: string; data: ApiTicketDetail }>(`/tickets/${item.id}`);
            const d: ApiTicketDetail = legacyDetail.data.data as ApiTicketDetail;
            const summaryFromDetail: ApiTicketSummary = {
                id: d.id,
                number: d.number,
                subject: d.subject,
                status: d.status,
                priority: d.priority,
                department: d.department,
                customer: d.customer,
                assignedAgent: d.assignedAgent,
                createdAt: d.createdAt,
                updatedAt: d.updatedAt ?? d.createdAt,
                isOverdue: !!d.isOverdue,
                slaHours: d.slaHours ?? undefined,
                messageCount: d.messageCount ?? 0,
            };
            const mapped = mapApiTicketToStore(summaryFromDetail);
            mapped.descricao = d.description ?? "";
            mapped.hasFullDetail = true;
            persist?.(mapped);
            return mapped;
        } catch {
            return null;
        }
    }
}

export async function updateTicketStatusByNumber(number: string, newStatusPt: TicketStatus): Promise<void> {
    const list = await api.get<ApiListResponse<ApiTicketSummary>>("/tickets", {
        params: { q: number, page: 1, pageSize: 1 },
    });
    const item = list.data.data.items?.[0];
    if (!item || item.number !== number) throw new Error("Ticket não encontrado");
    const newStatus = statusMapToEn[newStatusPt];
    await api.put<{ message?: string }>(`/tickets/${item.id}/status`, { newStatus });
}

export async function assignTicketByDbId(dbId: number, agentId: number): Promise<void> {
    await api.put<{ message?: string }>(`/tickets/${dbId}/assign`, { agentId });
}

export async function addTicketMessage(dbId: number, content: string, options?: { isInternal?: boolean }): Promise<ApiMessage[]> {
    const body = { content, isInternal: options?.isInternal ?? false };
    const res = await api.post<{ message?: string; data: ApiTicketDetail }>(`/tickets/${dbId}/messages`, body);
    const detail = res.data.data;
    // When backend returns updated ticket, we can surface its messages list if present
    return (detail.messages ?? []) as ApiMessage[];
}

// Fetch messages for a ticket by internal database id (relies on backend filtering internal notes for customers)
export async function getTicketMessages(dbId: number): Promise<ApiMessage[]> {
    const res = await api.get<{ message?: string; data: ApiMessage[] }>(`/tickets/${dbId}/messages`);
    return res.data.data;
}
