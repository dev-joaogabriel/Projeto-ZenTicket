import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import Usuarios from './Usuarios'
import { I18nProvider } from '@/i18n/provider'

vi.mock('@/lib/users', () => {
  return {
    listUsers: vi.fn(async () => ({ total: 3, page: 1, pageSize: 50, items: [
      { id: 1, firstName: 'Ana', lastName: 'Silva', fullName: 'Ana Silva', email: 'ana@x.com', userType: 'Customer', isActive: true },
      { id: 2, firstName: 'Bob', lastName: 'Agent', fullName: 'Bob Agent', email: 'bob@x.com', userType: 'Agent', isActive: true },
      { id: 3, firstName: 'Carol', lastName: 'Admin', fullName: 'Carol Admin', email: 'carol@x.com', userType: 'Admin', isActive: false },
    ] })),
    listCustomers: vi.fn(async () => ({ total: 1, page: 1, pageSize: 50, items: [
      { id: 1, firstName: 'Ana', lastName: 'Silva', fullName: 'Ana Silva', email: 'ana@x.com', userType: 'Customer', isActive: true },
    ] })),
    createUser: vi.fn()
  }
})

describe('Usuarios page smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Force PT locale for deterministic assertions
    try { localStorage.setItem('locale', 'pt') } catch {}
  })

  it('renders filters with counters and search input', async () => {
    render(<I18nProvider><Usuarios /></I18nProvider>)
    // Labels
    expect(screen.getByText(/Lista de Usuários/i)).toBeInTheDocument()
    // Search
    expect(screen.getByRole('textbox', { name: /Pesquisar/i })).toBeInTheDocument()
    // Counters may update async; wait for them
    await waitFor(() => {
      expect(screen.getByText(/Todos \(3\)/)).toBeInTheDocument()
      expect(screen.getByText(/Clientes \(1\)/)).toBeInTheDocument()
      expect(screen.getByText(/Agentes \(1\)/)).toBeInTheDocument()
      expect(screen.getByText(/Admins \(1\)/)).toBeInTheDocument()
    })
  })
})
