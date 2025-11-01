# Manual de Aplicação — Helpdesk App

## 1. 🔍 Visão Geral da Aplicação

O **Helpdesk App** é uma aplicação moderna de suporte construída com **React** e **TypeScript**.  
Ela serve como uma plataforma para **gerenciamento de chamados (tickets)** de suporte, permitindo que usuários criem solicitações e que administradores gerenciem esses chamados e usuários.

### 🧠 Tecnologias Principais (Frontend)

| Categoria | Tecnologia |
|------------|-------------|
| **Framework** | React (via Vite) |
| **Linguagem** | TypeScript |
| **Estilização** | Tailwind CSS |
| **Componentes UI** | shadcn/ui |
| **Roteamento** | React Router DOM |
| **Gerenciamento de Estado (API)** | Tanstack Query (React Query) |
| **Autenticação** | Context API + LocalStorage |

A aplicação também possui suporte a **tema claro (light)** e **escuro (dark)**.

---

## 2. 🧱 Arquitetura e Estrutura

A estrutura de diretórios segue o padrão **modular e por funcionalidade**:

```
src/
 ┣ 📂 pages/        → Páginas da aplicação (Dashboard, Login, NovoTicket, etc.)
 ┣ 📂 hooks/        → Hooks customizados (ex.: use-auth, use-tickets)
 ┣ 📂 components/   → Componentes de UI e layout principal (Layout.tsx)
 ┗ 📂 public/       → Arquivos estáticos (imagens, ícones, etc.)
```

---

## 3. 🔐 Autenticação e Níveis de Acesso

A autenticação é controlada pelo **AuthProvider**.

### 🔸 Login

- O usuário se autentica pela rota `/login`.
- O método `login` envia email e senha ao endpoint `/auth/login` da API.
- O **token JWT** e os **dados do usuário** são salvos em `localStorage` (`auth_user`).

### 🔸 Persistência da Sessão

- O `AuthProvider` verifica o `localStorage` ao carregar o app.
- Se houver token, ele é validado em `/auth/profile` para obter o perfil atualizado.

### 🔸 Logout

- A função `logout` remove o usuário e limpa o `localStorage`.

### 🔸 Níveis de Acesso (Rotas)

| Tipo de Rota | Descrição |
|---------------|------------|
| **PrivateRoute** | Protege rotas que exigem autenticação (`/dashboard`, `/novo-ticket`, etc.) |
| **AdminRoute** | Protege rotas exclusivas de administradores (`/usuarios`, `/relatorios`, etc.) |

> Caso o usuário não esteja autenticado, ele é redirecionado para `/login`.

---

## 4. 🧭 Funcionalidades e Rotas

| Rota | Página | Nível de Acesso | Descrição |
|------|---------|-----------------|------------|
| `/login` | Login | Público | Página de autenticação do usuário |
| `/dashboard` | Dashboard | Autenticado | Página inicial após login |
| `/novo-ticket` | NovoTicket | Autenticado | Criação de um novo chamado |
| `/meus-tickets` | PesquisarTickets | Autenticado | Listagem e busca de chamados do usuário |
| `/editar-ticket/:id` | EditarTicket | Autenticado | Edição de um chamado existente |
| `/visualizar-ticket/:id` | VisualizarTicket | Autenticado | Detalhes de um chamado específico |
| `/faq` | FAQ | Autenticado | Perguntas frequentes |
| `/perfil` | Perfil | Autenticado | Perfil do usuário |
| `/configuracoes` | Configuracoes | Autenticado | Configurações da conta/aplicação |
| `/relatorios` | Relatorios | Administrador | Exibe relatórios do sistema |
| `/todos-chamados` | TodosChamados | Administrador | Lista de todos os chamados |
| `/usuarios` | Usuarios | Administrador | Gerenciamento de usuários |
| `*` | NotFound | Autenticado | Página de erro (rota inexistente) |

---

## 5. 💾 Persistência de Dados (Frontend)

Além da autenticação, os **tickets** são armazenados localmente via **LocalStorage**,  
por meio do hook customizado `use-tickets`.

---

## 6. ⚙️ Guia de Execução (Desenvolvedor)

### 📦 Instalar Dependências
```bash
npm install
```

### 🚀 Executar Servidor de Desenvolvimento
> Por padrão: [http://localhost:8080](http://localhost:8080)
```bash
npm run dev
```

### 🧹 Lint (Verificação de Código)
```bash
npm run lint
```

### 🏗️ Build de Produção
> Gera os arquivos finais na pasta `dist/`
```bash
npm run build
```

### 👀 Preview (Visualizar Build Local)
```bash
npm run preview
```

---

## 7. 🧪 Testes

### 🔹 Frontend (Vitest)

- **Executar testes**
  ```bash
  npm test
  ```

- **Interface interativa**
  ```bash
  npm run test:ui
  ```

- **Gerar cobertura**
  ```bash
  npm run test -- --coverage
  ```

### 🔹 Backend (.NET API)

- **Executar testes**
  ```bash
  dotnet test TicketSystem.API/TicketSystem.API.sln
  ```

---

## 8. 🚀 Deploy (Publicação)

Para publicar a aplicação:

1. Gere o build de produção:
   ```bash
   npm run build
   ```
2. Configure o serviço de hospedagem (ex.: **Vercel**, **Netlify**, **GitHub Pages**).
3. Aponte o host para a pasta **`dist/`** gerada.

---
