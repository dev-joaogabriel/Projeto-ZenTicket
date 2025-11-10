import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock api module used by users.ts
vi.mock('./api', () => {
  return {
    api: {
      get: vi.fn(),
      post: vi.fn(),
    },
  }
})

import { api } from './api'
import { listUsers, listCustomers, createUser, type ApiUser } from './users'

// Helper to cast mocked functions for type-safe expectation usage
const asMock = <T extends (...args: any[]) => any>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>

describe('users api layer', () => {
  const sampleUser: ApiUser = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    email: 'john@example.com',
    userType: 'Customer',
    isActive: true,
    lastLoginAt: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('listUsers uses default params and returns data', async () => {
    asMock(api.get).mockResolvedValueOnce({ data: { data: { total: 1, page: 1, pageSize: 50, items: [sampleUser] } } })

    const res = await listUsers()

    expect(api.get).toHaveBeenCalledWith('/users', { params: { page: 1, pageSize: 50, q: undefined } })
    expect(res).toEqual({ total: 1, page: 1, pageSize: 50, items: [sampleUser] })
  })

  it('listUsers passes custom pagination and search', async () => {
    asMock(api.get).mockResolvedValueOnce({ data: { data: { total: 10, page: 2, pageSize: 10, items: [sampleUser] } } })

    const res = await listUsers({ page: 2, pageSize: 10, q: 'john' })

    expect(api.get).toHaveBeenCalledWith('/users', { params: { page: 2, pageSize: 10, q: 'john' } })
    expect(res.page).toBe(2)
    expect(res.pageSize).toBe(10)
  })

  it('listCustomers calls the correct endpoint', async () => {
    asMock(api.get).mockResolvedValueOnce({ data: { data: { total: 1, page: 1, pageSize: 50, items: [sampleUser] } } })

    const res = await listCustomers()

    expect(api.get).toHaveBeenCalledWith('/users/customers', { params: { page: 1, pageSize: 50, q: undefined } })
    expect(res.items[0].email).toBe('john@example.com')
  })

  it('createUser posts the payload and returns created user', async () => {
    const input = { firstName: 'Ana', lastName: 'Silva', email: 'ana@example.com', password: 'secret12', userType: 'Customer' as const }
    const created: ApiUser = { ...sampleUser, id: 2, firstName: 'Ana', lastName: 'Silva', fullName: 'Ana Silva', email: 'ana@example.com' }
    asMock(api.post).mockResolvedValueOnce({ data: { data: created } })

    const res = await createUser(input)

    expect(api.post).toHaveBeenCalledWith('/users', input)
    expect(res).toEqual(created)
  })
})
