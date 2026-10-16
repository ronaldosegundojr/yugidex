# Planejamento — Criador de Cartas (baseado no cardmaker.net/yugioh)

Este documento descreve (1) a análise técnica de como o site **https://www.cardmaker.net/yugioh/**
monta cartas de Yu-Gi-Oh e (2) o plano de implementação da mesma funcionalidade dentro do **Yugidex**.

---

## 1. Análise do cardmaker.net/yugioh

### 1.1 Arquitetura da página

O site é uma página de CMS (Invision Community) que carrega uma **Single Page Application em React**
responsável pelo editor de cartas. Os artefatos carregados são:

| Recurso | URL |
| --- | --- |
| Bundle do editor | `.../uploads/page_objects/cardmaker.js.<hash>.js` |
| Scripts de runtime | `.../uploads/javascript_global/*.js`, `.../javascript_cms/front_app.js` |
| CSS do maker | `.../uploads/page_objects/cardmaker.css.<hash>.css` |

O editor renderiza o preview num **`<canvas>` do Konva.js**. O estado completo do editor fica em
`window.makerState` (JSON embutido no HTML), contendo:

```
makerState = {
  size: { width: "694", height: "1013", scale: ".65" },
  fields:     { <id>: { type, pos, size, resourceId, visible, output, fontSize, ... } },
  resources:  { <id>: { id, url, fontFamily } },
  variables:  { <id>: { name, expr } },      // ex: isXyz, isLink, isPendulum, isTrapSpell
  guides, selectedField, activeField, cards, userImages, ...
}
```

### 1.2 Modelo de composição

Cada carta é uma **pilha de "fields"** posicionados em coordenadas absolutas num canvas de
**694 × 1013 px** (proporção real de uma carta de Yu-Gi-Oh, 59 × 86 mm). Cada field tem:

- `type`: `text`, `image` ou `button`
- `pos { x, y }` e `size { width, height }` (podem ser **expressões** que dependem das variáveis)
- `zIndex` (ordem de empilhamento)
- `visible`: expressão booleana (ex: `!variables.isTrapSpell`)
- `output`: expressão do texto final (ex: `"[" + field.userValue + "]"`)
- `resourceId`: recurso/imagem ou fonte usada
- `fontFamily`, `fontSize`, `fillColor`, `align`, `fitFont`, `squeeze`, `emboss`, ...

As **variáveis** são expressões reavaliadas dinamicamente e controlam a exibição:

```
isTrapSpell  = background ∈ ["spell","trap"]
isXyz        = background == "xyz"
isLink       = background == "link"
isPendulum   = !isTrapSpell && fields.pendulum == "true"
isDarkSynchro= background == "dark-synchro"
showLevel    = !(isTrapSpell || isLink)
linkNumber   = soma das setas de link ativas (link-0..link-7)
isWhiteName  = isXyz || isDarkSynchro || isLink || isTrapSpell
isWhiteFooter= (isXyz || isDarkSynchro) && !isPendulum
```

### 1.3 Moldes / recursos de imagem

Base: `https://www.cardmaker.net/uploads/cardmaker_resources/1/`

- **Fundos por tipo** (`backgrounds/`): `normal`, `effect`, `ritual`, `fusion`, `synchro`,
  `dark-synchro`, `xyz`, `link`, `spell`, `trap`, `token`, `legendary-dragon`, `obelisk`, `ra`, `slifer`.
- **Atributos** (`attributes/`): `dark`, `light`, `fire`, `earth`, `water`, `wind`, `divine`,
  `laugh`, `spell`, `trap`, `boss-start`, `boss-1..3`.
- **Ícones de Magia/Armadilha** (`icons/`): `continuous`, `counter`, `equip`, `field`,
  `quick-play`, `ritual`.
- **Overlays** (`other/`): `border-full.png` (borda geral 694×1013, zIndex -1), `Header.png`
  (faixa do nome 622×79), `Art Box.png` (moldura da arte 577×577), `Lore Border.png` +
  `Lore Background.png` (caixa de texto), `Star.png` / `star_xyz.png` / `star_negative.png`
  (estrelas de Nível/Rank/Dark Synchro), `Hologram.png`, `LINK Label.png`, `atk_def line.png`,
  `link_*_on/off.png` (8 setas de Link), `Pendulum Half Texture/Artbox/Description/Overlay.png`.
- **Fontes** (`fonts/`): `mbsc.ttf` (nome), `STOSFSCS.ttf` + `ITCStoneSerifSmallCapsBold.ttf`
  (linha de tipo), `Yu-Gi-OhMatrixBook.ttf` (efeito), `MatrixBoldSmallCaps.ttf` (ATK/DEF),
  `Yu-Gi-OhMatrixRegularSmallCaps.ttf` (escalas), `StoneSerifStd-Medium.ttf` (rodapé),
  `EurostileCandyW01Semibold.ttf` (LINK).

### 1.4 Layout por tipo (coordenadas no canvas 694×1013)

| Elemento | Posição | Observação |
| --- | --- | --- |
| Fundo do tipo | (23,23) 648×967 | imagem `backgrounds/<tipo>.png` |
| Borda geral | (0,0) 694×1013 | `border-full.png`, zIndex -1 |
| Cabeçalho | (36,38) 622×79 | `Header.png` |
| Nome | (53,56) 518×79 | fonte `mbsc` 65px, branco p/ Xyz/Link/DarkSynchro/Spell/Trap |
| Atributo | (581,44) 66×66 | `attributes/<attr>.png` (spell/trap usa o próprio tipo) |
| Estrelas | y=122, 44×44 | Nível: a partir da direita; Xyz/Dark Synchro: da esquerda |
| Caixa de arte | (59,161) 577×577 | `Art Box.png` (pêndulo: `Pendulum Artbox.png`) |
| Arte | (86,186) 526×526 | pêndulo: (45,182) 603×596 |
| Caixa de lore | (30,743)/(44,754) | `Lore Border.png` / `Lore Background.png` |
| Tipo do monstro | (51,764) 586×18 | `"[<raça/type>]"` |
| Efeito | (53,791) 585×131 | magia/armadilha: (53,766) 585×180; pêndulo: (53,816) 585×104 |
| Label Magia/Armadilha | (354,133) 270×30 | `"[ Spell Card ]"` + ícone em (570,126) |
| ATK/DEF | y=927 | labels + valores, ocultos em Spell/Trap/Link |
| LINK | (515,927) | `LINK Label.png` + número (nº de setas) |
| Setas de Link | várias | `link_*_on/off.png`, 8 direções (pêndulo tem offset) |
| Escalas do pêndulo | (50,710)/(604,710) | Azul `#1a3a9c` / Vermelho `#a8231f` |
| Código do set / Serial / Edição / Ano | rodapé (~y=968-995) | fonte Stone Serif |
| Holograma | (637,955) 36×36 | `Hologram.png` |

### 1.5 Funcionalidades da ferramenta

1. **Edição ao vivo** — cada campo do formulário atualiza o canvas instantaneamente.
2. **Mover/redimensionar campos** (Konva Transformer, só para logados) com *snapping* por guias.
3. **Ajuste automático de fonte** (`fitFont`) — reduz o `fontSize` até o texto caber na caixa.
4. **Upload de arte** (arquivo) e geração de arte por IA.
5. **Salvar / buscar "minhas cartas"** (combobox com busca) — persistência no backend.
6. **Baixar** — exporta o canvas do Konva em **PNG** (resolução normal ou 4×).
7. **Link de compartilhamento** — grava a carta e gera uma URL.
8. **Raridade** — `common`, `silver`, `gold` (aplica filtro de emboss/prata/ouro no nome).

### 1.6 Observações técnicas relevantes

- As **imagens de molde não enviam cabeçalho CORS** (`Access-Control-Allow-Origin`), o que
  **impede** exportar o canvas via `html2canvas`/`html-to-image` se elas forem carregadas de
  outro domínio (canvas "tainted"). → Solução no Yugidex: **hospedar os moldes localmente**.
- As **fontes** enviam `Access-Control-Allow-Origin: *`, então poderiam ser usadas por `@font-face`,
  mas também foram baixadas localmente por consistência e uso offline.

---

## 2. Implementação no Yugidex

### 2.1 Abordagem

Reproduzir o editor com **HTML/CSS + React** (sem Konva), usando os **mesmos moldes** baixados para
`public/cardmaker/`. Cada campo é um `<div>`/`<img>` posicionado de forma absoluta dentro de um
container de **694×1013** que é escalado via `transform: scale()` para caber na tela.

### 2.2 Arquivos criados

| Arquivo | Responsabilidade |
| --- | --- |
| `public/cardmaker/**` | 78 moldes/fontes copiados do cardmaker.net (backgrounds, attributes, icons, other, fonts) |
| `src/cardMakerData.js` | Constantes (tipos, atributos, ícones, raridades, níveis, setas) + **`computeLayout(state)`** com todas as coordenadas + estado padrão |
| `src/YugiohCardPreview.jsx` | Renderiza a carta (todas as camadas) a partir do estado; componente `FittedText` replica o *fitFont* |
| `src/YugiohCardPreview.css` | `@font-face` das fontes locais + estilos de cada camada |
| `src/CardMakerPage.jsx` | Página do editor: formulário, preview ao vivo, salvar/buscar, baixar PNG, link de compartilhamento |
| `src/CardMakerPage.css` | Estilos da página (tema do Yugidex) |
| `src/App.jsx` | Importa a página, adiciona rota `/criar-card` e o botão **"Criação de Cards"** no header (desktop e mobile) |

### 2.3 Funcionalidades implementadas

- **Tipos de carta**: Normal, Efeito, Ritual, Fusão, Synchro, Dark Synchro, Xyz, Link, Magia,
  Armadilha, Token, Legendary Dragon e Deuses Egípcios (Obelisk/Ra/Slifer).
- **Atributos** (DARK, LIGHT, FIRE, WATER, EARTH, WIND, DIVINE, LAUGH, Bosses).
- **Estrelas de Nível/Rank/Dark Synchro** (0–12) com o molde correto por tipo.
- **Setas de Link** (8 direções) e contagem automática do LINK rating.
- **Monstro Pêndulo**: efeito pêndulo, escalas azul/vermelha e molduras próprias.
- **Magia/Armadilha**: icone de subtipo (Contínua, Counter, Equipar, Campo, Rápida, Ritual).
- **Raridade** Comum/Prata/Ouro (nome com acabamento metálico via CSS).
- **Arte**: upload de arquivo (data URL) ou URL.
- **Dados de coleção**: código do set, serial, edição, ano, criador e rodapé.
- **Ajuste automático de fonte** (fitFont) no nome e no texto de efeito.
- **Salvar / buscar / excluir** cartas em `localStorage` (`ygoCustomCards`) com combobox de busca.
- **Baixar PNG** em alta resolução (`html-to-image`, 2×) — sem problema de CORS por usar moldes locais.
- **Link de compartilhamento**: estado codificado em base64 no hash da URL (`#c=...`) e restaurado ao abrir.

### 2.4 Decisões de design

- **Moldes locais** (`public/cardmaker/`) em vez de hotlink: evita canvas "tainted" no download,
  funciona offline e não depende de terceiros. Arquivos com espaço são servidos via `encodeURIComponent`.
- **`html-to-image`** para exportar PNG (o elemento exportado recebe `transform:none` para sair em
  resolução total 694×1013 × 2).
- **Sem backend**: persistência em `localStorage`; compartilhamento via URL (sem arte enviada do PC,
  que é grande demais; use URL de arte para compartilhar com imagem).

### 2.5 Limitações / próximos passos

- Mover/redimensionar campos livremente (Transformer do Konva) **não** foi portado — o layout é fixo,
  como no molde original.
- Geração de arte por IA do cardmaker não é reproduzida (o Yugidex não tem backend/API de IA).
- O compartilhamento não inclui artes enviadas do PC (data URL grande); para compartilhar com imagem,
  informe uma URL de arte.
