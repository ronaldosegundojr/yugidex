// Gera `public/json/printings.json` a partir de `sets.json` e `cards.json`.
//
// O banco usa o schema YGOJSON v1. Cada "printing" (impressao) de uma carta vive
// em `sets.json -> contents[].cards[]`, com:
//   - `card`   : id (UUID) da carta em cards.json
//   - `suffix` : numero do codigo dentro do set (ex.: "005")
//   - `rarity` : raridade (ex.: "ultra")
// E o codigo completo do set e montado com o prefixo do set para o idioma:
//   - `set.locales[lang].prefix` (ex.: "LOB-EN") + suffix => "LOB-EN005"
//   - quando o suffix ja vem completo (ex.: "KC01-EN000"), usa-se ele mesmo.
//
// Alem do codigo, extraimos:
//   - `date` (set.locales[lang].date) -> ano
//   - `editions` (content.editions) -> 1st / unlimited / limited
//
// O resultado e um arquivo compacto (dicionarios de strings + arrays curtos),
// com todas as impressoes de cada carta, alem do indice da impressao padrao
// (a mais antiga em TCG ingles; fallback OCG japones).
//
// Uso: node scripts/build-printings.js

import fs from 'fs'

const CARDS_PATH = './public/json/cards.json'
const SETS_PATH = './public/json/sets.json'
const OUT_PATH = './public/json/printings.json'

const loadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''))

const cards = loadJson(CARDS_PATH)
const sets = loadJson(SETS_PATH)
const cardIds = new Set(cards.map((c) => c.id))

// ---- 1) Indexa todas as impressoes por id de carta ----
const byCard = new Map()
let totalPrintings = 0

for (const set of sets) {
  const setNames = set.name || {}
  // A data de lancamento fica no locale; quando o locale escolhido nao tem data
  // (acontece com a regiao EN em alguns sets), usa a data mais antiga do set.
  const localeDates = Object.values(set.locales || {})
    .map((l) => l?.date)
    .filter(Boolean)
    .sort()
  const fallbackDate = localeDates[0] || null

  for (const content of set.contents || []) {
    const lang = (content.locales || [])[0] || 'en'
    const locale = set.locales?.[lang] || {}
    const prefix = locale.prefix ?? null
    const date = locale.date || fallbackDate
    const setName = setNames[lang] || setNames.en || null
    const format = (content.formats || [])[0] || null
    const edition = (content.editions || [])[0] || null

    for (const p of content.cards || []) {
      if (!p.card || !cardIds.has(p.card)) continue
      const suffix = p.suffix || ''
      if (!suffix) continue
      const code = !prefix || suffix.includes('-') ? suffix : prefix + suffix
      if (!code) continue
      totalPrintings++

      let list = byCard.get(p.card)
      if (!list) byCard.set(p.card, (list = []))
      list.push({
        code,
        setName,
        rarity: p.rarity || null,
        edition,
        year: date ? Number(String(date).slice(0, 4)) || null : null,
        lang,
        format,
        date,
      })
    }
  }
}

// ---- 2) Remove duplicatas por carta (mesmo codigo/set/raridade/edicao) ----
//
// O mesmo codigo (ex.: "MRD-EN138") reaparece em sets diferentes (a impressao
// original de 2004 e um relancamento de 2023, por exemplo). Mantemos apenas um
// representante: o que tiver data e, entre esses, o mais antigo.
const compareKeys = (a, b) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return -1
    if (a[i] > b[i]) return 1
  }
  return 0
}

const dedupe = (list) => {
  const best = new Map()
  for (const p of list) {
    const key = `${p.code}|${p.setName}|${p.rarity}|${p.edition}`
    const prev = best.get(key)
    if (!prev || compareKeys(rankKey(p), rankKey(prev)) < 0) best.set(key, p)
  }
  return [...best.values()]
}

// ---- 3) Escolhe a impressao padrao (mais antiga, TCG regiao EN) ----
const formatRank = (p) => (p.format === 'tcg' ? 0 : p.format === 'ocg' ? 1 : 2)
const langRank = (lang) => (lang === 'en' ? 0 : lang === 'na' || lang === 'eu' || lang === 'oc' ? 1 : lang === 'ae' ? 2 : lang === 'jp' ? 3 : 4)
const editionRank = (e) => (e === '1st' ? 0 : e === 'limited' ? 1 : e === 'unlimited' ? 2 : 3)

// Chave de ordenacao: primeiro formato fisico, depois regiao inglesa (EN),
// depois existencia de data, depois a data mais antiga.
const rankKey = (p) => [formatRank(p), langRank(p.lang), p.date ? 0 : 1, p.date || '9999', editionRank(p.edition), p.code]

const pickDefaultIndex = (list) => {
  let best = -1
  let bestKey = null
  list.forEach((p, i) => {
    const key = rankKey(p)
    if (best === -1 || compareKeys(key, bestKey) < 0) {
      best = i
      bestKey = key
    }
  })
  return best
}

// Ordena por data (mais antiga primeiro) para exibir em ordem cronologica.
const sortByDate = (list) =>
  [...list].sort((a, b) => {
    const ad = a.date || '9999'
    const bd = b.date || '9999'
    if (ad !== bd) return String(ad).localeCompare(String(bd))
    if (a.code !== b.code) return String(a.code).localeCompare(String(b.code))
    return String(a.rarity || '').localeCompare(String(b.rarity || ''))
  })

// ---- 4) Monta os dicionarios de strings ----
const dict = (values) => {
  const arr = [...new Set(values)]
  return { arr, index: new Map(arr.map((v, i) => [v, i])) }
}

const all = []
for (const list of byCard.values()) all.push(...list)

const setNamesDict = dict(all.map((p) => p.setName).filter(Boolean))
const raritiesDict = dict(all.map((p) => p.rarity).filter(Boolean))
const editionsDict = dict(all.map((p) => p.edition).filter(Boolean))
const langsDict = dict(all.map((p) => p.lang).filter(Boolean))
const formatsDict = dict(all.map((p) => p.format).filter(Boolean))

const idxOf = (d, v) => (v == null || !d.index.has(v) ? -1 : d.index.get(v))

const prints = {}
const defaults = {}

for (const [cardId, rawList] of byCard) {
  const list = sortByDate(dedupe(rawList))
  if (!list.length) continue
  prints[cardId] = list.map((p) => [
    p.code,
    idxOf(setNamesDict, p.setName),
    idxOf(raritiesDict, p.rarity),
    idxOf(editionsDict, p.edition),
    p.year == null ? -1 : p.year,
    idxOf(langsDict, p.lang),
    idxOf(formatsDict, p.format),
  ])
  const defIdx = pickDefaultIndex(list)
  if (defIdx >= 0) defaults[cardId] = defIdx
}

const payload = {
  v: 1,
  setNames: setNamesDict.arr,
  rarities: raritiesDict.arr,
  editions: editionsDict.arr,
  langs: langsDict.arr,
  formats: formatsDict.arr,
  prints,
  defaults,
}

const json = JSON.stringify(payload)
fs.writeFileSync(OUT_PATH, json)

const mib = (Buffer.byteLength(json) / 1048576).toFixed(2)
console.log(`printings: ${totalPrintings} | cartas: ${Object.keys(prints).length}`)
console.log(`dicionarios -> setNames: ${setNamesDict.arr.length}, rarities: ${raritiesDict.arr.length}, editions: ${editionsDict.arr.length}, langs: ${langsDict.arr.length}, formats: ${formatsDict.arr.length}`)

// Estatisticas dos defaults (regiao/formato e cobertura de ano).
const defStats = {}
let defWithYear = 0
for (const [cardId, di] of Object.entries(defaults)) {
  const a = prints[cardId][di]
  const key = `${formatsDict.arr[a[6]] || '?'}/${langsDict.arr[a[5]] || '?'}`
  defStats[key] = (defStats[key] || 0) + 1
  if (a[4] !== -1) defWithYear++
}
console.log('defaults por formato/regiao:', JSON.stringify(defStats))
console.log(`defaults com ano: ${defWithYear}/${Object.keys(defaults).length}`)
console.log(`escrito ${OUT_PATH} (${mib} MB)`)
