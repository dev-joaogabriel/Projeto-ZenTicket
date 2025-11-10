# Helpdesk App

Aplicação de helpdesk (Vite + React + TypeScript + Tailwind + shadcn/ui).

## Scripts

```sh
# instalar deps
npm install

# dev server (http://localhost:8080 por padrão)
npm run dev

# lint
npm run lint

# build de produção
npm run build

# preview do build local
npm run preview
```

## Estrutura (resumo)

- `src/pages/` — páginas (Dashboard, Tickets, Relatórios, etc.)
- `src/hooks/` — hooks (ex.: `use-tickets`, `use-local-storage`)
- `src/components/` — componentes (layout e ui)
- `public/` — assets estáticos

## Notas

- Tickets são persistidos em LocalStorage via `use-tickets`.
- Tema dark/ligth habilitado; UI com shadcn/ui.

## Deploy

Pode ser publicado em Vercel/Netlify/GitHub Pages. Gere o build com `npm run build` e aponte o host para a pasta `dist/`.

## Testes

### Frontend
Executar testes unitários (Vitest):

```
npm test
```

Interface interativa opcional:

```
npm run test:ui
```

Cobertura:

```
npm run test -- --coverage
```

### Backend (.NET API)

Executar todos os testes:

```
dotnet test TicketSystem.API/TicketSystem.API.sln
```

Gerar cobertura (coverlet collector já referenciado):

```
dotnet test TicketSystem.API/TicketSystem.API.sln /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura
```

### Estrutura de Testes Backend
| Tipo               | Local                    | Descrição                                          |
| ------------------ | ------------------------ | -------------------------------------------------- |
| Health/Auth        | `TicketSystem.API.Tests` | Testes básicos de disponibilidade e autenticação   |
| AutoMapper         | `AutoMapperProfileTests` | Valida configuração de mapeamentos                 |
| Integração Tickets | `TicketsControllerTests` | Exercita endpoints CRUD iniciais com DB em memória |

Utilizamos `WebApplicationFactory` + EFCore InMemory para isolar o banco.

### Adicionando Novos Testes
1. Criar arquivo `*.cs` em `TicketSystem.API.Tests`.
2. Usar `IClassFixture<CustomWebApplicationFactory>` para obter `HttpClient` configurado.
3. Popular dados extras via `factory.Services.CreateScope()` quando necessário.

### Dicas
- Evite lógica complexa nos testes; concentre-se em cenários de usuário.
- Prefira asserts claros com FluentAssertions.
- Nomeie os testes no padrão: `Metodo_Condicao_EfeitoEsperado`.
