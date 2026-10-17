// Catalogo de impressoes (sets) das cartas do banco.
//
// As impressoes ficam em `public/json/printings.json` (gerado por
// `scripts/build-printings.js`) e sao carregadas sob demanda: o `cards.json` ja
// e grande e nao queremos somar mais ~11 MB ao carregamento inicial.
//
// Estrutura compacta do arquivo (com dicionarios de strings):
//   prints[cardId] = [[code, setNameIdx, rarityIdx, editionIdx, year, langIdx, formatIdx], ...]
//   defaults[cardId] = indice da impressao padrao (a mais antiga em TCG EN)

// Rotulos de regiao/idioma. A chave e o "locale" do YGOJSON; `pt` e o TCG
// brasileiro.
export const REGION_LABELS = {
  en: 'EN',
  na: 'EN (América do Norte)',
  eu: 'EN (Europa)',
  oc: 'EN (Oceania)',
  ae: 'EN (Ásia)',
  jp: 'JP',
  kr: 'KR',
  pt: 'BR',
  sp: 'SP',
  de: 'DE',
  fr: 'FR',
  it: 'IT',
  fc: 'FR (Canadá)',
  sc: 'CN',
  tc: 'TW',
}

export const LANGUAGE_OPTIONS = Object.entries(REGION_LABELS).map(([value, label]) => ({ value, label }))

let cache = null
let loading = null

function buildIndex(data) {
  const setNames = data.setNames || []
  const rarities = data.rarities || []
  const editions = data.editions || []
  const langs = data.langs || []
  const formats = data.formats || []

  const prints = new Map()
  for (const [cardId, list] of Object.entries(data.prints || {})) {
    prints.set(
      cardId,
      list.map((a) => ({
        code: a[0],
        setName: setNames[a[1]] || '',
        rarity: rarities[a[2]] || '',
        edition: editions[a[3]] || '',
        year: a[4] === -1 || a[4] == null ? null : a[4],
        lang: langs[a[5]] || '',
        format: formats[a[6]] || '',
      })),
    )
  }

  return { prints, defaults: data.defaults || {} }
}

// Carrega (uma vez) o catalogo de impressoes. Retorna uma Promise com o indice.
export function loadPrintings() {
  if (cache) return Promise.resolve(cache)
  if (loading) return loading
  loading = fetch('/json/printings.json')
    .then((r) => {
      if (!r.ok) throw new Error(`Falha ao carregar printings.json (${r.status})`)
      return r.json()
    })
    .then((data) => {
      cache = buildIndex(data)
      return cache
    })
    .catch((err) => {
      loading = null
      throw err
    })
  return loading
}

// Sincrono: so retorna algo depois que `loadPrintings()` resolveu.
export function getPrintings() {
  return cache
}

export function printingsForCard(cardId) {
  if (!cache || cardId == null) return []
  return cache.prints.get(String(cardId)) || []
}

// Impressao padrao (a mais antiga em TCG EN; fallback conforme o gerador).
export function defaultPrinting(cardId) {
  if (!cache || cardId == null) return null
  const list = printingsForCard(cardId)
  const di = cache.defaults[String(cardId)]
  if (di == null) return null
  return list[di] || null
}

export function regionLabel(lang) {
  return REGION_LABELS[lang] || (lang ? String(lang).toUpperCase() : '')
}
