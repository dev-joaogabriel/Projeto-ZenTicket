import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Login from './Login'
import { I18nProvider } from '@/i18n/provider'

// Minimal mocks for hooks used in Login
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: () => {} }) }))
vi.mock('@/hooks/use-auth-hook', () => ({ useAuth: () => ({ login: async () => true }) }))
vi.mock('react-router-dom', async (orig) => {
  const actual: any = await orig()
  return { ...actual, useNavigate: () => () => {} }
})

describe('Login page smoke', () => {
  it('renders email and password fields and submit button', () => {
    render(<I18nProvider><Login /></I18nProvider>)
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument()
  })
})
