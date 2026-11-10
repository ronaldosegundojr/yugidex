import {
  CARD_W,
  CARD_H,
  CARD_MM_W,
  CARD_MM_H,
  A4_MM_W,
  A4_MM_H,
  DECK_COLS,
  DECK_ROWS,
  DECK_PER_PAGE,
} from './cardMakerData'

// Verso oficial do TCG (Yu-Gi-Oh! TRADING CARD GAME): redemoinho
// marrom-laranja com oval quase preto no centro, "KONAMI(R)" no canto
// superior esquerdo e o logo "Yu-Gi-Oh! TRADING CARD GAME" no canto
// inferior direito. Scan do wiki oficial em espanhol ("Sin carta").
const CARD_BACK_IMAGE = '/cardmaker/other/card-back.jpg'

// Fallback vetorial simplificado (mesmo estilo do verso oficial), usado
// apenas se o asset em alta resolucao nao carregar.
const CARD_BACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="694" height="1013" viewBox="0 0 694 1013">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4b2c18"/>
      <stop offset="0.5" stop-color="#2a160b"/>
      <stop offset="1" stop-color="#4a2b17"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f1d58a"/>
      <stop offset="0.5" stop-color="#b88539"/>
      <stop offset="1" stop-color="#e7c16a"/>
    </linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.72">
      <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.5"/>
    </radialGradient>
  </defs>
  <rect width="694" height="1013" fill="#090503"/>
  <rect x="5" y="5" width="684" height="1003" rx="30" fill="url(#bg)" stroke="#0a0503" stroke-width="10"/>
  <rect x="19" y="19" width="656" height="975" rx="22" fill="none" stroke="url(#gold)" stroke-width="4"/>
  <rect x="30" y="30" width="634" height="953" rx="17" fill="none" stroke="#8a622f" stroke-width="2" opacity="0.75"/>
  <g fill="none" stroke="#140a05" stroke-width="14" stroke-linecap="round" opacity="0.8">
    <path d="M-40 230 C 130 110 250 350 347 430 C 450 510 570 270 740 170"/>
    <path d="M-40 780 C 130 900 250 665 347 585 C 450 505 570 745 740 850"/>
    <path d="M110 1030 C 55 820 220 725 340 695 C 505 655 650 765 605 1030"/>
    <path d="M100 -20 C 120 180 260 245 365 265 C 515 295 625 170 600 -20"/>
  </g>
  <g fill="none" stroke="#d1a95b" stroke-width="2.5" stroke-linecap="round" opacity="0.35">
    <path d="M-40 244 C 130 124 250 364 347 444 C 450 524 570 284 740 184"/>
    <path d="M-40 794 C 130 914 250 679 347 599 C 450 519 570 759 740 864"/>
    <path d="M124 1030 C 69 820 234 739 354 709 C 519 669 664 779 619 1030"/>
    <path d="M114 -20 C 134 180 274 259 379 279 C 529 309 639 184 614 -20"/>
  </g>
  <ellipse cx="347" cy="506" rx="206" ry="302" fill="#241208" stroke="url(#gold)" stroke-width="6"/>
  <ellipse cx="347" cy="506" rx="184" ry="279" fill="none" stroke="#7c552a" stroke-width="2"/>
  <g fill="none" stroke="#c0944b" stroke-width="3.5" stroke-linecap="round" opacity="0.62">
    <path d="M347 226 C 228 298 216 430 299 502 C 382 574 474 542 493 449 C 512 356 432 296 350 330 C 268 364 258 462 331 512"/>
    <path d="M347 786 C 466 714 478 582 395 510 C 312 438 220 470 201 563 C 182 656 262 716 344 682 C 426 648 436 550 363 500"/>
  </g>
  <circle cx="347" cy="506" r="121" fill="#1b0d06" stroke="#c89b52" stroke-width="4"/>
  <circle cx="347" cy="506" r="107" fill="none" stroke="#6f4a23" stroke-width="2"/>
  <text x="52" y="74" font-family="Georgia, 'Times New Roman', serif" font-size="30" font-weight="bold" fill="#fff">KONAMI&#174;</text>
  <text x="347" y="940" text-anchor="end" font-family="Georgia, 'Times New Roman', serif" font-size="52" font-style="italic" font-weight="bold" fill="#f5d78a">Yu-Gi-Oh!</text>
  <text x="347" y="972" text-anchor="end" font-family="Georgia, 'Times New Roman', serif" font-size="16" font-weight="bold" letter-spacing="3" fill="#f5d78a">TRADING CARD GAME&#8482;</text>
  <rect width="694" height="1013" fill="url(#vignette)" pointer-events="none"/>
</svg>`

let cardBackDataUrl = null

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Falha ao carregar imagem'))
    img.src = src
  })

// Desenha o verso num canvas e codifica em JPEG uma unica vez. O mesmo data
// URL e reaproveitado em todas as paginas de verso (com alias no jsPDF),
// evitando um PDF gigante.
const renderCardBack = (img, w, h) => {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  // Achata os cantos arredondados transparentes do molde sobre o mesmo
  // tom de marrom usado na borda do verso.
  ctx.fillStyle = '#2a160b'
  ctx.fillRect(0, 0, w, h)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.92)
}

async function getCardBackDataUrl() {
  if (cardBackDataUrl) return cardBackDataUrl
  try {
    const img = await loadImage(CARD_BACK_IMAGE)
    // Usa as dimensoes nativas do asset, preservando a proporcao exata
    // do verso oficial.
    const w = img.naturalWidth || CARD_W * 2
    const h = img.naturalHeight || CARD_H * 2
    cardBackDataUrl = renderCardBack(img, w, h)
  } catch {
    // Asset indisponivel ou canvas contaminado (CORS): recorre ao desenho
    // vetorial simplificado, que e mesmo-origem por ser um data URL.
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(CARD_BACK_SVG)}`
    const img = await loadImage(svgUrl)
    cardBackDataUrl = renderCardBack(img, CARD_W * 2, CARD_H * 2)
  }
  return cardBackDataUrl
}

// Monta um PDF A4 (retrato) com as cartas em matriz 3x3 (9 por folha),
// lado a lado, no tamanho real de impressao (59 x 86 mm), com 2 mm de
// espacamento entre as cartas, centralizadas. 9 cartas por folha A4.
// `images` = lista de data URLs (PNG) das cartas ja renderizadas.
// `options.duplex` = true adiciona uma pagina de verso depois de cada folha,
// com as costas alinhadas para impressao frente e verso na borda longa.
// O jsPDF e carregado sob demanda para nao pesar no bundle inicial.
export async function buildDeckPdf(images, filename = 'deck-yugidex.pdf', options = {}) {
  const duplex = options.duplex === true
  if (!images?.length) return { pages: 0, pdfPages: 0, perPage: DECK_PER_PAGE, duplex }

  const { jsPDF } = await import('jspdf')
  const backImage = duplex ? await getCardBackDataUrl() : null

  const GAP = 2 // mm entre as cartas
  const totalW = DECK_COLS * CARD_MM_W + (DECK_COLS - 1) * GAP
  const totalH = DECK_ROWS * CARD_MM_H + (DECK_ROWS - 1) * GAP
  const originX = (A4_MM_W - totalW) / 2
  const originY = (A4_MM_H - totalH) / 2

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  const drawPage = (pageImages, isBack) => {
    pageImages.forEach((dataUrl, indexOnPage) => {
      const col = indexOnPage % DECK_COLS
      // Na borda longa a folha gira na vertical, entao as colunas do verso
      // precisam estar espelhadas para cada carta cair atras da sua frente.
      const pdfCol = isBack ? DECK_COLS - 1 - col : col
      const row = Math.floor(indexOnPage / DECK_COLS)
      const x = originX + pdfCol * (CARD_MM_W + GAP)
      const y = originY + row * (CARD_MM_H + GAP)

      if (isBack) {
        doc.addImage(backImage, 'JPEG', x, y, CARD_MM_W, CARD_MM_H, 'card-back', 'FAST')
      } else {
        doc.addImage(dataUrl, 'PNG', x, y, CARD_MM_W, CARD_MM_H, undefined, 'FAST')
      }
    })
  }

  const frontPages = Math.ceil(images.length / DECK_PER_PAGE)
  for (let page = 0; page < frontPages; page++) {
    if (page > 0) doc.addPage()
    const pageImages = images.slice(page * DECK_PER_PAGE, (page + 1) * DECK_PER_PAGE)
    drawPage(pageImages, false)
    if (duplex) {
      doc.addPage()
      drawPage(pageImages, true)
    }
  }

  doc.save(filename)
  return {
    pages: frontPages,
    pdfPages: duplex ? frontPages * 2 : frontPages,
    perPage: DECK_PER_PAGE,
    duplex,
  }
}
