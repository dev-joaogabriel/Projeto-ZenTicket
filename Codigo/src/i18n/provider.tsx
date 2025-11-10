import React, { createContext, useContext, useMemo, useState } from 'react'
import pt from './pt.json'
import en from './en.json'

type Messages = Record<string, string>

type I18nContextType = {
  locale: 'pt' | 'en'
  t: (key: string, params?: Record<string, string | number>) => string
  setLocale: (l: 'pt' | 'en') => void
}

const I18nContext = createContext<I18nContextType | null>(null)

const format = (template: string, params?: Record<string, string | number>) => {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`))
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<'pt' | 'en'>(() => {
    const saved = (typeof localStorage !== 'undefined' ? localStorage.getItem('locale') : null) as 'pt' | 'en' | null
    if (saved === 'pt' || saved === 'en') return saved
    const nav = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'pt'
    return nav.startsWith('pt') ? 'pt' : 'en'
  })
  const messages: Record<'pt' | 'en', Messages> = useMemo(() => ({ pt, en }), [])
  const value: I18nContextType = useMemo(() => ({
    locale,
    setLocale: (l) => {
      try { localStorage.setItem('locale', l) } catch {}
      setLocale(l)
    },
    t: (key, params) => {
      const dict = messages[locale] || {}
      const msg = dict[key] || key
      return format(msg, params)
    }
  }), [locale, messages])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
