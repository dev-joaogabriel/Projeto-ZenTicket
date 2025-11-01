import { describe, it, expect } from 'vitest';
import { mapApiTicketToStore, type ApiTicketSummary } from './tickets';

describe('mapApiTicketToStore', () => {
  it('maps API summary to store ticket with PT enums and SLA calculation', () => {
    const now = new Date().toISOString();
    const api: ApiTicketSummary = {
      id: 1,
      number: 'TCK-001',
      subject: 'Printer not working',
      status: 'Open',
      priority: 'High',
      department: 'Suporte Técnico',
      customer: 'João',
      assignedAgent: 'Maria',
      createdAt: now,
      updatedAt: now,
      isOverdue: false,
      slaHours: 4,
      messageCount: 2,
    };
    const store = mapApiTicketToStore(api);
    expect(store.id).toBe('TCK-001');
    expect(store.titulo).toBe(api.subject);
    expect(store.status).toBe('Aberto');
    expect(store.prioridade).toBe('Alta');
    expect(store.usuario).toBe('João');
    expect(store.departamento).toBe('Suporte Técnico');
    expect(store.slaVencimento).toBeTruthy();
  });
});