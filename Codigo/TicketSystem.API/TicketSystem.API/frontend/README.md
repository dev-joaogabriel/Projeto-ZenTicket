Frontend de teste para a TicketSystem API

Como usar:
1. Execute a API localmente (verifique a porta no console ou no launchSettings).

2. Abra `frontend/index.html` em um navegador (pode ser via VSCode Live Server, ou arrastando o arquivo para o navegador).

3. Atualize o campo "Base URL da API" para a URL correta da sua API (ex: https://localhost:7001).

Funcionalidades disponíveis:
- Login (preenchido com admin@ticketsystem.com / admin123 por padrão)
- Registro público de cliente
- Obter perfil do usuário logado
- Criar usuário como admin (requer token de admin)

Observações:
- O frontend é um cliente estático simples, sem bundlers.
- Se estiver usando HTTPS com certificado dev, o navegador pode bloquear requisições se a API e o arquivo estiverem em origens diferentes; prefira abrir o HTML via um servidor local (ex: Live Server no VSCode) para evitar CORS issues, ou use a URL exata configurada no app (app já permite CORS "AllowAll" por padrão).
