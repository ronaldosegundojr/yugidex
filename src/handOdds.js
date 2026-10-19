// Probabilidades exatas da mao inicial de 5 cartas (distribuicao
// hipergeometrica, sem reposicao) e sorteio de mao de exemplo.

export const HAND_SIZE = 5

const comb = (n, k) => {
  if (k < 0 || n < 0 || k > n) return 0
  const kk = Math.min(k, n - k)
  let result = 1
  for (let i = 1; i <= kk; i++) result = (result * (n - kk + i)) / i
  return result
}

// P(de nao vir nenhuma copia nas `hand` cartas iniciais).
export const probNone = (deckSize, copies, hand = HAND_SIZE) => {
  if (copies <= 0) return 1
  if (deckSize <= hand) return copies > 0 ? 0 : 1
  return comb(deckSize - copies, hand) / comb(deckSize, hand)
}

// P(de vir pelo menos 1 copia nas `hand` cartas iniciais).
export const probAtLeastOne = (deckSize, copies, hand = HAND_SIZE) =>
  1 - probNone(deckSize, copies, hand)

// Sorteia uma mao de exemplo (agrupada com quantidade), sem reposicao.
export function drawHand(deckArray, hand = HAND_SIZE) {
  const pool = []
  deckArray.forEach((entry, idx) => {
    for (let i = 0; i < entry.qty; i++) pool.push(idx)
  })
  const size = Math.min(hand, pool.length)
  for (let i = 0; i < size; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i))
    const tmp = pool[i]
    pool[i] = pool[j]
    pool[j] = tmp
  }
  const counts = new Map()
  for (let i = 0; i < size; i++) counts.set(pool[i], (counts.get(pool[i]) || 0) + 1)
  return [...counts.entries()].map(([idx, qty]) => ({ card: deckArray[idx], qty }))
}

export const formatPercent = (value) =>
  `${(value * 100).toFixed(1).replace('.', ',')}%`
