```mermaid
gantt
    title Roadmap / Previsão - OkinawaDesk com IA
    dateFormat  YYYY-MM-DD
    axisFormat  %d/%m

    section Planejamento
    Levantamento de Requisitos       :a1, 2025-09-16, 3d
    Definição do Backlog             :a2, after a1, 2d
    Planejamento Sprint 1            :a3, after a2, 1d

    section Sprint 1
    Desenvolvimento - Abertura de Chamados   :b1, after a3, 5d
    Teste Funcional - Chamados               :b2, after b1, 2d

    section Sprint 2
    Planejamento Sprint 2                    :c1, after b2, 1d
    Desenvolvimento - Acompanhamento de Status :c2, after c1, 3d
    Implementação IA (triagem automática)    :c3, after c2, 4d
    Teste Funcional - IA                     :c4, after c3, 2d

    section Sprint 3
    Planejamento Sprint 3                    :d1, after c4, 1d
    Desenvolvimento - Roteamento Automático  :d2, after d1, 4d
    Integração com Histórico                 :d3, after d2, 3d
    Teste Final e Entrega                    :d4, after d3, 4d
