# Design Critique: Canvas Admin Selo Libertária (auditoria `/login` · `/user` · `/admin`)

## Overall Impressão geral

O canvas já faz o trabalho mais difícil de uma auditoria — ele nomeia certo o problema central ("dois sistemas dentro do painel": Editorial V2 reto/bege/vinho colidindo com um shadcn não estilizado). Isso é uma auditoria de estado atual, não uma proposta de tela nova — e como auditoria ela é honesta. A maior oportunidade não está em achar mais bugs visuais (o documento já pegou os dois grandes: raio e tabela shadcn) — está em quantificar a violação mais grave que passou batido: os números do dashboard (receita, pedidos, ticket médio) estão sem `font-family: DCC Ash`, exatamente o erro que o próprio README chama de "mais fácil de cometer".

## Usability

| Achado | Severidade | Recomendação |
|---|---|---|
| Campo de login com 40px de altura e botão "Entrar" também com 40px | Crítico | Ambos ficam abaixo do alvo mínimo de 44px que o próprio sistema define (`--sl-h-small` / regra "alvo mínimo 44"). Subir campo para 52px (`--sl-h-field`), botão para 48px (`--sl-h-button`). |
| Botão "Continuar com Google" usa `instagram.svg` como ícone | Crítico | Ícone errado engana o usuário sobre qual provedor está autenticando. Sem arquivo real do Google, usar wordmark em caixa reta (mesma regra de `guidelines/brand-payment-icons` para bandeiras sem arquivo). |
| Card "Falhas" (4) no dashboard não linka para os pedidos com falha | Moderado | Tornar o card clicável, filtrando a tabela de pedidos por status "Falhou". |
| Login não mostra estado de erro (senha errada, conta inexistente) | Moderado | Sistema define "erro sem ação é bug"; falta frame de erro com rótulo em vinho + frase de saída. |
| Placeholder-style "Email"/"Senha" sem `<label>` real | Moderado | Implementação precisa de `<label>` associado ao input, não só placeholder. |

## Visual Hierarchy

- **O que puxa o olho primeiro**: cartão bege "Painel / Operação da loja" — correto. Mas o olho pula em seguida para os badges verde/vermelho da tabela (cor mais saturada da tela), competindo com o vinho como "cor que sinaliza importância" (sintoma do problema #20 já anotado no canvas).
- **Fluxo de leitura**: sidebar → hero bege → stat cards → gráfico → tabela — ordem correta, mas o salto de vocabulário visual (reto/bege → cartão branco arredondado cinza) quebra o fluxo na mesma rolagem.
- **Ênfase**: os números do dashboard deveriam ter o maior peso visual da tela, mas por estarem em Fertigo peso 600 (não DCC Ash) perdem a hierarquia que o sistema tipográfico foi desenhado para dar a números.

## Consistency

| Elemento | Inconsistência | Recomendação |
|---|---|---|
| Tipografia dos valores numéricos | Sem `font-family: DCC Ash`; herdam Fertigo do body — viola a regra mais dura do sistema | Aplicar `--sl-font-display` (DCC Ash), escala 30/28 já correta |
| Título "Operação da loja" | 64px desktop / 34px mobile — fora da escala Fertigo (96/76/60/56/44/40/36) | Ajustar para 60px / 36px |
| Badges de status (Pago/Falhou) | Verde e vermelho Tailwind — verde não existe na paleta de 7 cores; vermelho usado é diferente do `--sl-red`/`--sl-wine` oficiais | Pago = vinho sobre bege; Falhou = `--sl-danger` sobre `--sl-danger-wash` (6%), igual ao padrão de erro do sistema |
| Estado "selecionado" da sidebar | Fundo bege suave + texto escuro | Sistema define "bloco sólido (preto ou vermelho), não fundo suave" |
| Raio de borda (já apontado no canvas, #21) | Sidebar `rounded-xl`, tabela `border-radius:12px`, botão de login `border-radius:8px` | Zerar, ou registrar formalmente a exceção da sidebar como decisão de marca |
| Filete da tabela | `#e4e4e7` — cinza de biblioteca, fora da paleta | Trocar por preto em opacidade 14–20% |

## Accessibility

- Contraste: "Email"/"Senha" em `rgba(11,11,11,.4)` — abaixo de 4.5:1 e abaixo da faixa que o sistema reserva para texto (.55–.72).
- Alvo de toque: campo/botão de login em 40px, abaixo do mínimo de 44px do sistema.
- Estados de foco/teclado não representados em nenhum frame — registrar necessidade do halo vinho de foco no handoff.

## What Works Well

- O canvas nomeia com precisão o problema estrutural mais caro do painel (dois sistemas coexistindo).
- Stat cards em formato "Atual" já respeitam raio zero, bege/papel corretos e rótulo em vinho.
- Marcar cada tela como "Atual" (não "Proposto") evita confundir levantamento com solução.

## Priority Recommendations

1. Padronizar tabela, badge e tipografia numérica no vocabulário editorial (maior volume de trabalho e maior quebra de confiança visual).
2. Corrigir login antes de decidir o resto (altura de controle, ícone errado, zero tratamento de erro).
3. Decidir explicitamente o raio da sidebar — de "bug herdado" para decisão registrada.