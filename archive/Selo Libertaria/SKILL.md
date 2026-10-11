---
name: selo-libertaria-design
description: Use this skill to generate well-branded interfaces and assets for Selo Libertária, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
São **dois sistemas**: a loja usa os tokens `--sl-*` (`tokens/colors.css` etc.) e os componentes de
`components/actions|forms|commerce|navigation|payment|sections`; o painel `/admin` usa o **Oficina v2**
(`tokens/admin.css`, `--ad-*`) e os componentes de `components/oficina|editor|blocks`. Nunca misture:
DCC Ash e vermelho de compra não entram no painel; a mesa `#EFEAE2` e o mono não entram na loja.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
