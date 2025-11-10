import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('./api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  }
}))

import { api } from './api'
import {
  listTickets,
  createTicket,
  updateTicketStatusByNumber,
  assignTicketByDbId,
  addTicketMessage,
  getTicketMessages,
  getTicketByNumber,
  mapApiTicketToStore,
  type ApiTicketSummary,
  type ApiMessage
} from './tickets'

const asMock = <T extends (...args: any[]) => any>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>

function fakeSummary(partial: Partial<ApiTicketSummary> = {}): ApiTicketSummary {
  const now = new Date().toISOString()
  return {
    id: 10,
    number: 'TCK-10',
    subject: 'Subject',
    status: 'Open',
    priority: 'High',
    department: 'Dept',
    customer: 'Customer',
    assignedAgent: 'Agent',
    createdAt: now,
    updatedAt: now,
    isOverdue: false,
    slaHours: 4,
    messageCount: 0,
    ...partial
  }
}

describe('tickets api layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('listTickets maps items with defaults', async () => {
    asMock(api.get).mockResolvedValueOnce({ data: { data: { total: 1, page: 1, pageSize: 50, items: [fakeSummary()] } } })
    const res = await listTickets()
    expect(api.get).toHaveBeenCalledWith('/tickets', { params: { page: 1, pageSize: 50, q: undefined } })
    expect(res.items[0].id).toBe('TCK-10')
  })

  it('createTicket posts and maps detail', async () => {
    const detail = {
      id: 22,
      number: 'TCK-22',
      subject: 'Printer broken',
      status: 'Open',
      priority: 'Urgent',
      department: 'TI',
      customer: 'Alice',
      assignedAgent: null,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      isOverdue: false,
      slaHours: 8,
      messageCount: 3,
      description: 'Full description'
    }
    asMock(api.post).mockResolvedValueOnce({ data: { data: detail } })
    const store = await createTicket({ subject: detail.subject, description: detail.description, priority: 'Urgent', departmentId: 1, customerId: 5 })
    expect(api.post).toHaveBeenCalledWith('/tickets', { subject: detail.subject, description: detail.description, priority: 'Urgent', departmentId: 1, customerId: 5 })
    expect(store.id).toBe('TCK-22')
    expect(store.prioridade).toBe('Crítica')
  })

  it('updateTicketStatusByNumber resolves when found', async () => {
    // first GET list call to find ticket
    asMock(api.get).mockResolvedValueOnce({ data: { data: { total: 1, page: 1, pageSize: 1, items: [fakeSummary({ id: 50, number: 'TCK-50' })] } } })
    asMock(api.put).mockResolvedValueOnce({ data: { message: 'ok' } })
    await updateTicketStatusByNumber('TCK-50', 'Resolvido')
    expect(api.get).toHaveBeenCalled()
    expect(api.put).toHaveBeenCalledWith('/tickets/50/status', { newStatus: 'Resolved' })
  })

  it('assignTicketByDbId calls PUT', async () => {
    asMock(api.put).mockResolvedValueOnce({ data: { message: 'ok' } })
    await assignTicketByDbId(99, 7)
    expect(api.put).toHaveBeenCalledWith('/tickets/99/assign', { agentId: 7 })
  })

  it('addTicketMessage returns messages list', async () => {
    const messages: ApiMessage[] = [
      { id: 1, ticketId: 5, authorId: 2, authorName: 'Bob', content: 'First', type: 'Public', isInternal: false, isEdited: false, createdAt: new Date().toISOString() },
      { id: 2, ticketId: 5, authorId: 3, authorName: 'Alice', content: 'Second', type: 'Public', isInternal: false, isEdited: false, createdAt: new Date().toISOString() }
    ]
    const detail = { ...fakeSummary({ id: 5, number: 'TCK-5' }), description: 'Desc', messages }
    asMock(api.post).mockResolvedValueOnce({ data: { data: detail } })
    const returned = await addTicketMessage(5, 'Hello', { isInternal: true })
    expect(api.post).toHaveBeenCalledWith('/tickets/5/messages', { content: 'Hello', isInternal: true })
    expect(returned).toHaveLength(2)
  })

  it('getTicketMessages fetches messages', async () => {
    const msgs: ApiMessage[] = [{ id: 10, ticketId: 9, authorId: 1, authorName: 'Zed', content: 'Note', type: 'Public', isInternal: false, isEdited: false, createdAt: new Date().toISOString() }]
    asMock(api.get).mockResolvedValueOnce({ data: { data: msgs } })
    const got = await getTicketMessages(9)
    expect(api.get).toHaveBeenCalledWith('/tickets/9/messages')
    expect(got[0].id).toBe(10)
  })

  it('getTicketByNumber direct route happy path', async () => {
    const detail = { ...fakeSummary({ id: 70, number: 'TCK-70' }), description: 'Detail text' }
    asMock(api.get).mockResolvedValueOnce({ data: { data: detail } })
    const ticket = await getTicketByNumber('TCK-70')
    expect(api.get).toHaveBeenCalledWith('/tickets/by-number/TCK-70')
    expect(ticket?.dbId).toBe(70)
    expect(ticket?.hasFullDetail).toBe(true)
  })

  it('getTicketByNumber fallback legacy route path', async () => {
    // First call fails (simulate non-404 so fallback triggers)
    const error = new Error('fail') as any
    error.response = { status: 500 }
    asMock(api.get).mockRejectedValueOnce(error)
    // list search finds one item
    asMock(api.get).mockResolvedValueOnce({ data: { data: { total: 1, page: 1, pageSize: 1, items: [fakeSummary({ id: 123, number: 'LEG-1' })] } } })
    // legacy detail call
    const legacyDetail = { ...fakeSummary({ id: 123, number: 'LEG-1' }), description: 'Legacy description' }
    asMock(api.get).mockResolvedValueOnce({ data: { data: legacyDetail } })
    const ticket = await getTicketByNumber('LEG-1')
    // Ensure we attempted modern then fallback list then legacy detail
    expect((api.get as any).mock.calls[0][0]).toBe('/tickets/by-number/LEG-1')
    expect((api.get as any).mock.calls[1][0]).toBe('/tickets')
    expect((api.get as any).mock.calls[2][0]).toMatch(/\/tickets\/123$/)
    expect(ticket?.dbId).toBe(123)
    expect(ticket?.hasFullDetail).toBe(true)
  })
})
