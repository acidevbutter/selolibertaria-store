# Research Plan: Canvas Admin Selo Libertária — validação de decisões em aberto

## Objetivo

Quatro decisões da auditoria do admin não têm resposta certa só no design — dependem de como dois públicos diferentes (equipe interna via `/admin`; clientes finais via `/login`/`/user`) realmente usam o painel. Recomendação geral: priorizar entrevistas qualitativas sobre survey quantitativo, dado o porte pequeno da base de clientes.

## Perguntas de pesquisa

| # | Pergunta | Público | Método | Amostra | Prazo |
|---|---|---|---|---|---|
| 1 | O raio arredondado da sidebar lê como "ferramenta profissional" ou como inconsistência que já causa fricção? | Equipe interna | Entrevista contextual + teste de reação a 2 variantes | 3-5 | 1 semana |
| 2 | Uma tela única "pedidos + favoritos + dados" resolve melhor que `/user`+`/orders` separados? | Clientes que já compraram | Teste de usabilidade (tarefas: achar status de pedido, atualizar endereço) | 5-8 | 1-2 semanas |
| 3 | Clientes usam ou usariam login social, dado o tipo de conteúdo vendido (sensibilidade de privacidade)? | Clientes + leads que abandonaram cadastro | Entrevista curta (pode ser assíncrona) + checagem de analytics existente | 5-8 + dado quantitativo | 1-2 semanas |
| 4 | O atalho "Falhas → pedidos com falha" resolve um job real da operação? | Equipe interna | Entrevista contextual (mesma sessão da #1) | 3-5 | mesma semana |

## Antes de tudo: checar o que já existe

- Analytics do botão "Continuar com Google" pode já responder a pergunta 3 sem entrevista nova.
- Canal atual de resolução de falha de pagamento (pergunta 4) pode ser resolvido em conversa informal antes de roteiro formal.

## Roteiro — Equipe interna (perguntas 1 e 4)

Sessão de 30-40 min, contextual, observando uso real do `/admin`.
1. Aquecimento (5 min) — rotina no painel
2. Contexto (10 min) — observar navegação real; perguntar o que fazem hoje diante de uma falha de pagamento
3. Raio (10 min) — mostrar sidebar atual vs. zero-radius, perguntar qual parece mais "painel de trabalho"
4. Card clicável (10 min) — reagir ao protótipo do atalho de falhas
5. Fechamento (5 min)

## Roteiro — Clientes (perguntas 2 e 3)

Sessão de 20-30 min, remota.
1. Aquecimento (5 min) — enquadrar como experiência de conta, não sobre o produto vendido
2. Contexto (5 min) — como resolveram status/dados da última vez
3. Tarefa de usabilidade (10 min) — fluxo atual vs. consolidado
4. Login social (5 min) — usaria "Entrar com Google"? por quê?
5. Fechamento (5 min) — preferência declarada

## Analysis Framework

- Impact/effort matrix cruzando os 4 achados com o esforço já mapeado no handoff (P0/P1/P2)
- Jobs to be done para o card de falhas (pergunta 4)
- Affinity mapping para as respostas de login social (pergunta 3)

## Deliverables

- Este plano
- Roteiros de entrevista (acima)
- Relatório de síntese com os 4 veredictos — ver `research-synthesis-canvas-admin.md`
- Recomendação final sobre os itens P2 do handoff após a pesquisa rodar