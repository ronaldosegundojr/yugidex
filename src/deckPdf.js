import {
  CARD_MM_W,
  CARD_MM_H,
  A4_MM_W,
  A4_MM_H,
  DECK_COLS,
  DECK_ROWS,
  DECK_PER_PAGE,
} from './cardMakerData'

// Monta um PDF A4 (retrato) com as cartas em matriz 3x3 (9 por folha),
// lado a lado, no tamanho real de impressao (59 x 86 mm), com 2 mm de
// espacamento entre as cartas, centralizadas. 9 cartas por folha A4.
// `images` = lista de data URLs (PNG) das cartas ja renderizadas.
// O jsPDF e carregado sob demanda para nao pesar no bundle inicial.
export async function buildDeckPdf(images, filename = 'deck-yugidex.pdf') {
  if (!images?.length) return { pages: 0, perPage: DECK_PER_PAGE }

  const { jsPDF } = await import('jspdf')

  const GAP = 2 // mm entre as cartas
  const totalW = DECK_COLS * CARD_MM_W + (DECK_COLS - 1) * GAP
  const totalH = DECK_ROWS * CARD_MM_H + (DECK_ROWS - 1) * GAP
  const originX = (A4_MM_W - totalW) / 2
  const originY = (A4_MM_H - totalH) / 2

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  images.forEach((dataUrl, i) => {
    const indexOnPage = i % DECK_PER_PAGE
    if (i > 0 && indexOnPage === 0) doc.addPage()

    const col = indexOnPage % DECK_COLS
    const row = Math.floor(indexOnPage / DECK_COLS)
    const x = originX + col * (CARD_MM_W + GAP)
    const y = originY + row * (CARD_MM_H + GAP)

    doc.addImage(dataUrl, 'PNG', x, y, CARD_MM_W, CARD_MM_H, undefined, 'FAST')
  })

  doc.save(filename)
  return { pages: Math.ceil(images.length / DECK_PER_PAGE), perPage: DECK_PER_PAGE }
}
