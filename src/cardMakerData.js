// Dados e layout do Criador de Cartas (baseado no cardmaker.net/yugioh).
// O canvas lógico tem exatamente 694x1013 (mesmas dimensoes dos moldes/bordas).

export const CARD_W = 694
export const CARD_H = 1013
export const FRAME_BASE = '/cardmaker'

// Monta a URL de um recurso local (moldes, atributos, icones, fontes...).
export const frame = (path) =>
  FRAME_BASE + '/' + path.split('/').map(encodeURIComponent).join('/')

// ---- Tipos de carta (campo "background") ----
export const CARD_TYPES = [
  { value: 'normal', label: 'Monstro Normal' },
  { value: 'effect', label: 'Monstro de Efeito' },
  { value: 'ritual', label: 'Monstro Ritual' },
  { value: 'fusion', label: 'Fusão' },
  { value: 'synchro', label: 'Synchro' },
  { value: 'dark-synchro', label: 'Dark Synchro' },
  { value: 'xyz', label: 'Xyz' },
  { value: 'link', label: 'Link' },
  { value: 'spell', label: 'Magia (Spell)' },
  { value: 'trap', label: 'Armadilha (Trap)' },
  { value: 'token', label: 'Token' },
  { value: 'legendary-dragon', label: 'Legendary Dragon' },
  { value: 'obelisk', label: 'Deus Egípcio - Obelisk' },
  { value: 'ra', label: 'Deus Egípcio - Ra' },
  { value: 'slifer', label: 'Deus Egípcio - Slifer' },
]

// Tipos que usam a linha "[Spell Card]"/"[Trap Card]" e o icone de subtipo.
export const SPELL_TRAP_TYPES = ['spell', 'trap']

// ---- Atributos ----
export const ATTRIBUTES = [
  { value: 'dark', label: 'DARK (Trevas)' },
  { value: 'light', label: 'LIGHT (Luz)' },
  { value: 'fire', label: 'FIRE (Fogo)' },
  { value: 'water', label: 'WATER (Água)' },
  { value: 'earth', label: 'EARTH (Terra)' },
  { value: 'wind', label: 'WIND (Vento)' },
  { value: 'divine', label: 'DIVINE (Divino)' },
  { value: 'laugh', label: 'LAUGH' },
  { value: 'boss-start', label: 'Boss (Start)' },
  { value: 'boss-1', label: 'Boss (1)' },
  { value: 'boss-2', label: 'Boss (2)' },
  { value: 'boss-3', label: 'Boss (3)' },
]

// ---- Subtipos de Magia/Armadilha (icone) ----
export const SPELL_TRAP_ICONS = [
  { value: '', label: 'Normal' },
  { value: 'continuous', label: 'Contínua' },
  { value: 'counter', label: 'Counter' },
  { value: 'equip', label: 'Equipar' },
  { value: 'field', label: 'Campo' },
  { value: 'quick-play', label: 'Rápida (Quick-Play)' },
  { value: 'ritual', label: 'Ritual' },
]

export const RARITIES = [
  { value: 'common', label: 'Comum' },
  { value: 'silver', label: 'Prata (foil)' },
  { value: 'gold', label: 'Ouro (foil)' },
]

export const LEVELS = Array.from({ length: 13 }, (_, i) => i)

// ---- Setas de Link (link-0 .. link-7) ----
// ordem igual ao cardmaker: 0=cima-esq, 1=cima, 2=cima-dir, 3=esq, 4=dir, 5=baixo-esq, 6=baixo, 7=baixo-dir
export const LINK_ARROWS = [
  { id: 0, key: 'upperleft', label: '↖' },
  { id: 1, key: 'top', label: '↑' },
  { id: 2, key: 'upperright', label: '↗' },
  { id: 3, key: 'left', label: '←' },
  { id: 4, key: 'right', label: '→' },
  { id: 5, key: 'lowerleft', label: '↙' },
  { id: 6, key: 'bottom', label: '↓' },
  { id: 7, key: 'lowerright', label: '↘' },
]

export const TIPO_PADRAO = {
  normal: 'Dragon / Normal',
  effect: 'Dragon / Effect',
  ritual: 'Dragon / Ritual',
  fusion: 'Dragon / Fusion',
  synchro: 'Dragon / Synchro',
  'dark-synchro': 'Dragon / Dark Synchro',
  xyz: 'Dragon / Xyz',
  link: 'Dragon / Link',
}

// ---- Layout (mesmas coordenadas do cardmaker.net) ----
// Cada campo devolve { x, y, w, h } em pixels do canvas 694x1013.
export function computeLayout(state) {
  const isTrapSpell = SPELL_TRAP_TYPES.includes(state.type)
  const isXyz = state.type === 'xyz'
  const isLink = state.type === 'link'
  const isDarkSynchro = state.type === 'dark-synchro'
  const isPendulum = state.pendulum && !isTrapSpell && !isLink
  const showLevel = !isTrapSpell && !isLink

  return {
    isTrapSpell,
    isXyz,
    isLink,
    isDarkSynchro,
    isPendulum,
    showLevel,
    background: { x: 23, y: 23, w: CARD_W - 46, h: CARD_H - 46 },
    name: { x: 53, y: 56, w: 518, h: 79 },
    header: { x: 36, y: 38, w: 622, h: 79 },
    attribute: { x: 581, y: 44, w: 66, h: 66 },
    star: { y: 122, w: 44, h: 44 },
    artBox: { x: 59, y: 161, w: 577, h: 577 },
    picture: isPendulum
      ? { x: 45, y: 182, w: 603, h: 596 }
      : { x: 86, y: 186, w: 526, h: 526 },
    loreBorder: { x: 30, y: 743, w: 633, h: 225 },
    loreBackground: { x: 44, y: 754, w: 608, h: 204 },
    type: { x: 51, y: isPendulum ? 789 : 764, w: 586, h: 18 },
    effect: {
      x: 53,
      y: isPendulum ? 816 : isTrapSpell ? 766 : 791,
      w: 585,
      h: isPendulum ? 104 : isTrapSpell ? 180 : 131,
    },
    atkLabel: { x: isLink ? 368 : 380, y: 927, w: 140, h: 34 },
    atk: { x: isLink ? 374 : 386, y: 927, w: 118, h: 34 },
    defLabel: { x: 520, y: 927, w: 125, h: 34 },
    def: { x: 524, y: 927, w: 118, h: 34 },
    footerLine: { x: 52, y: 921, w: 588, h: 2 },
    linkLabel: { x: 515, y: 928, w: 100, h: 20 },
    linkNumber: { x: 515, y: 927, w: 125, h: 20 },
    spellTrapIcon: { x: 570, y: 126, w: 38, h: 38 },
    spellTrapLabel: { x: 354, y: 133, w: 270, h: 30 },
    set: { x: isPendulum ? 54 : isLink ? 420 : 480, y: isPendulum ? 930 : 730, w: 140, h: 16 },
    serial: { x: 32, y: 969, w: 96, h: 16 },
    edition: { x: 132, y: 968, w: 200, h: 16 },
    year: { x: 338, y: 969, w: 290, h: 16 },
    creator: { x: 358, y: 969, w: 300, h: 16 },
    footer: { x: 32, y: 995, w: 624, h: 16 },
    hologram: { x: 637, y: 955, w: 36, h: 36 },
    pendulumTexture: { x: 23, y: 24, w: 648, h: 966 },
    pendulumArtbox: { x: 31, y: 168, w: 631, h: 611 },
    pendulumDesc: { x: 30, y: 622, w: 633, h: 346 },
    scaleBlue: { x: 50, y: 710, w: 40, h: 90 },
    scaleRed: { x: 604, y: 710, w: 40, h: 90 },
    effectPendulum: { x: 109, y: 644, w: 474, h: 126 },
    // posicao de cada estrela (indice 0 = primeira)
    starX: (i) =>
      (isXyz || isDarkSynchro ? 30 : CARD_W - 70) +
      (isXyz || isDarkSynchro ? 1 : -1) * ((i + 1) * 46),
    // posicoes das setas de link (on/off), condicionais p/ pendulo
    linkArrow: (id) => {
      const P = isPendulum
      switch (id) {
        case 0: return { x: P ? 16 : 46, y: 148, w: 82, h: 82 }
        case 1: return { x: 271, y: P ? 138 : 141, w: 152, h: 47 }
        case 2: return { x: P ? 596 : 566, y: 148, w: 82, h: 82 }
        case 3: return { x: P ? -4 : 35, y: P ? 470 : 373, w: 52, h: 152 }
        case 4: return { x: P ? 645 : 607, y: P ? 470 : 373, w: 52, h: 152 }
        case 5: return { x: P ? 16 : 46, y: P ? 902 : 670, w: 82, h: 82 }
        case 6: return { x: 271, y: P ? 951 : 709, w: 152, h: 47 }
        case 7: return { x: P ? 596 : 560, y: P ? 902 : 670, w: 82, h: 82 }
        default: return { x: 0, y: 0, w: 0, h: 0 }
      }
    },
  }
}

// Mapeamento dos campos de seta -> arquivo (on/off)
export const linkArrowFile = (key, on) => `other/link_${key}_${on ? 'on' : 'off'}.png`

// Caminho do fundo (background) do tipo da carta
export const backgroundFile = (type) => `backgrounds/${type}.png`

// Caminho do atributo (para magias/armadilhas usa spell/trap)
export const attributeFile = (state) => {
  const value = SPELL_TRAP_TYPES.includes(state.type) ? state.type : state.attribute
  return `attributes/${value}.png`
}

// Caminho das estrelas de nivel/rank
export const starFile = (state) => {
  if (state.type === 'xyz') return 'other/star_xyz.png'
  if (state.type === 'dark-synchro') return 'other/star_negative.png'
  return 'other/Star.png'
}

// Conta setas de link ativas
export const countLinkArrows = (arrows) =>
  LINK_ARROWS.reduce((sum, a) => sum + (arrows?.[a.id] ? 1 : 0), 0)

// Tipos em que o nome/footer ficam em branco
export const isWhiteName = (state) =>
  state.type === 'xyz' ||
  state.type === 'dark-synchro' ||
  state.type === 'link' ||
  SPELL_TRAP_TYPES.includes(state.type)

export const isWhiteFooter = (state) => state.type === 'xyz' || state.type === 'dark-synchro'

export const isNormalMonster = (state) => state.type === 'normal'

// Estado inicial da criacao
export function defaultCardState() {
  return {
    type: 'effect',
    attribute: 'dark',
    name: '',
    monsterType: TIPO_PADRAO.effect,
    effect: '',
    atk: '',
    def: '',
    level: 4,
    pendulum: false,
    pendulumEffect: '',
    scaleBlue: 1,
    scaleRed: 1,
    linkArrows: {},
    spellTrapIcon: '',
    rarity: 'common',
    set: '',
    serial: '',
    edition: '',
    year: String(new Date().getFullYear()),
    creator: '',
    art: '',
    footer: 'Carta de fã criada no Yugidex',
  }
}
