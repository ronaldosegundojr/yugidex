/**
 * Campo de duelo: grade de 7 colunas x 5 linhas.
 *
 *   Linha 1 (oponente, tras)  : M/A C2..C6  |  C2 e C6 = Pendulo
 *   Linha 2 (oponente, frente): Monstros C2..C6
 *   Linha 3 (faixa central)   : Campo C1 (oponente) | Extra C3/C5 | Quadrado C4 | Campo C7 (jogador)
 *   Linha 4 (jogador, frente) : Monstros C2..C6
 *   Linha 5 (jogador, tras)   : M/A C2..C6  |  C2 e C6 = Pendulo
 *
 * Cada lado usa exatamente o mesmo DOM. O lado do oponente e rotacionado 180
 * graus via CSS, o que espelha colunas, linhas e as cores dos losangos.
 *
 * Proporcoes (da referencia ~412 x 367 px):
 *   carta  ~43 x 60 px  -> aspect-ratio 0,69
 *   gap h  ~15 px       -> ~35% da largura da carta
 *   gap v  ~7 px        -> ~12% da altura da carta
 *   margem ~9-12 px
 */

export const CARD_ASPECT_RATIO = 0.7

/** Colunas 2..6 da fileira de Magia/Armadilha. */
export const SPELL_TRAP_ZONE_IDS = [
  'spell-trap-1',
  'spell-trap-2',
  'spell-trap-3',
  'spell-trap-4',
  'spell-trap-5',
]

/** Colunas 2..6 da fileira de Monstros. */
export const MONSTER_ZONE_IDS = [
  'monster-1',
  'monster-2',
  'monster-3',
  'monster-4',
  'monster-5',
]

/** As duas Zonas de Monstro Extra ficam na faixa central (colunas 3 e 5). */
export const EXTRA_ZONE_IDS = ['extra-monster-left', 'extra-monster-right']

/** Zona de Campo: carta deitada na faixa central. */
export const FIELD_SPELL_ZONE_ID = 'field-spell'

/** Fileira de Magia/Armadilha do jogador (linha 5). O oponente espelha via rotacao. */
export const BACK_ROW_ZONE_IDS = SPELL_TRAP_ZONE_IDS
/** Fileira da frente do jogador (linha 4). */
export const FRONT_ROW_ZONE_IDS = MONSTER_ZONE_IDS

export const ALL_ZONE_IDS = [
  ...SPELL_TRAP_ZONE_IDS,
  ...MONSTER_ZONE_IDS,
  ...EXTRA_ZONE_IDS,
  FIELD_SPELL_ZONE_ID,
]

/**
 * As zonas de Pendulo sao as Magia/Armadilha das pontas. No lado do jogador o
 * losango esquerdo e azul e o direito e vermelho; a rotacao de 180 graus do
 * oponente inverte as cores, como na referencia.
 */
export const PENDULUM_ZONE_IDS = ['spell-trap-1', 'spell-trap-5']
export const PENDULUM_COLORS = {
  'spell-trap-1': 'blue',
  'spell-trap-5': 'red',
}

export const isPendulumZone = (zoneId) => PENDULUM_ZONE_IDS.includes(zoneId)
export const getPendulumColor = (zoneId) => PENDULUM_COLORS[zoneId] || null

export const ZONE_LABELS = {
  'spell-trap-1': 'Magia/Armadilha 1',
  'spell-trap-2': 'Magia/Armadilha 2',
  'spell-trap-3': 'Magia/Armadilha 3',
  'spell-trap-4': 'Magia/Armadilha 4',
  'spell-trap-5': 'Magia/Armadilha 5',
  'monster-1': 'Monstro 1',
  'monster-2': 'Monstro 2',
  'monster-3': 'Monstro 3',
  'monster-4': 'Monstro 4',
  'monster-5': 'Monstro 5',
  'extra-monster-left': 'Monstro Extra Esquerdo',
  'extra-monster-right': 'Monstro Extra Direito',
  'field-spell': 'Zona de Campo',
}

const ALL_TYPES = ['monster', 'spell', 'trap', 'xyz', 'synchro', 'fusion', 'ritual', 'link']
const MONSTERS = ALL_TYPES

/**
 * Regras de uso sugeridas na referencia:
 * - Magia/Armadilha e Zona de Campo aceitam qualquer carta (sem ATK/DEF/nivel se nao for monstro).
 * - Pendulo tambem aceita monstros pendulo, entao segue a mesma regra ampla.
 * - Zonas de Monstro (incluindo as Extras) aceitam monstros e editam ATK/DEF/nivel.
 */
export const ZONE_ALLOWED_TYPES = {
  'spell-trap-1': ALL_TYPES,
  'spell-trap-2': ALL_TYPES,
  'spell-trap-3': ALL_TYPES,
  'spell-trap-4': ALL_TYPES,
  'spell-trap-5': ALL_TYPES,
  'monster-1': MONSTERS,
  'monster-2': MONSTERS,
  'monster-3': MONSTERS,
  'monster-4': MONSTERS,
  'monster-5': MONSTERS,
  'extra-monster-left': MONSTERS,
  'extra-monster-right': MONSTERS,
  'field-spell': ALL_TYPES,
}

export const getZoneAllowedTypes = (zoneId) => ZONE_ALLOWED_TYPES[zoneId] || ALL_TYPES

/** true quando a zona oferece os controles de atributos. */
export const zoneAllowsStatEditing = (zoneId) =>
  [...MONSTER_ZONE_IDS, ...EXTRA_ZONE_IDS].includes(zoneId)
