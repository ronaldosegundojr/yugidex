import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, useDraggable, useDroppable } from '@dnd-kit/core'
import { YGOCard, YGOCardMini } from './YGOCard'
import CardScanner from './CardScanner'
import './YGOCard.css'

const ITEMS_PER_PAGE = 60

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

const REPLACEMENTS = {
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

const normalizeText = (text) => {
  if (!text) return ''
  let normalized = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  const words = normalized.split(' ')
  const mapped = words.map(word => REPLACEMENTS[word] || word)
  
  return mapped.join(' ')
}

const getCardType = (card) => {
  const cached = card._cardType
  if (cached) return cached
  if (card.cardType === 'spell') return 'spell'
  if (card.cardType === 'trap') return 'trap'
  if (card.cardType === 'monster') {
    const name = card._enNameLower || ''
    if (name.includes('xyz') || name.includes('-xyz')) return 'xyz'
    if (name.includes('synchro')) return 'synchro'
    if (name.includes('fusion') || name.includes('fusdragon')) return 'fusion'
    if (name.includes('ritual')) return 'ritual'
    if (name.includes(' link') || name.includes('-link') || name.endsWith('link')) return 'link'
    return 'monster'
  }
  return card.cardType
}

const SimpleCard = ({ card, onClick }) => (
  <div className="simple-card" onClick={() => onClick(card)}>
    <img src={card._image} alt={card._ptName} loading="lazy" />
  </div>
)

const MemoSimpleCard = SimpleCard

function CardsView({ cards, filteredCards, filteredByType, currentPage, setCurrentPage, deck, setModalCard, searchTerm, setSearchTerm, typeFilter, setTypeFilter, raceFilter, setRaceFilter, attrFilter, setAttrFilter, races, lang, setLang, onOpenScanner }) {
  const [expandedTypes, setExpandedTypes] = useState({})

  const totalPages = Math.ceil(filteredCards.length / ITEMS_PER_PAGE)
  const paginatedCards = filteredCards.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const allCardTypes = [
    { key: 'monster', label: 'Monstros', type: 'monster' },
    { key: 'spell', label: 'Magias', type: 'spell' },
    { key: 'trap', label: 'Armadilhas', type: 'trap' },
    { key: 'xyz', label: 'XYZ', type: 'xyz' },
    { key: 'synchro', label: 'Synchro', type: 'synchro' },
    { key: 'fusion', label: 'Fusion', type: 'fusion' },
    { key: 'ritual', label: 'Ritual', type: 'ritual' },
    { key: 'link', label: 'Link', type: 'link' }
  ]

  const toggleType = (type) => {
    setExpandedTypes(prev => ({ ...prev, [type]: !prev[type] }))
  }

  const hasFilter = searchTerm || typeFilter || raceFilter || attrFilter

  return (
    <section className="view active">
      <div className="search-container">
        <div className="search-box">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar cartas (ex: dragao, blue eyes, dragão)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="scanner-btn-icon" onClick={onOpenScanner} title="Escanear carta">
            📷
          </button>
          <div className="lang-toggle">
            <button className={lang === 'pt' ? 'active' : ''} onClick={() => setLang('pt')}>PT</button>
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
            <button className={lang === 'ja' ? 'active' : ''} onClick={() => setLang('ja')}>JP</button>
          </div>
        </div>
        <div className="filter-group">
          <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Todos os Tipos</option>
            <option value="monster">Monstro</option>
            <option value="spell">Magia</option>
            <option value="trap">Armadilha</option>
            <option value="xyz">XYZ</option>
            <option value="synchro">Synchro</option>
            <option value="fusion">Fusion</option>
            <option value="ritual">Ritual</option>
            <option value="link">Link</option>
          </select>
          <select className="filter-select" value={raceFilter} onChange={(e) => setRaceFilter(e.target.value)}>
            <option value="">Todas as Raças</option>
            {Array.from(races).sort().map(race => (
              <option key={race} value={race}>{race}</option>
            ))}
          </select>
          <select className="filter-select" value={attrFilter} onChange={(e) => setAttrFilter(e.target.value)}>
            <option value="">Todos os Atributos</option>
            <option value="LIGHT">Luz</option>
            <option value="DARK">Trevas</option>
            <option value="WATER">Água</option>
            <option value="FIRE">Fogo</option>
            <option value="EARTH">Terra</option>
            <option value="WIND">Vento</option>
            <option value="DIVINE">Divino</option>
          </select>
        </div>
      </div>

      {hasFilter ? (
        filteredCards.length === 0 ? (
          <div className="no-cards"><h3>Nenhuma carta encontrada</h3><p>Tente ajustar seus filtros de busca</p></div>
        ) : (
          <>
            <div className="cards-section">
              {allCardTypes.map(({ key, label, type }) => {
                const group = filteredByType[type]
                if (!group || group.length === 0) return null
                const paginated = paginatedCards.filter(c => c._cardType === type)
                if (paginated.length === 0 && group.length > 0 && currentPage !== 1) return null
                return (
                  <div key={key} className="cards-group">
                    <h3 className="group-title">{label} ({group.length})</h3>
                    <div className="simple-card-grid">
                      {paginated.map(card => (
                        <MemoSimpleCard key={card.id} card={card} onClick={setModalCard} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>&laquo;</button>
                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                  const page = i + 1
                  return (
                    <button key={page} className={`page-btn ${currentPage === page ? 'active' : ''}`} onClick={() => setCurrentPage(page)}>{page}</button>
                  )
                })}
                <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>&raquo;</button>
              </div>
            )}
          </>
        )
      ) : (
        <div className="cards-section">
          {allCardTypes.map(({ key, label, type }) => {
            const typeCards = cards._byType?.[type] || []
            const isExpanded = expandedTypes[key]
            const displayCards = isExpanded ? typeCards : typeCards.slice(0, 20)
            if (typeCards.length === 0) return null
            
            return (
              <div key={key} className="cards-group">
                <div className="group-header">
                  <h3 className="group-title">{label} ({typeCards.length})</h3>
                  {typeCards.length > 20 && (
                    <button className="view-all-btn" onClick={() => toggleType(key)}>
                      {isExpanded ? 'Ver menos' : 'Ver todas as cartas'}
                    </button>
                  )}
                </div>
                <div className="simple-card-grid">
                  {displayCards.map(card => (
                    <MemoSimpleCard key={card.id} card={card} onClick={setModalCard} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function DeckPage({ cards, deck, setDeck, deckSearchTerm, setDeckSearchTerm, deckTypeFilter, setDeckTypeFilter, deckLevelFilter, setDeckLevelFilter, setModalCard, savedDecks, setSavedDecks, lang, setLang, isMobile, setMobileDeckModal, deck: deckContext, setDeck: setDeckContext, deckIdSet, onOpenScanner }) {
  const [activeId, setActiveId] = useState(null)
  const [deckName, setDeckName] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const fileInputRef = useRef(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const mainDeck = deck.filter(c => c.deckType === 'main' || !c.deckType)
  const extraDeck = deck.filter(c => c.deckType === 'extra')
  const sideDeck = deck.filter(c => c.deckType === 'side')

  const DeckLibraryCard = ({ card, onAdd, onRemove, isInDeck, deckType, onClick }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: card.id })
    
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
    
    return (
      <div 
        ref={setNodeRef} 
        className="deck-library-card"
        style={style}
        {...listeners}
        {...attributes}
        onClick={() => onClick(card)}
      >
        <img src={card._image} alt={card._ptName} loading="lazy" />
        <div className="deck-library-card-name">{card._ptName}</div>
        {isInDeck ? (
          <button className="deck-library-btn remove" onClick={(e) => { e.stopPropagation(); onRemove(card.id) }}>
            ✕ Remover ({deckType})
          </button>
        ) : (
          <button className="deck-library-btn add" onClick={(e) => { e.stopPropagation(); onAdd(card) }}>
            + Adicionar
          </button>
        )}
      </div>
    )
  }

  const filteredCards = useMemo(() => {
    if (!cards.length) return []
    const normalizedSearch = normalizeText(deckSearchTerm)
    const hasSearch = !!deckSearchTerm
    const hasType = !!deckTypeFilter
    const hasLevel = !!deckLevelFilter
    
    return cards.filter(card => {
      if (hasSearch && !card._normalizedNames.includes(normalizedSearch)) return false
      if (hasType) {
        const type = card._cardType
        if (deckTypeFilter !== type) return false
      }
      if (hasLevel) {
        const level = card.level || 0
        const type = card._cardType
        if (deckLevelFilter === '1-3' && (level < 1 || level > 3)) return false
        if (deckLevelFilter === '4-6' && (level < 4 || level > 6)) return false
        if (deckLevelFilter === '7+' && level < 7) return false
        if (deckLevelFilter === 'spell' && type !== 'spell') return false
        if (deckLevelFilter === 'trap' && type !== 'trap') return false
      }
      return true
    })
  }, [cards, deckSearchTerm, deckTypeFilter, deckLevelFilter])

  const totalPages = Math.ceil(filteredCards.length / ITEMS_PER_PAGE)
  const paginatedCards = filteredCards.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleDragStart = (event) => setActiveId(event.active.id)
  
  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    
    const card = cards.find(c => c.id === active.id)
    if (!card) return

    if (over.id === 'main-deck-zone') addToDeck(card, 'main')
    else if (over.id === 'extra-deck-zone') addToDeck(card, 'extra')
    else if (over.id === 'side-deck-zone') addToDeck(card, 'side')
  }

  const addToDeck = (card, deckTypeOverride) => {
    setDeck(prev => {
      let deckType = deckTypeOverride
      if (!deckType) {
        if (['fusion', 'synchro', 'xyz', 'link', 'ritual'].includes(card.cardType)) {
          deckType = 'extra'
        } else {
          deckType = 'main'
        }
      }
      const existing = prev.find(c => c.id === card.id)
      if (existing) {
        if (existing.qty < 3) return prev.map(c => c.id === card.id ? { ...c, qty: c.qty + 1 } : c)
        return prev
      }
      const totalCards = prev.reduce((sum, c) => sum + c.qty, 0)
      if (totalCards >= 60) { alert('Deck cheio! (máx 60)'); return prev }
      return [...prev, { ...card, qty: 1, deckType }]
    })
  }

  const removeFromDeck = (cardId) => setDeck(prev => prev.filter(c => c.id !== cardId))

  const getDeckStats = (deckArray) => {
    let monsters = 0, spells = 0, traps = 0
    for (const c of deckArray) {
      const t = c._cardType
      if (t === 'monster') monsters += c.qty
      else if (t === 'spell') spells += c.qty
      else if (t === 'trap') traps += c.qty
    }
    return { monsters, spells, traps, total: monsters + spells + traps }
  }

  const saveDeck = () => {
    const name = deckName.trim() || `Deck ${savedDecks.length + 1}`
    if (mainDeck.length === 0) { alert('Adicione cartas ao deck principal!'); return }
    const deckData = {
      id: Date.now(), name,
      main: mainDeck.map(c => ({ id: c.id, qty: c.qty })),
      extra: extraDeck.map(c => ({ id: c.id, qty: c.qty })),
      side: sideDeck.map(c => ({ id: c.id, qty: c.qty })),
      date: new Date().toISOString()
    }
    const newSavedDecks = [...savedDecks, deckData]
    setSavedDecks(newSavedDecks)
    localStorage.setItem('ygoSavedDecks', JSON.stringify(newSavedDecks))
    alert('Deck salvo com sucesso!')
  }

  const loadDeck = (deckId) => {
    const deckData = savedDecks.find(d => d.id === deckId)
    if (!deckData) return
    const buildDeckArray = (arr) => arr.map(c => {
      const card = cards.find(card => card.id === c.id)
      return card ? { ...card, qty: c.qty } : null
    }).filter(Boolean)
    const newDeck = [
      ...buildDeckArray(deckData.main).map(c => ({ ...c, deckType: 'main' })),
      ...buildDeckArray(deckData.extra).map(c => ({ ...c, deckType: 'extra' })),
      ...buildDeckArray(deckData.side).map(c => ({ ...c, deckType: 'side' }))
    ]
    setDeck(newDeck)
    setDeckName(deckData.name)
  }

  const deleteDeck = (deckId) => {
    const newSavedDecks = savedDecks.filter(d => d.id !== deckId)
    setSavedDecks(newSavedDecks)
    localStorage.setItem('ygoSavedDecks', JSON.stringify(newSavedDecks))
  }

  const clearDeck = () => { if (confirm('Limpar deck?')) { setDeck([]); setDeckName('') } }

  const exportDeck = () => {
    if (mainDeck.length === 0) { alert('Adicione cartas ao deck!'); return }
    const name = deckName.trim() || 'ygo-deck'
    const blob = new Blob([JSON.stringify({ name, main: mainDeck.map(c => ({ id: c.id, qty: c.qty })), extra: extraDeck.map(c => ({ id: c.id, qty: c.qty })), side: sideDeck.map(c => ({ id: c.id, qty: c.qty })) }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importDeck = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        const buildDeckArray = (arr) => arr.map(c => {
          const card = cards.find(card => card.id === c.id)
          return card ? { ...card, qty: c.qty } : null
        }).filter(Boolean)
        const newDeck = [
          ...buildDeckArray(data.main || []).map(c => ({ ...c, deckType: 'main' })),
          ...buildDeckArray(data.extra || []).map(c => ({ ...c, deckType: 'extra' })),
          ...buildDeckArray(data.side || []).map(c => ({ ...c, deckType: 'side' }))
        ]
        setDeck(newDeck)
        setDeckName(data.name || 'Deck Importado')
        alert('Deck importado com sucesso!')
      } catch (err) { alert('Erro ao importar deck!'); }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const getCardDeckType = (cardId) => {
    const card = deck.find(c => c.id === cardId)
    return card?.deckType || null
  }

  const stats = getDeckStats(mainDeck)
  const activeCard = activeId ? cards.find(c => c.id === activeId) : null

  const DeckCard = ({ card, qty, onClick, onRemove }) => (
    <div className="deck-card-item">
      <div className="deck-card-image-wrapper" onClick={() => onClick(card)}>
        <img src={card._image} alt={card._ptName} loading="lazy" />
        {qty > 1 && <span className="deck-card-qty">{qty}</span>}
        <div className="deck-card-tooltip">
          <div className="tooltip-name">{card._ptName}</div>
          <div className="tooltip-type">{card.cardType}</div>
          {card.atk !== undefined && <div className="tooltip-stat">ATK: {card.atk}</div>}
          {card.def !== undefined && <div className="tooltip-stat">DEF: {card.def}</div>}
        </div>
      </div>
      <button className="deck-card-remove" onClick={() => onRemove(card.id)}>×</button>
    </div>
  )

  const DeckZone = ({ title, deckArray, zoneId, stats, onEmptyClick, isMobile }) => {
    const { setNodeRef, isOver } = useDroppable({ id: zoneId })
    
    return (
      <div 
        className={`deck-zone ${isOver ? 'drag-over' : ''} ${deckArray.length === 0 ? 'empty' : ''}`}
        ref={setNodeRef}
      >
        <div className="deck-zone-header">
          <h4>{title}</h4>
          <span className={`deck-count ${stats.total > 60 ? 'error' : stats.total >= 40 ? 'warning' : 'ok'}`}>
            {stats.total}/60
          </span>
        </div>
        <div className="deck-cards-container">
          {deckArray.length === 0 ? (
            <p 
              className="empty-msg" 
              onClick={isMobile ? onEmptyClick : undefined}
              style={isMobile ? { cursor: 'pointer', color: 'var(--gold)' } : undefined}
            >
              {isMobile ? 'Arraste cartas aqui ou clique aqui' : 'Arraste cartas aqui'}
            </p>
          ) : (
            deckArray.map(card => (
              <DeckCard key={card.id} card={card} qty={card.qty} onClick={setModalCard} onRemove={removeFromDeck} />
            ))
          )}
        </div>
        {deckArray.length > 0 && (
          <div className="deck-zone-stats">
            <span>M: {stats.monsters}</span>
            <span>S: {stats.spells}</span>
            <span>T: {stats.traps}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="deck-page">
        <div className="deck-builder-layout">
          <div className="deck-zones">
            <div className="deck-name-section">
              <input type="text" className="deck-name-input" placeholder="Nome do Deck" value={deckName} onChange={(e) => setDeckName(e.target.value)} />
            </div>
            
            <DeckZone title="Main Deck (40-60)" deckArray={mainDeck} zoneId="main-deck-zone" stats={stats} onEmptyClick={() => setMobileDeckModal(true)} isMobile={isMobile} />
            <DeckZone title="Extra Deck (0-15)" deckArray={extraDeck} zoneId="extra-deck-zone" stats={getDeckStats(extraDeck)} onEmptyClick={() => setMobileDeckModal(true)} isMobile={isMobile} />
            <DeckZone title="Side Deck (0-15)" deckArray={sideDeck} zoneId="side-deck-zone" stats={getDeckStats(sideDeck)} onEmptyClick={() => setMobileDeckModal(true)} isMobile={isMobile} />

            <div className="deck-rules-info">
              <h4>Regras do Deck</h4>
              <ul>
                <li className={stats.total < 40 ? 'rule-error' : stats.total <= 60 ? 'rule-ok' : 'rule-error'}>
                  Main Deck: {stats.total}/60 {stats.total < 40 ? '(Mínimo 40!)' : stats.total > 60 ? '(Máximo 60!)' : '✓'}
                </li>
                <li className={extraDeck.length <= 15 ? 'rule-ok' : 'rule-error'}>Extra Deck: {extraDeck.length}/15</li>
                <li className={sideDeck.length <= 15 ? 'rule-ok' : 'rule-error'}>Side Deck: {sideDeck.length}/15</li>
                <li>Cópias por carta: máx 3</li>
              </ul>
            </div>

            <div className="deck-actions">
              <button className="btn btn-primary" onClick={saveDeck}>Salvar Deck</button>
              <button className="btn" onClick={exportDeck}>Exportar</button>
              <button className="btn" onClick={() => fileInputRef.current?.click()}>Importar</button>
              <input type="file" ref={fileInputRef} onChange={importDeck} accept=".json" style={{ display: 'none' }} />
              <button className="btn btn-danger" onClick={clearDeck}>Limpar</button>
            </div>

            <div className="saved-decks-section">
              <h4>Decks Salvos</h4>
              {savedDecks.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nenhum deck salvo</p> : 
                savedDecks.map(d => (
                  <div key={d.id} className="saved-deck-item">
                    <span onClick={() => loadDeck(d.id)}>{d.name}</span>
                    <div className="saved-deck-actions">
                      <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={() => loadDeck(d.id)}>Load</button>
                      <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={() => deleteDeck(d.id)}>&times;</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="card-search-panel">
            <div className="search-panel-header">
              <h3>Biblioteca de Cartas</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="scanner-btn-icon" onClick={onOpenScanner} title="Escanear carta">
                  📷
                </button>
                <div className="lang-toggle">
                <button className={lang === 'pt' ? 'active' : ''} onClick={() => setLang('pt')}>PT</button>
                <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
                <button className={lang === 'ja' ? 'active' : ''} onClick={() => setLang('ja')}>JP</button>
              </div>
              </div>
            </div>
            <div className="search-panel-filters">
              <input type="text" className="search-input" placeholder="Buscar (ex: dragao, blue eyes)..." value={deckSearchTerm} onChange={(e) => { setDeckSearchTerm(e.target.value); setCurrentPage(1) }} />
              <select className="filter-select" value={deckTypeFilter} onChange={(e) => { setDeckTypeFilter(e.target.value); setCurrentPage(1) }}>
                <option value="">Todos os Tipos</option>
                <option value="monster">Monstro</option>
                <option value="spell">Magia</option>
                <option value="trap">Armadilha</option>
              </select>
              <select className="filter-select" value={deckLevelFilter} onChange={(e) => { setDeckLevelFilter(e.target.value); setCurrentPage(1) }}>
                <option value="">Todos os Níveis</option>
                <option value="1-3">Nível 1-3</option>
                <option value="4-6">Nível 4-6</option>
                <option value="7+">Nível 7+</option>
                <option value="spell">Magias</option>
                <option value="trap">Armadilhas</option>
              </select>
            </div>
            <div className="search-results-count">{filteredCards.length} cartas encontradas</div>
            <div className="library-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {paginatedCards.map(card => (
                <DeckLibraryCard 
                  key={card.id} 
                  card={card} 
                  onAdd={(c) => addToDeck(c)}
                  onRemove={removeFromDeck}
                  isInDeck={deckIdSet.has(card.id)}
                  deckType={getCardDeckType(card.id)}
                  onClick={setModalCard}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>&laquo;</button>
                <span className="page-info">{currentPage}/{totalPages}</span>
                <button className="page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>&raquo;</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeCard && (
          <div style={{ width: 120, borderRadius: 8, overflow: 'hidden', border: '2px solid var(--gold)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <img src={activeCard._image} alt="" style={{ width: '100%', display: 'block' }} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

function App() {
  const [cards, setCards] = useState([])
  const [filteredCards, setFilteredCards] = useState([])
  const [filteredByType, setFilteredByType] = useState({})
  const [races, setRaces] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [deck, setDeck] = useState([])
  const [savedDecks, setSavedDecks] = useState([])
  const [modalCard, setModalCard] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deckSearchTerm, setDeckSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [raceFilter, setRaceFilter] = useState('')
  const [attrFilter, setAttrFilter] = useState('')
  const [deckTypeFilter, setDeckTypeFilter] = useState('')
  const [deckLevelFilter, setDeckLevelFilter] = useState('')
  const [lang, setLang] = useState('pt')
  const [mobileDeckModal, setMobileDeckModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => { loadCards(); loadSavedDecks() }, [])

  const enrichCard = (card) => {
    const ptName = card.text?.pt?.name || card.text?.en?.name || Object.values(card.text || {})[0]?.name || 'Unknown'
    const enName = card.text?.en?.name || ''
    const image = card.images?.[0]?.card || card.images?.[0]?.art || ''
    const allNames = Object.values(card.text || {}).map(t => t?.name || '').filter(Boolean).join(' ')
    const normalizedNames = normalizeText(allNames)
    
    const cardType = getCardTypeRaw(card, enName)
    
    return {
      ...card,
      _ptName: ptName,
      _enNameLower: enName.toLowerCase(),
      _image: image,
      _normalizedNames: normalizedNames,
      _cardType: cardType
    }
  }

  function getCardTypeRaw(card, enNameLower) {
    if (card.cardType === 'spell') return 'spell'
    if (card.cardType === 'trap') return 'trap'
    if (card.cardType === 'monster') {
      if (enNameLower.includes('xyz') || enNameLower.includes('-xyz')) return 'xyz'
      if (enNameLower.includes('synchro')) return 'synchro'
      if (enNameLower.includes('fusion') || enNameLower.includes('fusdragon')) return 'fusion'
      if (enNameLower.includes('ritual')) return 'ritual'
      if (enNameLower.includes(' link') || enNameLower.includes('-link') || enNameLower.endsWith('link')) return 'link'
      return 'monster'
    }
    return card.cardType
  }

  const loadCards = async () => {
    try {
      const response = await fetch('/json/cards.json')
      const data = await response.json()
      const enriched = data.map(enrichCard)
      
      const byType = { monster: [], spell: [], trap: [], xyz: [], synchro: [], fusion: [], ritual: [], link: [] }
      for (const card of enriched) {
        const t = card._cardType
        if (byType[t]) byType[t].push(card)
      }
      enriched._byType = byType
      
      setCards(enriched)
      
      const raceSet = new Set()
      for (const card of data) { if (card.type) raceSet.add(card.type) }
      setRaces(raceSet)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar cartas:', error)
      setLoading(false)
    }
  }

  const loadSavedDecks = () => {
    const saved = localStorage.getItem('ygoSavedDecks')
    if (saved) setSavedDecks(JSON.parse(saved))
  }

  const getAttributeClass = (attr) => {
    const attrs = { 'light': 'attr-light', 'dark': 'attr-dark', 'water': 'attr-water', 'fire': 'attr-fire', 'earth': 'attr-earth', 'wind': 'attr-wind', 'divine': 'attr-divine' }
    return attrs[attr?.toLowerCase()] || ''
  }

  const getAttributeName = (attr) => {
    const attrs = { 'light': 'Luz', 'dark': 'Trevas', 'water': 'Água', 'fire': 'Fogo', 'earth': 'Terra', 'wind': 'Vento', 'divine': 'Divino' }
    return attrs[attr?.toLowerCase()] || attr
  }

  const getAttributeNamePT = getAttributeName

  const getRacePT = (race) => {
    if (!race) return race
    const races = {
      'warrior': 'Guerreiro', 'spellcaster': 'Mago', 'fairy': 'Fada', 'fiend': 'Demônio',
      'zombie': 'Zumbi', 'machine': 'Mecanóide', 'aqua': 'Aquático', 'pyro': 'Piro',
      'rock': 'Rocha', 'winged beast': 'Besta Alada', 'plant': 'Planta', 'insect': 'Inseto',
      'thunder': 'Trovão', 'reptile': 'Réptil', 'dinosaur': 'Dinossauro', 'fish': 'Peixe',
      'beast': 'Besta', 'beast-warrior': 'Besta-Guerreiro', 'cyberse': 'Ciberso',
      'dragon': 'Dragão', 'normal': 'Normal', 'effect': 'Efeito'
    }
    return races[race.toLowerCase()] || race
  }

  const debouncedSearchTerm = useDebounce(searchTerm, 200)

  useEffect(() => {
    if (!cards.length) return
    
    const normalizedSearch = normalizeText(debouncedSearchTerm)
    const hasSearch = !!debouncedSearchTerm
    const hasType = !!typeFilter
    const hasRace = !!raceFilter
    const hasAttr = !!attrFilter
    
    const lowerAttr = attrFilter?.toLowerCase()
    
    const result = { monster: [], spell: [], trap: [], xyz: [], synchro: [], fusion: [], ritual: [], link: [] }
    const flat = []
    
    for (const card of cards) {
      if (hasSearch && !card._normalizedNames.includes(normalizedSearch)) continue
      if (hasType && card._cardType !== typeFilter) continue
      if (hasRace && card.type !== raceFilter) continue
      if (hasAttr && card.attribute?.toLowerCase() !== lowerAttr) continue
      
      const t = card._cardType
      if (result[t]) {
        result[t].push(card)
      }
      flat.push(card)
    }
    
    setFilteredByType(result)
    setFilteredCards(flat)
    setCurrentPage(1)
  }, [cards, debouncedSearchTerm, typeFilter, raceFilter, attrFilter])

  const deckIdSet = useMemo(() => {
    const set = new Set()
    for (const d of deck) set.add(d.id)
    return set
  }, [deck])

  const handleTranslate = () => {
    window.open(`https://translate.google.com/translate?sl=auto&tl=pt&u=${encodeURIComponent(window.location.href)}`, '_blank')
  }

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-pyramid"></div>
        <div className="loading-text">Carregando as Cartas...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">⚜</div>
              <h1>Yugioh <span>Dex</span></h1>
            </div>
            <nav className="nav-tabs">
              <Link to="/" className="nav-tab">Cartas</Link>
              <Link to="/deck" className="nav-tab">Monte seu Deck</Link>
            </nav>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<CardsView cards={cards} filteredCards={filteredCards} filteredByType={filteredByType} currentPage={currentPage} setCurrentPage={setCurrentPage} deck={deck} setModalCard={setModalCard} searchTerm={searchTerm} setSearchTerm={setSearchTerm} typeFilter={typeFilter} setTypeFilter={setTypeFilter} raceFilter={raceFilter} setRaceFilter={setRaceFilter} attrFilter={attrFilter} setAttrFilter={setAttrFilter} races={races} lang={lang} setLang={setLang} onOpenScanner={() => setScannerOpen(true)} />} />
            <Route path="/deck" element={<DeckPage cards={cards} deck={deck} setDeck={setDeck} deckSearchTerm={deckSearchTerm} setDeckSearchTerm={setDeckSearchTerm} deckTypeFilter={deckTypeFilter} setDeckTypeFilter={setDeckTypeFilter} deckLevelFilter={deckLevelFilter} setDeckLevelFilter={setDeckLevelFilter} setModalCard={setModalCard} savedDecks={savedDecks} setSavedDecks={setSavedDecks} lang={lang} setLang={setLang} isMobile={isMobile} setMobileDeckModal={setMobileDeckModal} deckIdSet={deckIdSet} onOpenScanner={() => setScannerOpen(true)} />} />
          </Routes>
        </main>

        <div className={`modal ${modalCard ? 'active' : ''}`} onClick={() => setModalCard(null)}>
          {modalCard && (
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setModalCard(null)}>&times;</button>
                <div className="card-detail">
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <img 
                    src={modalCard._image} 
                    alt={modalCard._ptName}
                    style={{ maxWidth: '280px', width: '100%', height: 'auto', aspectRatio: '2.5/3.5', objectFit: 'contain', borderRadius: '8px', border: '3px solid var(--gold)' }}
                  />
                </div>
                <div className="card-detail-info">
                  <h2>{modalCard._ptName}</h2>
                  {modalCard.text?.en?.name && modalCard.text?.en?.name !== modalCard.text?.pt?.name && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>({modalCard.text.en.name})</p>
                  )}
                  <div className="card-detail-meta">
                    <div className="meta-item"><span className="meta-label">Tipo:</span><span className="meta-value">{modalCard._cardType === 'monster' ? 'Monstro' : modalCard._cardType === 'spell' ? 'Magia' : modalCard._cardType === 'trap' ? 'Armadilha' : modalCard._cardType}</span></div>
                    {modalCard.level && <div className="meta-item"><span className="meta-label">Nível:</span><span className="meta-value">{'★'.repeat(modalCard.level)} ({modalCard.level})</span></div>}
                    {modalCard.attribute && <div className="meta-item"><span className="meta-label">Atributo:</span><span className="meta-value">{getAttributeNamePT(modalCard.attribute)}</span></div>}
                    {modalCard.type && <div className="meta-item"><span className="meta-label">Raça:</span><span className="meta-value">{getRacePT(modalCard.type)}</span></div>}
                    {modalCard.atk !== undefined && <div className="meta-item"><span className="meta-label">ATK:</span><span className="meta-value">{modalCard.atk}</span></div>}
                    {modalCard.def !== undefined && <div className="meta-item"><span className="meta-label">DEF:</span><span className="meta-value">{modalCard.def}</span></div>}
                  </div>
                  <div className="card-effect">
                    <h4>Efeito</h4>
                    <p>{modalCard.text?.pt?.effect || modalCard.text?.en?.effect || 'Sem efeito disponível'}</p>
                  </div>
                  {(() => {
                    const cardInDeck = deck.find(c => c.id === modalCard.id)
                    const qty = cardInDeck?.qty || 0
                    return (
                      <div className="deck-modal-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {qty > 0 ? (
                          <>
                            <button 
                              className="btn" 
                              style={{ flex: 1 }}
                              onClick={() => {
                                if (qty <= 1) {
                                  setDeck(prev => prev.filter(c => c.id !== modalCard.id))
                                } else {
                                  setDeck(prev => prev.map(c => c.id === modalCard.id ? { ...c, qty: c.qty - 1 } : c))
                                }
                              }}
                            >
                              {qty <= 1 ? 'Remover' : '-1'}
                            </button>
                            <span style={{ color: 'var(--gold)', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>{qty}</span>
                            <button 
                              className="btn btn-primary" 
                              style={{ flex: 1 }}
                              disabled={qty >= 3}
                              onClick={() => {
                                if (qty >= 3) { alert('Máximo 3 cópias por carta!'); return }
                                setDeck(prev => prev.map(c => c.id === modalCard.id ? { ...c, qty: c.qty + 1 } : c))
                              }}
                            >
                              +1
                            </button>
                          </>
                        ) : (
                          <button 
                            className="btn btn-primary" 
                            style={{ width: '100%' }}
                            onClick={() => {
                              let deckType = 'main'
                              if (['fusion', 'synchro', 'xyz', 'link', 'ritual'].includes(modalCard.cardType)) {
                                deckType = 'extra'
                              }
                              setDeck(prev => {
                                const totalCards = prev.reduce((sum, c) => sum + c.qty, 0)
                                if (totalCards >= 60) { alert('Deck cheio! (máx 60)'); return prev }
                                return [...prev, { ...modalCard, qty: 1, deckType }]
                              })
                            }}
                          >
                            Adicionar ao Deck
                          </button>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`mobile-deck-modal ${mobileDeckModal ? 'active' : ''}`}>
          <div className="mobile-deck-modal-content">
            <div className="mobile-deck-modal-header">
              <h3>Adicionar Carta ao Deck</h3>
              <button className="modal-close" onClick={() => setMobileDeckModal(false)}>&times;</button>
            </div>
            <div className="mobile-deck-modal-search">
              <input 
                type="text" 
                className="search-input" 
                placeholder="Buscar carta..." 
                value={deckSearchTerm}
                onChange={(e) => { setDeckSearchTerm(e.target.value); setCurrentPage(1) }}
              />
              <select className="filter-select" value={deckTypeFilter} onChange={(e) => { setDeckTypeFilter(e.target.value); setCurrentPage(1) }}>
                <option value="">Todos os Tipos</option>
                <option value="monster">Monstro</option>
                <option value="spell">Magia</option>
                <option value="trap">Armadilha</option>
              </select>
              <select className="filter-select" value={deckLevelFilter} onChange={(e) => { setDeckLevelFilter(e.target.value); setCurrentPage(1) }}>
                <option value="">Todos os Níveis</option>
                <option value="1-3">Nível 1-3</option>
                <option value="4-6">Nível 4-6</option>
                <option value="7+">Nível 7+</option>
                <option value="spell">Magias</option>
                <option value="trap">Armadilhas</option>
              </select>
            </div>
            <div className="mobile-deck-modal-results">
              {filteredCards.slice(0, 30).map(card => {
                const inDeck = deckIdSet.has(card.id)
                const qty = deck.find(d => d.id === card.id)?.qty || 0
                return (
                  <div key={card.id} className="mobile-deck-card-item" onClick={() => {
                    if (inDeck && qty >= 3) { alert('Máximo 3 cópias!'); return }
                    const deckType = ['fusion', 'synchro', 'xyz', 'link', 'ritual'].includes(card.cardType) ? 'extra' : 'main'
                    setDeck(prev => {
                      const existing = prev.find(c => c.id === card.id)
                      if (existing) {
                        if (existing.qty < 3) return prev.map(c => c.id === card.id ? { ...c, qty: c.qty + 1 } : c)
                        return prev
                      }
                      const totalCards = prev.reduce((sum, c) => sum + c.qty, 0)
                      if (totalCards >= 60) { alert('Deck cheio! (máx 60)'); return prev }
                      return [...prev, { ...card, qty: 1, deckType }]
                    })
                  }}>
                    <img src={card._image} alt="" />
                    <div className="mobile-deck-card-info">
                      <span className="mobile-deck-card-name">{card._ptName}</span>
                      <span className="mobile-deck-card-type">{card.cardType}</span>
                    </div>
                    <button className={`mobile-deck-card-btn ${inDeck ? 'remove' : 'add'}`}>
                      {inDeck ? `${qty}/3` : '+'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {scannerOpen && (
          <CardScanner
            cards={cards}
            onSelect={(card) => {
              setSearchTerm(card._ptName || card.text?.en?.name || '')
              setScannerOpen(false)
            }}
            onClose={() => setScannerOpen(false)}
          />
        )}

        <button className="translate-btn" onClick={handleTranslate} title="Traduzir página">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
          </svg>
        </button>

        <div className="pyramid-bg"></div>
      </div>
    </BrowserRouter>
  )
}

export default App
