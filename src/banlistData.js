// Banlist TCG vigente a partir de 19/10/2026 (anunciada no YCS Houston).
// Fonte: https://yugipedia.com/wiki/October_2026_Lists_(TCG) (wikitext da API).
//
// ATENÇÃO: a lista ainda está marcada como {{Incomplete}} na fonte — a parte 5
// das revelações (mais 7 cartas proibidas e 1 limitada, rumo às 34 proibidas e
// 8 limitadas anunciadas pela Konami) ainda não foi divulgada. Quando sair,
// basta acrescentar os nomes novos em FORBIDDEN/LIMITED abaixo.

import { nameKeys } from './cardUtils'

export const BANLIST_EFFECTIVE = '19/10/2026'

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
  unlimited: 'Liberada'
}

export const FORBIDDEN = [
  'Abyss Dweller',
  'Aerial Eater',
  'Agido the Ancient Sentinel',
  'Albion the Branded Dragon',
  'Amorphage Goliath',
  'Amorphage Sloth',
  'Apollousa, Bow of the Goddess',
  'Archlord Kristya',
  'Archnemeses Protos',
  'Artifact Mjollnir',
  'Artifact Scythe',
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
  'Ame no Habakiri no Mitsurugi',
  'Astrograph Sorcerer',
  'Bystial Druiswurm',
  'Bystial Magnamhut',
  'Cupsy☆Yummy',
  'Daigusto Emeral',
  'Dracotail Mululu',
  'Droll & Lock Bird',
  'Elfnote Tinia',
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
  'Branded Opening',
  'Brilliant Fusion',
  'Card Destruction',
  'Card of Demise',
  'Chain Strike',
  'Chaos Space',
  'Chicken Game',
  'Crossout Designator',
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
  'Triple Tactics Talent',
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
  'Branded in High Spirits',
  'Maliss in Underground',
  'Purrely Sleepy Memory'
]

// Índice nome normalizado -> status (montado uma vez, em ordem de prioridade:
// proibida vence limitada, que vence semi-limitada).
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
