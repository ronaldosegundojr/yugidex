// Banlist TCG vigente a partir de 19/10/2026 (anunciada no YCS Houston).
// Fonte: https://yugipedia.com/wiki/October_2026_Lists_(TCG) (wikitext da API).
//
// Lista COMPLETA: as 5 partes das revelacoes sairam (a ultima em 18/10/2026),
// somando 34 novas proibidas e 8 novas limitadas em relacao a lista anterior
// (21/09/2026). Nenhuma carta saiu da lista nesta atualizacao.

import { nameKeys } from './cardUtils'

export const BANLIST_EFFECTIVE = '19/10/2026'

export const BANLIST_PREVIOUS_EFFECTIVE = '21/09/2026'

// Máximo de cópias por carta conforme a restrição.
export const BAN_MAX_COPIES = {
  forbidden: 0,
  limited: 1,
  semilimited: 2,
  unlimited: 3
}

export const BAN_LABELS = {
  forbidden: 'Proibida',
  limited: 'Limitada',
  semilimited: 'Semi-limitada',
  unlimited: 'Liberada',
  unreleased: 'Não lançada'
}

// Rotulos curtos para selos em cards pequenos (deck/biblioteca).
export const BAN_SHORT_LABELS = {
  forbidden: 'Proibida',
  limited: 'Limitada',
  semilimited: 'Semi'
}

export const FORBIDDEN = [
  'Abyss Dweller',
  'Aerial Eater',
  'Agido the Ancient Sentinel',
  'Albion the Branded Dragon',
  'Amorphage Goliath',
  'Amorphage Sloth',
  'Ame no Habakiri no Mitsurugi',
  'Apollousa, Bow of the Goddess',
  'Archlord Kristya',
  'Archnemeses Protos',
  'Artifact Mjollnir',
  'Artifact Scythe',
  'Azamina Ilia Silvia',
  'Bahamut Shark',
  'Baronne de Fleur',
  'Barrier Statue of the Drought',
  'Barrier Statue of the Inferno',
  'Barrier Statue of the Stormwinds',
  'Barrier Statue of the Torrent',
  'Beatrice, Lady of the Eternal',
  'Beelze of the Diabolic Dragons',
  'Blackwing - Gofu the Vague Shadow',
  'Block Dragon',
  'Borreload Savage Dragon',
  'Chaos Ruler, the Chaotic Magical Dragon',
  'Charmer Quartet in Bloom',
  'Cross-Sheep',
  'Crystal Wing Synchro Dragon',
  'Crystron Halqifibrax',
  'Cupsy★Yummy Way',
  'Curious, the Lightsworn Dominion',
  'CXyz Gimmick Puppet Fanatix Machinix',
  'Cyber-Stein',
  'Dandylion',
  'D/D/D Wave High King Caesar',
  'Dimension Shifter',
  'Djinn Releaser of Rituals',
  'Eclipse Wyvern',
  'Elfnote Tinia',
  'Evilswarm Ouroboros',
  'F.A. Dawn Dragster',
  'Fiber Jar',
  'Fishborg Blaster',
  'Fossil Dyna Pachycephalo',
  'Gimmick Puppet Nightmare',
  'Grinder Golem',
  'Guardragon Agarpain',
  'Guardragon Elpy',
  'Heavymetalfoes Electrumite',
  'Herald of the Arc Light',
  'Hot Red Dragon Archfiend King Calamity',
  'Isolde, Two Tales of the Noble Knights',
  'Jowgen the Spiritualist',
  'K9-04 Noroi',
  'Kashtira Arise-Heart',
  'Kelbek the Ancient Vanguard',
  'Kewl Tune Rotary',
  'King of the Feral Imps',
  'Knightmare Goblin',
  'Knightmare Gryphon',
  'Knightmare Mermaid',
  'Lavalval Chain',
  'Level Eater',
  'Link Decoder',
  'Linkross',
  'Magical Scientist',
  "Magicians' Souls",
  'Maliss Q White Binder',
  'Maxx "C"',
  'Mecha Phantom Beast Auroradon',
  'Moon of the Closed Heaven',
  'Naturia Beast',
  'Naturia Rosewhip',
  'Number 16: Shock Master',
  'Number 41: Bagooska the Terribly Tired Tapir',
  'Number 42: Galaxy Tomahawk',
  'Number 60: Dugares the Timeless',
  'Number 67: Pair-a-Dice Smasher',
  'Number 86: Heroic Champion - Rhongomyniad',
  'Number 89: Diablosis the Mind Hacker',
  'Number 95: Galaxy-Eyes Dark Matter Dragon',
  'Number S0: Utopic ZEXAL',
  'Outer Entity Azathot',
  'Phantasmal Lord Ultimitl Bishbaalkin',
  'Pharaonic Advent',
  'Phoenixian Cluster Amaryllis',
  'Prank-Kids Meow-Meow-Mu',
  'Predaplant Verte Anaconda',
  'Protectcode Talker',
  'PSY-Framelord Omega',
  'Red-Eyes Dark Dragoon',
  'Reprodocus',
  'Ronintoadin',
  'Saryuja Skull Dread',
  'Simorgh, Bird of Sovereignty',
  'Spell Canceller',
  'Splash Mage',
  'Spright Elf',
  'SPYRAL Master Plan',
  'Superheavy Samurai Scarecrow',
  'Supreme King Dragon Starving Venom',
  'Tearlaments Kitkallos',
  'Tempest Magician',
  'The Tyrant Neptune',
  'Topologic Gumblar Dragon',
  'Trishula, Dragon of the Ice Barrier',
  'True King of All Calamities',
  'Union Carrier',
  'Varudras, the Final Bringer of the End Times',
  'Victory Dragon',
  'Wind-Up Hunter',
  'XX-Saber Gottoms',
  "Zenna's Deceiving Doll Maidens",
  'Zoodiac Broadbull',
  'Butterfly Dagger - Elma',
  'Called by the Grave',
  'Card of Safe Return',
  'Cold Wave',
  'Confiscation',
  'Crossout Designator',
  'Delinquent Duo',
  'Dimension Fusion',
  'Giant Trunade',
  'Graceful Charity',
  'Heavy Storm',
  'Kaiser Colosseum',
  'Last Will',
  'Mass Driver',
  'Mystic Mine',
  'Original Sinful Spoils - Snake-Eye',
  'Painful Choice',
  'Pot of Greed',
  'Secret Village of the Spellcasters',
  'Smoke Grenade of the Thief',
  'Soul Charge',
  'The Forceful Sentry',
  'Triple Tactics Talent',
  'Anti-Spell Fragrance',
  'Appointer of the Red Lotus',
  'Branded Expulsion',
  'Dimensional Barrier',
  'Gozen Match',
  "Harpie's Feather Storm",
  'Imperial Order',
  'Last Turn',
  'Red Reboot',
  'Return from the Different Dimension',
  'Rivalry of Warlords',
  'Royal Oppression',
  'Self-Destruct Button',
  'Sixth Sense',
  'Summon Limit',
  'There Can Be Only One',
  'Trap Dustshoot',
  'Ultimate Offering',
  "Vanity's Emptiness"
]

export const LIMITED = [
  'Astrograph Sorcerer',
  'Bystial Druiswurm',
  'Bystial Magnamhut',
  'Cupsy☆Yummy',
  'Daigusto Emeral',
  'Dracotail Mululu',
  'Droll & Lock Bird',
  'Exodia the Forbidden One',
  'Ext Ryzeal',
  'Fairy Tail - Snow',
  "Fiendsmith's Lacrima",
  'Gem-Knight Master Diamond',
  'Griffoh',
  'K9-66a Jokul',
  'Keldo the Sacred Protector',
  'Left Arm of the Forbidden One',
  'Left Leg of the Forbidden One',
  'Linkuriboh',
  'Maliss P Dormouse',
  'Maliss P White Rabbit',
  'Mathmech Circular',
  'Miscellaneousaurus',
  'Mudora the Sword Oracle',
  'Number 40: Gimmick Puppet of Strings',
  'Number C40: Gimmick Puppet of Dark Strings',
  'Perfectron Hydradrive Dragon',
  'Phantom of Yubel',
  'PSY-Framegear Gamma',
  'Right Arm of the Forbidden One',
  'Right Leg of the Forbidden One',
  'Ryzeal Detonator',
  'Striker Dragon',
  'Substitoad',
  'Summon Sorceress',
  'Sunavalon Dryas',
  'Sunvine Healer',
  'Superdreadnought Rail Cannon Gustav Max',
  'T.G. Hyper Librarian',
  'Tearlaments Havnis',
  'Tearlaments Merrli',
  'Tearlaments Scheiren',
  'Tenpai Dragon Chundra',
  'Toon Bookmark',
  'Toon Table of Contents',
  'Vanquish Soul Hollie Sue',
  'Yummy★Snatchy',
  'Zoodiac Ratpier',
  '"A Case for K9"',
  'Bonfire',
  'Branded Fusion',
  'Branded in High Spirits',
  'Branded Opening',
  'Brilliant Fusion',
  'Card Destruction',
  'Card of Demise',
  'Chain Strike',
  'Chaos Space',
  'Chicken Game',
  'Divine Wind of Mist Valley',
  'Final Countdown',
  'Foolish Burial',
  'Gateway of the Six',
  'Gold Sarcophagus',
  "Harpie's Feather Duster",
  'Infernity Launcher',
  'Instant Fusion',
  'Into the Void',
  'Ketu Dracotail',
  'Magical Mid-Breaker Field',
  'Monster Gate',
  'Monster Reborn',
  'Obedience Schooled',
  'One Day of Peace',
  'One for One',
  'Pot of Prosperity',
  'Prohibited Power Patron Portal - Terminus',
  'Radiant Typhoon Chant',
  'Rahu Dracotail',
  'Reasoning',
  'Reinforcement of the Army',
  'Sangen Kaimen',
  'Sangen Summoning',
  "Sekka's Light",
  'Set Rotation',
  'Sky Striker Mecha - Hornet Drones',
  'Slash Draw',
  'Synchro Overtake',
  'Terraforming',
  'That Grass Looks Greener',
  'Magical Explosion',
  'Naturia Sacred Tree',
  'Skill Drain',
  'Solemn Judgment'
]

export const SEMILIMITED = [
  'Dracotail Arthalion',
  'Dracotail Lukias',
  'Ice Ryzeal',
  'Sword Ryzeal',
  'Maliss in Underground',
  'Purrely Sleepy Memory',
  'Sky Striker Mobilize - Engage!'
]

// Índice nome normalizado -> status (montado uma vez, em ordem de prioridade:
// proibida vence limitada, que vence semi-limitada).
// Mudanças em relacao a lista anterior (BANLIST_PREVIOUS_EFFECTIVE), tiradas
// das anotacoes "prev" do wikitext da fonte. `from` = status anterior.
export const BANLIST_CHANGES = {
  toForbidden: [
    { name: 'Aerial Eater', from: 'unlimited' },
    { name: 'Albion the Branded Dragon', from: 'unlimited' },
    { name: 'Ame no Habakiri no Mitsurugi', from: 'limited' },
    { name: 'Amorphage Goliath', from: 'unlimited' },
    { name: 'Amorphage Sloth', from: 'unlimited' },
    { name: 'Azamina Ilia Silvia', from: 'unlimited' },
    { name: 'Beelze of the Diabolic Dragons', from: 'unlimited' },
    { name: 'Charmer Quartet in Bloom', from: 'unlimited' },
    { name: 'Cross-Sheep', from: 'unlimited' },
    { name: 'Crystal Wing Synchro Dragon', from: 'unlimited' },
    { name: 'Cupsy★Yummy Way', from: 'limited' },
    { name: 'D/D/D Wave High King Caesar', from: 'unlimited' },
    { name: 'Elfnote Tinia', from: 'limited' },
    { name: 'F.A. Dawn Dragster', from: 'unlimited' },
    { name: "Magicians' Souls", from: 'unlimited' },
    { name: 'Naturia Beast', from: 'unlimited' },
    { name: 'Number 41: Bagooska the Terribly Tired Tapir', from: 'unlimited' },
    { name: 'Number 60: Dugares the Timeless', from: 'unlimited' },
    { name: 'Pharaonic Advent', from: 'unlimited' },
    { name: 'Red-Eyes Dark Dragoon', from: 'unlimited' },
    { name: 'Saryuja Skull Dread', from: 'unlimited' },
    { name: 'Spell Canceller', from: 'unlimited' },
    { name: 'Trishula, Dragon of the Ice Barrier', from: 'unlimited' },
    { name: 'Varudras, the Final Bringer of the End Times', from: 'unlimited' },
    { name: 'XX-Saber Gottoms', from: 'unlimited' },
    { name: "Zenna's Deceiving Doll Maidens", from: 'unlimited' },
    { name: 'Called by the Grave', from: 'limited' },
    { name: 'Crossout Designator', from: 'limited' },
    { name: 'Secret Village of the Spellcasters', from: 'unlimited' },
    { name: 'Triple Tactics Talent', from: 'limited' },
    { name: 'Anti-Spell Fragrance', from: 'limited' },
    { name: 'Gozen Match', from: 'limited' },
    { name: 'Rivalry of Warlords', from: 'limited' },
    { name: 'There Can Be Only One', from: 'limited' }
  ],
  toLimited: [
    { name: 'Droll & Lock Bird', from: 'semilimited' },
    { name: 'Griffoh', from: 'unlimited' },
    { name: 'Branded in High Spirits', from: 'semilimited' },
    { name: 'Branded Opening', from: 'unlimited' },
    { name: 'Superdreadnought Rail Cannon Gustav Max', from: 'unlimited' },
    { name: 'Toon Bookmark', from: 'unlimited' },
    { name: 'Toon Table of Contents', from: 'unlimited' },
    { name: 'Perfectron Hydradrive Dragon', from: 'unreleased' }
  ],
  toSemilimited: [
    { name: 'Sky Striker Mobilize - Engage!', from: 'unlimited' }
  ],
  // Cartas que sairam da lista (voltam a 3 copias). Nenhuma nesta atualizacao.
  toUnlimited: []
}

let statusIndex = null

const getStatusIndex = () => {
  if (!statusIndex) {
    statusIndex = new Map()
    const add = (names, status) => {
      for (const name of names) {
        for (const key of nameKeys(name)) {
          if (!statusIndex.has(key)) statusIndex.set(key, status)
        }
      }
    }
    add(FORBIDDEN, 'forbidden')
    add(LIMITED, 'limited')
    add(SEMILIMITED, 'semilimited')
  }
  return statusIndex
}

// Status de um nome de carta ('forbidden' | 'limited' | 'semilimited' |
// 'unlimited'). Aceita nome solto (ja normalizado internamente).
export const banStatusByName = (name) => {
  const idx = getStatusIndex()
  for (const key of nameKeys(name)) {
    const status = idx.get(key)
    if (status) return status
  }
  return 'unlimited'
}

// Status de um card do banco (compara todos os nomes/idiomas do text).
// Resultado memorizado por id para o filtro nao refazer o trabalho.
const cardStatusCache = new Map()

export const banStatusFor = (card) => {
  if (!card) return 'unlimited'
  const id = card.id != null ? String(card.id) : null
  if (id && cardStatusCache.has(id)) return cardStatusCache.get(id)
  const idx = getStatusIndex()
  let status = 'unlimited'
  const texts = card.text && typeof card.text === 'object' ? Object.values(card.text) : []
  outer: for (const t of texts) {
    const nm = t && t.name
    if (!nm) continue
    for (const key of nameKeys(nm)) {
      const s = idx.get(key)
      if (s) {
        status = s
        break outer
      }
    }
  }
  if (id) cardStatusCache.set(id, status)
  return status
}

// Status por nome livre (deck digitado/toasts): tenta direto na banlist e,
// se nao achar, resolve pelo indice de cartas do banco (cardIndex), cobrindo
// variantes de nome como "Maliss White Binder" sem o trecho <Q>. O indice e o
// Map<chave normalizada, carta> montado na pagina do criador.
export const banStatusForName = (name, cardIndex) => {
  const direct = banStatusByName(name)
  if (direct !== 'unlimited') return direct
  if (cardIndex) {
    for (const key of nameKeys(name)) {
      const card = cardIndex.get(key)
      if (card) {
        const status = banStatusFor(card)
        if (status !== 'unlimited') return status
      }
    }
  }
  return 'unlimited'
}

// Total de cartas que mudaram de status nesta atualizacao.
export const BANLIST_CHANGES_TOTAL =
  BANLIST_CHANGES.toForbidden.length +
  BANLIST_CHANGES.toLimited.length +
  BANLIST_CHANGES.toSemilimited.length +
  BANLIST_CHANGES.toUnlimited.length

// Indice nome normalizado -> mudanca ({ name, from, to }).
let changeIndex = null

const getChangeIndex = () => {
  if (!changeIndex) {
    changeIndex = new Map()
    const add = (list, to) => {
      for (const item of list) {
        for (const key of nameKeys(item.name)) {
          if (!changeIndex.has(key)) changeIndex.set(key, { ...item, to })
        }
      }
    }
    add(BANLIST_CHANGES.toForbidden, 'forbidden')
    add(BANLIST_CHANGES.toLimited, 'limited')
    add(BANLIST_CHANGES.toSemilimited, 'semilimited')
    add(BANLIST_CHANGES.toUnlimited, 'unlimited')
  }
  return changeIndex
}

// Mudanca de status nesta atualizacao a partir de um nome livre, ou null.
export const banChangeByName = (name) => {
  const idx = getChangeIndex()
  for (const key of nameKeys(name)) {
    const change = idx.get(key)
    if (change) return change
  }
  return null
}

// Idem para um card do banco (compara todos os nomes/idiomas do text), com
// resultado memorizado por id.
const cardChangeCache = new Map()

export const banChangeFor = (card) => {
  if (!card) return null
  const id = card.id != null ? String(card.id) : null
  if (id && cardChangeCache.has(id)) return cardChangeCache.get(id)
  const idx = getChangeIndex()
  let change = null
  const texts = card.text && typeof card.text === 'object' ? Object.values(card.text) : []
  outer: for (const t of texts) {
    const nm = t && t.name
    if (!nm) continue
    for (const key of nameKeys(nm)) {
      const c = idx.get(key)
      if (c) {
        change = c
        break outer
      }
    }
  }
  if (id) cardChangeCache.set(id, change)
  return change
}
