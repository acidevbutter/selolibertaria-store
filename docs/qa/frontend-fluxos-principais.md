# Matriz QA — Fluxos principais do frontend

## Objetivo e regras

Checklist de regressão manual do storefront e admin. Executar em `390px`,
`768px`, `1024px` e `1440px`, com usuário anônimo, cliente e administrador.
Registrar para cada falha: ID do cenário, rota, viewport, navegador, horário,
`orderId` quando aplicável e evidência sem dados pessoais, tokens ou Pix.

Pré-requisitos: API saudável, catálogo seedado, admin existente, credenciais de
pagamento e Melhor Envio configuradas para os cenários marcados com `*`.

## Navegação pública e conteúdo

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| PUB-01 | Abrir `/` diretamente | Home renderiza sem erro, em pt-BR e com CTA comercial visível. |
| PUB-02 | Recarregar cada rota pública | Nenhuma rota pública retorna 404/500 indevidamente. |
| PUB-03 | Navegar pelo header desktop | Somente Loja, Projetos, Sarau Safado, Sobre e Contato aparecem. |
| PUB-04 | Navegar pelo menu mobile | Menu abre/fecha, mantém foco e cada link chega à rota correta. |
| PUB-05 | Usar logo, CTA e footer | Links têm destino válido e não levam a páginas de administração. |
| PUB-06 | Abrir `/products` sem itens | Estado vazio é legível, em português e oferece continuidade. |
| PUB-07 | Abrir páginas editorializadas | `/projects`, `/events`, `/sarau-safado`, `/about` e `/contact` usam conteúdo publicado ou fallback seguro. |
| PUB-08 | Conteúdo indisponível/API falha | Interface exibe erro ou fallback compreensível, sem detalhe técnico. |
| PUB-09 | Alterar idioma/cookie do navegador | Superfície pública permanece em pt-BR. |
| PUB-10 | Teclado e leitor de tela | Ordem de tab, foco visível, heading e labels são coerentes. |

## Catálogo, PDP e favoritos

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| CAT-01 | Listar catálogo publicado | Cada card mostra imagem, título, preço em BRL e ação de compra. |
| CAT-02 | Produto sem imagem/preço/estoque | Fallback seguro; não exibir preço enganoso nem botão inválido. |
| CAT-03 | Abrir PDP por slug válido | Capa, título, variante, preço e compra carregam corretamente. |
| CAT-04 | Abrir slug inexistente ou não publicado | Retornar 404 apropriado, sem vazar dados do produto. |
| CAT-05 | Trocar variante | Imagem, preço, disponibilidade e item adicionado correspondem à variante escolhida. |
| CAT-06 | Produto sem estoque | Compra é impedida com mensagem clara. |
| CAT-07 | Adicionar à lista de favoritos anônimo | Solicita login ou aplica o comportamento público definido sem perder contexto. |
| CAT-08 | Favoritar/desfavoritar autenticado | Estado persiste após reload e não duplica itens. |
| CAT-09 | Imagens de produto | Alt, proporção, zoom/galeria e fallback funcionam em todos os viewports. |

## Carrinho, preço e promoção

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| CAR-01 | Adicionar produto pela Home, catálogo e PDP | Mesma variante entra uma única vez com quantidade acumulada. |
| CAR-02 | Alterar quantidade | Total, subtotal, desconto e frete são recalculados; não aceitar zero ou negativo. |
| CAR-03 | Remover último item | Drawer e página de checkout tratam carrinho vazio corretamente. |
| CAR-04 | Recarregar e abrir nova aba | Carrinho persiste conforme a sessão/guest-cart atual. |
| CAR-05 | Entrar após usar carrinho anônimo | Merge não perde itens, não duplica e respeita estoque. |
| CAR-06 | Aplicar cupom válido | Desconto, label e total correspondem à promoção ativa. |
| CAR-07 | Aplicar cupom inválido, expirado ou já esgotado | Exibir erro em pt-BR e não marcar cupom como aplicado. |
| CAR-08 | Remover cupom | Total volta ao valor correto e o código não persiste. |
| CAR-09 | Alterar preço/estoque entre carrinho e checkout | Checkout recalcula e exige confirmação antes do pagamento. |

## Pré-estreia e pré-venda

Os cenários `PRE-05` a `PRE-10` são o comportamento-alvo definido no backlog;
devem falhar até a respectiva implementação estar concluída.

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| PRE-01 | `pageEnabled` desligado | `/pre-venda/little-fish-big-fish` não publica a página. |
| PRE-02 | Janela inválida, futura ou encerrada | Página e modal permanecem indisponíveis. |
| PRE-03 | Janela ativa e produto seedado | Página mostra capa, preço, CTA para PDP/compra real e data de estreia correta. |
| PRE-04 | Modal com `popupEnabled` e `launchAt` válido | Contagem usa a data administrativa, inclusive no fuso configurado. |
| PRE-05 | Primeiro acesso à Home durante pré-estreia | Visitante é encaminhado para a tela de pré-estreia sem loop; catálogo segue acessível diretamente. |
| PRE-06 | Página de pré-estreia aberta | Modal global não é renderizado nessa própria página. |
| PRE-07 | Fechar modal e navegar | Cookie impede nova abertura por 20 minutos; após o prazo pode abrir novamente. |
| PRE-08 | Múltiplas navegações na mesma aba | Modal abre apenas no primeiro acesso daquela aba, não a cada rota. |
| PRE-09 | Nova aba e reload | Validar a regra definida para aba/cookie, sem quebrar o intervalo de 20 minutos. |
| PRE-10 | Compra antes da estreia | Pedido pago recebe flag/data de pré-venda e não segue para expedição antes de `launchAt`. |

## Checkout, frete e pagamento

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| CHK-01 | Abrir checkout com carrinho vazio | Redireciona ou orienta a voltar para a loja. |
| CHK-02 | Cliente anônimo preencher identificação | Valida nome, e-mail, CPF e telefone; erros são locais e em pt-BR. |
| CHK-03 | Cliente autenticado | Dados salvos aparecem sem sobrescrever entrada manual indevidamente. |
| CHK-04 | CEP válido | Preenche endereço quando disponível; usuário pode editar campos. |
| CHK-05 | CEP inválido/serviço indisponível | Mantém preenchimento manual e explica a situação. |
| CHK-06 | Retirar na loja | Frete é R$ 0 e não exige endereço. |
| CHK-07 | Entrega em endereço válido* | Cotação mostra serviço, prazo e valor antes da confirmação. |
| CHK-08 | Frete sem cobertura, erro ou timeout* | Pagamento é bloqueado com ação de recuperação; não usar valor antigo. |
| CHK-09 | Livro impresso elegível ao Envio Módico* | Serviço e valor seguem `Impresso`/`Registro Módico` conforme regra do produto. |
| CHK-10 | Carrinho misto ou item sem metadados* | Não aplicar regra de Envio Módico indevidamente. |
| CHK-11 | Alterar endereço ou entrega depois da cotação | Total é recalculado e requer nova confirmação. |
| CHK-12 | Criar cobrança Asaas* | Uma única cobrança por confirmação; botão não permite duplicidade. |
| CHK-13 | Cancelar, falhar ou expirar pagamento* | Carrinho e pedido ficam em estado recuperável, sem pedido pago falso. |
| CHK-14 | Pagamento confirmado via retorno/webhook* | Tela de processamento conclui, limpa o carrinho uma vez e leva ao pedido. |
| CHK-15 | Reabrir retorno/processamento | Fluxo é idempotente e não cria nova cobrança. |

## Conta e pedidos

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| ACC-01 | Cadastro com dados válidos | Cria conta, informa verificação e não expõe segredo. |
| ACC-02 | E-mail existente, senha fraca e campos inválidos | Mostra erros em pt-BR, sem apagar os demais dados válidos. |
| ACC-03 | Verificação de e-mail e login | Sessão é criada e retorno respeita a rota de origem segura. |
| ACC-04 | Recuperação/criação de senha | Link expirado ou inválido falha com mensagem clara; token não aparece na UI. |
| ACC-05 | Editar perfil e endereço | Persistência após reload; CEP segue os cenários de endereço. |
| ACC-06 | Lista de pedidos | Mostra somente pedidos do cliente correto, com status e valor coerentes. |
| ACC-07 | Abrir pedido e rastreio | Endereço, itens, pagamento e fulfillment não vazam para outro usuário. |
| ACC-08 | Pedido de pré-venda pago | Indica pré-venda/estreia e não apresenta envio antes da liberação. |

## Administração

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| ADM-01 | Acessar `/admin` sem sessão ou sem papel | Redireciona/bloqueia sem renderizar dados administrativos. |
| ADM-02 | Login admin | Dashboard, navegação e logout funcionam. |
| ADM-03 | Criar/editar produto e variante | Catálogo público reflete produto publicado; auditoria não derruba o formulário. |
| ADM-04 | Produto não publicado | Permanece acessível somente na gestão. |
| ADM-05 | Upload/edição de imagens | Preview, salvar/descartar e URL pública funcionam. |
| ADM-06 | Configurar pré-venda | Janela, página, modal e data de estreia persistem e produzem o comportamento público correto. |
| ADM-07 | Gerenciar pedido pago comum | Transições `received → producing → shipped` respeitam ordem e rastreio. |
| ADM-08 | Gerenciar pedido de pré-venda | Expedição bloqueada antes da estreia; liberada a partir dela. |
| ADM-09 | Configurações de frete* | Alteração válida produz cotação; configuração ausente não quebra o admin. |
| ADM-10 | Editorial, promoções, e-mails e webhooks | Salvar, reabrir e verificar reflexo público/operacional conforme cada módulo. |

## Robustez, acessibilidade e regressão

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| REG-01 | Rede lenta/offline durante ação | Loading, retry e erro não duplicam ações ou pedidos. |
| REG-02 | Duplo clique/voltar/avançar no navegador | Carrinho, checkout e pagamento permanecem consistentes. |
| REG-03 | Cookies/localStorage indisponíveis | Site segue navegável; modal e carrinho falham de modo seguro. |
| REG-04 | Erro de API 401/403/404/409/422/500 | Sem stack trace, segredo ou cópia em inglês para usuário final. |
| REG-05 | Contraste, foco, Esc e modal | Modal trava scroll, restaura foco e respeita `prefers-reduced-motion`. |
| REG-06 | Imagem quebrada, texto longo e zoom 200% | Layout não corta ação essencial nem cria rolagem horizontal indevida. |
| REG-07 | Chrome, Safari e Firefox atuais | Fluxos críticos têm o mesmo resultado. |
| REG-08 | Regressão automatizada | Rodar `yarn test`, `yarn lint`, `tsgo` e `yarn build` antes de liberar. |

## Critério de liberação

Liberar somente com todos os cenários críticos `CAT-01`, `CAR-01`, `CAR-07`,
`CHK-01`, `CHK-06`, `CHK-12` a `CHK-15`, `ACC-06`, `ADM-01`, `ADM-03`,
`REG-01`, `REG-02` e os `PRE-*` aplicáveis à campanha atual aprovados. Anotar
cenários bloqueados por credencial/configuração externa como bloqueio de ambiente,
nunca como aprovados.
