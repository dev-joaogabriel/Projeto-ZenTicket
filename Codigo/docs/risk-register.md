# Registro de Riscos

| ID | Risco | Probabilidade | Impacto | Mitigação | Plano de Contingência |
|----|-------|---------------|---------|-----------|------------------------|
| R1 | Instabilidade da API/DB local | Média | Médio | Scripts idempotentes, retries | Modo somente leitura, reprocessar seeds |
| R2 | Custos de IA imprevisíveis | Alta | Alto | Limites, cache, monitoramento | Desligar IA e fallback para FAQ estática |
| R3 | Bugs em mobile (OEM/versões) | Média | Alto | Testes em emulador + devices | Feature flag para desativar funcionalidades |
| R4 | Regressão de qualidade | Média | Alto | CI com lint, testes e coverage | Reverter PR e hotfix |
| R5 | Questões de acessibilidade | Baixa | Médio | Checklist WCAG e audits | Correções priorizadas no próximo patch |
