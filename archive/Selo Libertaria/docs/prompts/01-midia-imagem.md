# Fatia 01 — Imagem: subir, recortar, reusar

**Canvas:** `Fase 1 - Midia e Imagem.dc.html`. **Depende de:** 00. **Bloqueia:** 02.

## Por quê
Hoje imagem no admin é **URL colada**. Publicar uma capa exige abrir outro serviço, subir, copiar link, voltar, colar. É o gargalo que faz a dona do site depender de você para qualquer foto.

## Backend

1. **Armazenamento** — bucket (S3/R2/Supabase Storage) com upload assinado direto do navegador; o arquivo não passa pelo servidor Next.
   - `POST /api/admin/media/sign` → URL de envio
   - `POST /api/admin/media` → registra o arquivo enviado
2. **`MediaAsset`** (migração): `id`, `storageKey`, `filename`, `mimeType`, `bytes`, `width`, `height`, `alt`, `uploadedById`, `createdAt`. Índice em `createdAt`; busca por `filename` e `alt`.
3. **`MediaCrop`** — recorte **não destrutivo**, salvo como dado: `assetId`, `aspect` ("16:9"|"3:4"|"1:1"|"free"), `x`, `y`, `w`, `h`, `rotate`, `flip`, `grayscale`. O original nunca é alterado. Campos de conteúdo passam a apontar `assetId + cropId`.
4. **Derivadas** — WebP com fallback JPG em 3 larguras (400/900/1600) aplicando o recorte, sob demanda com cache no CDN. Liberar o domínio do bucket em `next.config` (`images.remotePatterns`).
5. **`MediaUsage`** — `assetId`, `entityType`, `entityId`, `field`, escrito junto do salvamento do conteúdo. `DELETE /api/admin/media/[id]` devolve **409 com a lista de usos** em vez de quebrar páginas.
6. **Compatibilidade** — o leitor aceita URL externa e `assetId` durante a transição. Script que baixa as imagens externas já usadas e cria `MediaAsset` para cada uma.

Permissão: reusar `editorial.write` e `catalog.write`. Nenhuma capability nova.

## Front

- **Dropzone** com três estados: vazio ("Arraste a foto aqui" / "escolha do computador" / JPG, PNG ou WebP até 8 MB), arrastando por cima (filete vinho + "Solte para enviar"), enviando (miniatura + barra de progresso + "comprimindo para WebP"). Erro **fica na tela** com botão "Tentar outra" — nunca toast que desaparece. Colar link segue existindo como atalho secundário.
- **Painel de recorte** — proporções nomeadas pelo uso, não por número: "Faixa do hero · 16:9", "Capa · 3:4", "Quadrada · 1:1", "Livre". Ajustes: girar 90°, espelhar, zoom, preto e branco. **Sem** brilho/contraste/saturação/filtro.
- **Descrição obrigatória** — o botão "Usar esta" fica desligado sem ela.
- **Biblioteca** — busca por nome/descrição, filtro "usadas em", ordenação, grade de 5 colunas, "Usada em N lugares" por item, envio múltiplo por arraste. É o **mesmo** seletor em editorial, evento e produto (hoje são dois componentes diferentes).

## Aceite
- Publicar a capa de um evento sem abrir nenhum outro programa.
- A mesma foto em 16:9 no hero e 3:4 no card, subindo **uma vez**.
- Nenhum campo exige URL para uso normal.
- Excluir imagem em uso mostra onde ela está e não deixa quebrar.
- Toda imagem nova tem descrição preenchida.

---

## Sub-prompts

### 01.1 — Bucket e upload assinado
**Objetivo:** o arquivo chegar ao servidor sem passar pelo Next.
**Fazer:** provisionar bucket; `POST /api/admin/media/sign` devolvendo URL de envio; `POST /api/admin/media` registrando o enviado; limite 8 MB; aceitar JPG/PNG/WebP; liberar o domínio em `images.remotePatterns`.
**Aceite:** subir um arquivo de 2 MB pelo terminal/curl usando a URL assinada e vê-lo no bucket. Arquivo de 12 MB é recusado com mensagem legível.

### 01.2 — MediaAsset e biblioteca (leitura)
**Objetivo:** ver o que existe antes de deixar mexer.
**Fazer:** migração `MediaAsset` (§Backend 2) com índice em `createdAt` e busca por `filename`/`alt`; listagem paginada; grade de 5 colunas com busca, filtro "usadas em" e ordenação.
**Aceite:** a biblioteca lista os assets com miniatura, nome e data; busca por descrição encontra; vazio diz "Nenhuma imagem ainda — arraste a primeira."

### 01.3 — Dropzone nos três estados
**Objetivo:** substituir o campo de URL.
**Fazer:** vazio / arrastando por cima / enviando, exatamente como a tela 1.1; erro **fica na tela** com "Tentar outra"; colar link segue como atalho secundário; descrição obrigatória travando o botão de confirmar.
**Aceite:** publicar a capa de um evento sem abrir outro programa. Sem descrição, "Usar esta" fica desligado. Nenhum campo do editorial exige URL para uso normal.

### 01.4 — Recorte não destrutivo
**Objetivo:** a mesma foto servir a usos de proporção diferente.
**Fazer:** migração `MediaCrop`; painel com proporções **nomeadas pelo uso** ("Faixa do hero · 16:9", "Capa · 3:4", "Quadrada · 1:1", "Livre"); girar, espelhar, zoom, preto e branco — e **nada** de brilho/contraste/saturação/filtro; derivadas WebP+JPG em 400/900/1600 sob demanda com cache.
**Aceite:** a mesma imagem aparece 16:9 no hero e 3:4 no card **subindo uma vez**; reabrir o recorte mostra o enquadramento salvo; o original no bucket segue intacto.

### 01.5 — MediaUsage e exclusão segura
**Objetivo:** não quebrar página ao apagar foto.
**Fazer:** tabela de vínculo escrita no salvamento do conteúdo; `DELETE /api/admin/media/[id]` → **409 com a lista de usos**; UI mostrando "Usada em N lugares" e, ao tentar excluir, **onde** ela está.
**Aceite:** apagar imagem em uso é impedido com a lista de páginas na tela. Imagem sem uso é apagada sem atrito.

### 01.6 — Migrar as URLs externas (paralelo a 01.5)
**Fazer:** script que baixa as imagens externas já referenciadas, cria `MediaAsset` para cada e reaponta o conteúdo; o leitor aceita URL e `assetId` durante a transição.
**Aceite:** a biblioteca não nasce vazia e nenhuma página depende mais de link de terceiro.
