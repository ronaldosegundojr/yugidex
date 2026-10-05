import { useEffect, useState } from 'react'

export const REPLACEMENTS = {
  'dragao': 'dragao', 'dragão': 'dragao', 'dragon': 'dragao',
  'branco': 'branco', 'white': 'branco',
  'olhos': 'olhos', 'eyes': 'olhos',
  'azuis': 'azuis', 'blue': 'azuis', 'azul': 'azuis',
  'negro': 'negro', 'black': 'negro',
  'mago': 'mago', 'magician': 'mago', 'wizard': 'mago',
  'fogo': 'fogo', 'fire': 'fogo',
  'agua': 'agua', 'water': 'agua', 'água': 'agua',
  'terra': 'terra', 'earth': 'terra',
  'vento': 'vento', 'wind': 'vento',
  'luz': 'luz', 'light': 'luz',
  'trevas': 'trevas', 'dark': 'trevas', 'darkness': 'trevas',
  'cavaleiro': 'cavaleiro', 'knight': 'cavaleiro',
  'feiticeiro': 'feiticeiro', 'sorcerer': 'feiticeiro',
  'demônio': 'demonio', 'demon': 'demonio', 'fiend': 'demonio',
  'zumbi': 'zumbi', 'zombie': 'zumbi', 'undead': 'zumbi',
  'mec': 'mec', 'machine': 'mec', 'mech': 'mec',
  'dinossauro': 'dinossauro', 'dinosaur': 'dinossauro',
  'peixe': 'peixe', 'fish': 'peixe',
  'fada': 'fada', 'fairy': 'fada', 'faerie': 'fada',
  'reptil': 'reptil', 'reptile': 'reptil',
  'besta': 'besta', 'beast': 'besta',
  'guerreiro': 'guerreiro', 'warrior': 'guerreiro',
  'anao': 'anao', 'dwarf': 'anao',
  'thunder': 'thunder', 'trovão': 'thunder',
  'cripta': 'cripta', 'crypt': 'cripta',
  'morte': 'morte', 'death': 'morte',
  'imperador': 'imperador', 'emperor': 'imperador',
  'rei': 'rei', 'king': 'rei',
  'rainha': 'rainha', 'queen': 'rainha',
  'princesa': 'princesa', 'princess': 'princesa',
  'bebe': 'bebe', 'baby': 'bebe', 'infant': 'bebe',
  'anel': 'anel', 'ring': 'anel',
  'espada': 'espada', 'sword': 'espada',
  'escudo': 'escudo', 'shield': 'escudo',
  'armadilha': 'armadilha', 'trap': 'armadilha',
  'magia': 'magia', 'spell': 'magia',
  'ritual': 'ritual',
  'arma': 'arma', 'weapon': 'arma',
  'elmo': 'elmo', 'helm': 'elmo', 'helmet': 'elmo',
  'dracon': 'dracon', 'draco': 'dracon',
  'serpente': 'serpente', 'snake': 'serpente', 'serpent': 'serpente',
  'cobra': 'cobra', 'asp': 'cobra',
  'lagarto': 'lagarto', 'lizard': 'lagarto',
  'aranha': 'aranha', 'spider': 'aranha', 'arachnid': 'aranha',
  'inseto': 'inseto', 'insect': 'inseto',
  'planta': 'planta', 'plant': 'planta',
  'cogumelo': 'cogumelo', 'mushroom': 'cogumelo',
  'gem': 'gem', 'gema': 'gem', 'jewel': 'gem',
  'anjo': 'anjo', 'angel': 'anjo',
  'arquine': 'arquine', 'archer': 'arquine',
  'morcego': 'morcego', 'bat': 'morcego',
  'vampiro': 'vampiro', 'vampire': 'vampiro',
  'lobisomem': 'lobisomem', 'werewolf': 'lobisomem',
  'fantasma': 'fantasma', 'ghost': 'fantasma', 'specter': 'fantasma',
  'esqueleto': 'esqueleto', 'skeleton': 'esqueleto',
  'gargula': 'gargula', 'gargoyle': 'gargula',
  'golem': 'golem',
  'espírito': 'espirito', 'spirit': 'espirito',
  'duende': 'duende', 'goblin': 'duende', 'elf': 'duende',
  'fênix': 'fenix', 'phoenix': 'fenix',
  'grifo': 'grifo', 'griffin': 'grifo',
  'hidra': 'hidra', 'hydra': 'hidra',
  'quimera': 'quimera', 'chimera': 'quimera',
  'basilisco': 'basilisco', 'basilisk': 'basilisco',
  'sereia': 'sereia', 'mermaid': 'sereia',
  'nikko': 'nikko', 'ninja': 'nikko',
  'samurai': 'samurai',
  'cave': 'cave', 'caverna': 'cave',
  'wing': 'wing', 'asa': 'wing',
  'tail': 'tail', 'cauda': 'tail',
  'claw': 'claw', 'garra': 'claw',
  'horn': 'horn', 'chifre': 'horn',
  'olho': 'olho', 'eye': 'olho',
  'scale': 'scale', 'escama': 'scale',
  'feather': 'feather', 'pena': 'feather',
  'storm': 'storm', 'tempestade': 'storm',
  'ice': 'ice', 'gelo': 'ice', 'gelado': 'ice',
  'flame': 'flame', 'chama': 'flame',
  'cyber': 'cyber', 'ciber': 'cyber',
  'neo': 'neo', 'novo': 'neo', 'new': 'neo',
  'ancient': 'ancient', 'antigo': 'ancient', 'arcaico': 'ancient',
  'ultimate': 'ultimate', 'ultimato': 'ultimate',
  'super': 'super',
  'mega': 'mega',
  'giga': 'giga',
  'impervious': 'impervious', 'imune': 'impervious', 'immune': 'impervious',
  'cherub': 'cherub', 'querubim': 'cherub',
}

export const normalizeText = (text) => {
  if (!text) return ''
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return normalized
    .split(' ')
    .map(word => REPLACEMENTS[word] || word)
    .join(' ')
}

export function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export const LEVEL_MIN = 1
export const LEVEL_MAX = 12

export const parseNumeric = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '' || trimmed === '?' || trimmed === '-') return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const includesType = (card, type) => {
  if (Array.isArray(card?.monsterCardTypes)) {
    return card.monsterCardTypes.some(t => String(t).toLowerCase() === type)
  }
  return false
}

/** The enriched cards carry `_ptName`/`_image`; fall back to the raw shape. */
export const getCardName = (card) =>
  card?._ptName || card?.name || card?.text?.pt?.name || card?.text?.en?.name || 'Sem nome'

export const getCardImage = (card) =>
  card?._image || card?.img || card?.images?.[0]?.card || card?.images?.[0]?.art || ''

/**
 * Describes which battle-field controls a card exposes.
 *
 * Defensive on purpose: this dataset stores "?" and empty strings for unknown
 * stats, has no `rank`/`linkRating` fields, and Extra Deck monsters come with
 * an empty `level`.
 */
export function getStatMeta(card) {
  if (!card) return null

  const rawType = String(card.cardType || '').toLowerCase()
  if (rawType === 'spell' || rawType === 'trap') {
    return { isMonster: false, hasAtk: false, hasDef: false, hasLevel: false }
  }

  const subType = String(card._cardType || '').toLowerCase()
  const isLink = subType === 'link' || includesType(card, 'link')
  const isXyz = subType === 'xyz' || includesType(card, 'xyz')

  const atk = parseNumeric(card.atk)
  const def = parseNumeric(card.def)
  const printedLevel = parseNumeric(card.level)

  let level = printedLevel
  let levelLabel = 'NÍVEL'
  let levelMin = LEVEL_MIN

  if (isLink) {
    level = parseNumeric(card.linkRating) ?? printedLevel
    levelLabel = 'LINK'
    levelMin = 0
  } else if (isXyz || printedLevel === null) {
    // Extra Deck monsters in this database have no level: treat it as Rank.
    level = parseNumeric(card.rank) ?? printedLevel
    levelLabel = 'RANK'
    levelMin = 1
  }

  return {
    isMonster: true,
    isLink,
    isXyz,
    atk,
    def,
    level,
    levelLabel,
    levelMin,
    levelMax: LEVEL_MAX,
    hasAtk: true,
    hasDef: !isLink && def !== null,
    hasLevel: true,
  }
}

export const compareStat = (current, original) => {
  if (current === null || current === undefined) return 'neutral'
  if (original === null || original === undefined) return 'neutral'
  if (current > original) return 'increased'
  if (current < original) return 'decreased'
  return 'neutral'
}

export const STAT_DIRECTION = {
  increased: { arrow: '▲', sign: '+' },
  decreased: { arrow: '▼', sign: '−' },
  neutral: { arrow: '', sign: '' },
}