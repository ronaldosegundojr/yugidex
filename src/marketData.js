// Dados de mercado/colecao atualizados sob demanda na API publica do
// YGOPRODeck (CORS liberado). Usa o passcode da carta e guarda o resultado em
// cache no localStorage por alguns dias, para nao bater na API a cada abertura
// do modal.

const CACHE_KEY = 'ygoMarketCache'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php'

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeCache = (cache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // cota cheia: seguir sem cachear
  }
}

// Passcode (id numerico oficial) da carta, se houver.
export const cardPasscode = (card) => {
  const fromArray = Array.isArray(card?.passwords) ? card.passwords.find(Boolean) : null
  return String(fromArray || card?.externalIDs?.ygoprodeck?.id || '') || null
}

const parseCard = (card) => {
  const prices = card?.card_prices?.[0] || {}
  const num = (v) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : null
  }
  return {
    priceTcg: num(prices.tcgplayer_price),
    priceCardmarket: num(prices.cardmarket_price),
    priceCoolstuff: num(prices.coolstuffinc_price),
    tcgDate: card?.misc_info?.[0]?.tcg_date || null,
    fetchedAt: Date.now(),
  }
}

// Busca (ou le do cache) o preco de mercado e a data de lancamento no TCG.
// Rejeita com erro quando a API nao tem a carta ou a rede falha.
export async function fetchMarketInfo(passcode) {
  const cache = readCache()
  const cached = cache[passcode]
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached

  const res = await fetch(`${API_URL}?id=${encodeURIComponent(passcode)}&misc=yes`)
  if (!res.ok) throw new Error(`YGOPRODeck respondeu ${res.status}`)
  const data = await res.json()
  const card = data?.data?.[0]
  if (!card) throw new Error('Carta nao encontrada no YGOPRODeck')

  const info = parseCard(card)
  cache[passcode] = info
  writeCache(cache)
  return info
}

export const formatUsd = (value) =>
  value == null ? null : `US$ ${value.toFixed(2)}`

export const formatEur = (value) =>
  value == null ? null : `€ ${value.toFixed(2)}`
