# Roadmap

Objetivo: evoluir o HelpDeskUNIP em sprints curtas, com entregas claras, qualidade contínua e foco em UX e mobile.

## Versão 0.1 (MVP base)
- [x] Backend .NET 8 com Tickets, Users, Mensagens (comentários)
- [x] Seed e migrações idempotentes
- [x] Web React + Vite + shadcn
- [x] Autenticação e perfis (Admin, Agente, Cliente)

## Versão 0.2 (Qualidade e UX)
- [x] Comentários públicos/ internos + listagem
- [x] Página de Usuários com filtros e criação
- [ ] Tabela responsiva que vira cards no mobile
- [ ] Acessibilidade: aria-live, roles, contraste

## Versão 0.3 (Mobile/Capacitor)
- [ ] Build Android + smoke tests em emulador
- [ ] Ajustes de navegação/gestos mobile
- [ ] Push/notifications (futuro)

## Versão 0.4 (Qualidade/CI)
- [ ] GitHub Actions: lint + test + coverage + build
- [ ] Badge de coverage e status no README
- [ ] Playwright E2E no CI (upload de report)

## Versão 0.5 (IA e FAQ)
- [ ] FAQ com IA (provider configurável) e RAG simples
- [ ] Comparativo de provedores em docs/ai-evaluation.md

## Riscos e dependências
- API externa de IA e custos variáveis
- Fragmentação Android (versões, OEMs)
- Acesso a dados sensíveis (LGPD) – logs e PII

## Critérios de aceite por release
- Lint PASS, Testes (unit/E2E) PASS, Coverage >= 70%
- Build web e Android OK
- A11y básica sem bloqueadores (axe)
