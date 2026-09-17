import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, useDraggable, useDroppable } from '@dnd-kit/core'
import {
  AppBar, Toolbar, Typography, Container, Box, Button, IconButton, Drawer,
  List, ListItem, ListItemButton, ListItemText, TextField, Select, MenuItem,
  FormControl, InputLabel, Chip, Pagination, Dialog, DialogTitle, DialogContent,
  DialogActions, LinearProgress, Tooltip, Badge, Paper, InputAdornment,
  CircularProgress, Divider, Stack, Grid, Modal
} from '@mui/material'
import {
  Menu as MenuIcon, Close as CloseIcon, Search as SearchIcon,
  PhotoCamera as CameraIcon, Save as SaveIcon, FileDownload as ExportIcon,
  FileUpload as ImportIcon, Delete as DeleteIcon, FolderOpen as LoadIcon,
  FilterList as FilterIcon, Refresh as ResetIcon, Style as CardsIcon,
  Dashboard as DeckIcon, SportsEsports as BattleIcon, Group as EventIcon,
  Add as AddIcon, Remove as RemoveIcon
} from '@mui/icons-material'
import { YGOCard, YGOCardMini } from './YGOCard'
import CardScanner from './CardScanner'
import BattlePage from './BattlePage'
import NoiteDaRapaziada from './NoiteDaRapaziada'
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

const ATTRIBUTE_PT = {
  light: 'Luz', dark: 'Trevas', water: 'Água', fire: 'Fogo',
  earth: 'Terra', wind: 'Vento', divine: 'Divino'
}

const RACE_PT = {
  warrior: 'Guerreiro', spellcaster: 'Mago', fairy: 'Fada', fiend: 'Demônio',
  zombie: 'Zumbi', machine: 'Mecanóide', aqua: 'Aquático', pyro: 'Piro',
  rock: 'Rocha', 'winged beast': 'Besta Alada', plant: 'Planta', insect: 'Inseto',
  thunder: 'Trovão', reptile: 'Réptil', dinosaur: 'Dinossauro', fish: 'Peixe',
  beast: 'Besta', 'beast-warrior': 'Besta-Guerreiro', cyberse: 'Ciberso',
  dragon: 'Dragão', normal: 'Normal', effect: 'Efeito', 'sea serpent': 'Serpente Marinha',
  'creator god': 'Deus Criador', wyrm: 'Wyrm', psychic: 'Psíquico',
  'toon': 'Toon', 'spirit': 'Espírito', 'union': 'União', 'gemini': 'Gêmeos',
  'tuner': 'Regulador', 'pendulum': 'Pêndulo'
}

const translateAttribute = (attr) => ATTRIBUTE_PT[attr?.toLowerCase()] || attr

const translateRacePT = (race) => {
  if (!race) return race
  return RACE_PT[race.toLowerCase()] || race
}

const getTypeLabelPT = (type) => {
  const labels = {
    monster: 'Monstro', spell: 'Magia', trap: 'Armadilha',
    fusion: 'Fusão', synchro: 'Synchro', xyz: 'XYZ',
    link: 'Link', ritual: 'Ritual'
  }
  return labels[type] || type
}

const EXTRA_DECK_TYPES = ['fusion', 'synchro', 'xyz', 'link', 'pendulum']

const isExtraDeckCard = (card) => {
  const mct = card?.monsterCardTypes
  return Array.isArray(mct) && mct.some(t => EXTRA_DECK_TYPES.includes(t))
}

const DEFAULT_EXPORT_OPTIONS = {
  groupDuplicates: true,
  enumerate: true,
  includeSections: true,
  summary: true,
  namePT: true,
  nameEN: false,
  effect: false,
  cardType: false,
  level: false,
  attribute: false,
  race: false,
  atk: false,
  def: false,
  image: false
}

const ExportCheckbox = ({ label, checked, onChange, hint }) => (
  <label className="export-option">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="export-option-text">
      <span className="export-option-label">{label}</span>
      {hint && <span className="export-option-hint">{hint}</span>}
    </span>
  </label>
)

function ExportDeckModal({ open, options, onChange, preview, canExport, onExport, onClose }) {
  if (!open) return null
  const toggle = (key) => onChange({ ...options, [key]: !options[key] })
  const setDetails = (value) => onChange({
    ...options,
    effect: value, cardType: value, level: value, attribute: value,
    race: value, atk: value, def: value, image: value
  })
  const detailKeys = ['effect', 'cardType', 'level', 'attribute', 'race', 'atk', 'def', 'image']
  const allDetailsOn = detailKeys.every(k => options[k])
  const allDetailsOff = detailKeys.every(k => !options[k])

  return (
    <div className="modal active export-modal" onClick={onClose}>
      <div className="modal-content export-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="export-modal-header">
          <h2>Exportar Deck (.txt)</h2>
          <p>Escolha como as cartas devem ser organizadas no arquivo.</p>
        </div>
        <div className="export-modal-body">
          <div className="export-options-grid">
            <div className="export-section">
              <h4>Formato</h4>
              <ExportCheckbox
                label="Agrupar cópias de cartas iguais"
                hint="ex: Carta (QUANTIDADE DESEJADA: 3x)"
                checked={options.groupDuplicates}
                onChange={() => toggle('groupDuplicates')}
              />
              <ExportCheckbox
                label="Enumerar cartas (1, 2, 3...)"
                checked={options.enumerate}
                onChange={() => toggle('enumerate')}
              />
              <ExportCheckbox
                label="Dividir em Main / Extra / Side"
                checked={options.includeSections}
                onChange={() => toggle('includeSections')}
              />
              <ExportCheckbox
                label="Incluir resumo / estatísticas do deck"
                checked={options.summary}
                onChange={() => toggle('summary')}
              />
            </div>
            <div className="export-section">
              <h4>Nome da carta</h4>
              <ExportCheckbox
                label="Nome em português"
                checked={options.namePT}
                onChange={() => toggle('namePT')}
              />
              <ExportCheckbox
                label="Nome em inglês"
                hint="exibido junto ao nome em PT"
                checked={options.nameEN}
                onChange={() => toggle('nameEN')}
              />
              <h4 className="export-details-title">Detalhes da carta</h4>
              <div className="export-details-actions">
                <button type="button" className="btn-link" onClick={() => setDetails(!allDetailsOn)} disabled={allDetailsOn}>
                  Marcar todos
                </button>
                <button type="button" className="btn-link" onClick={() => setDetails(false)} disabled={allDetailsOff}>
                  Desmarcar todos
                </button>
              </div>
              <ExportCheckbox label="Efeito da carta" checked={options.effect} onChange={() => toggle('effect')} />
              <ExportCheckbox label="Tipo da carta" hint="Monstro / Magia / Armadilha" checked={options.cardType} onChange={() => toggle('cardType')} />
              <ExportCheckbox label="Nível" checked={options.level} onChange={() => toggle('level')} />
              <ExportCheckbox label="Atributo" checked={options.attribute} onChange={() => toggle('attribute')} />
              <ExportCheckbox label="Raça" checked={options.race} onChange={() => toggle('race')} />
              <ExportCheckbox label="ATK" checked={options.atk} onChange={() => toggle('atk')} />
              <ExportCheckbox label="DEF" checked={options.def} onChange={() => toggle('def')} />
              <ExportCheckbox label="URL da imagem" checked={options.image} onChange={() => toggle('image')} />
            </div>
          </div>
          <div className="export-preview">
            <h4>Prévia do arquivo</h4>
            <pre>{preview || '(deck vazio)'}</pre>
          </div>
        </div>
        <div className="export-modal-footer">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={onExport} disabled={!canExport}>Exportar .txt</button>
        </div>
      </div>
    </div>
  )
}

const SimpleCard = ({ card, onClick }) => (
  <div className="simple-card" onClick={() => onClick(card)}>
    <img src={card._image} alt={card._ptName} loading="lazy" />
  </div>
)

const MemoSimpleCard = SimpleCard

function CardsView({ cards, filteredCards, filteredByType, currentPage, setCurrentPage, setModalCard, searchTerm, setSearchTerm, typeFilter, setTypeFilter, raceFilter, setRaceFilter, attrFilter, setAttrFilter, races, lang, setLang, onOpenScanner }) {
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
    <Box component="section" sx={{ pb: 6 }}>
      <Paper 
        elevation={4} 
        sx={{ 
          p: { xs: 2, md: 3 }, 
          mb: 4, 
          borderRadius: 3, 
          backgroundColor: 'rgba(20, 45, 102, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(229, 191, 53, 0.3)'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Buscar cartas (ex: dragão, mestre, blue eyes)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ color: 'text.secondary' }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<CameraIcon />}
              onClick={onOpenScanner}
              sx={{ height: 40, fontWeight: 700 }}
            >
              Escanear Carta
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
              <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1, fontWeight: 600 }}>
                Idioma:
              </Typography>
              <Chip 
                label="PT" 
                color={lang === 'pt' ? 'primary' : 'default'} 
                onClick={() => setLang('pt')} 
                clickable 
                size="small" 
              />
              <Chip 
                label="EN" 
                color={lang === 'en' ? 'primary' : 'default'} 
                onClick={() => setLang('en')} 
                clickable 
                size="small" 
              />
              <Chip 
                label="JP" 
                color={lang === 'ja' ? 'primary' : 'default'} 
                onClick={() => setLang('ja')} 
                clickable 
                size="small" 
              />
            </Stack>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="type-filter-label" sx={{ color: 'text.secondary' }}>Tipo de Carta</InputLabel>
              <Select
                labelId="type-filter-label"
                value={typeFilter}
                label="Tipo de Carta"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">Todos os Tipos</MenuItem>
                <MenuItem value="monster">Monstro</MenuItem>
                <MenuItem value="spell">Magia</MenuItem>
                <MenuItem value="trap">Armadilha</MenuItem>
                <MenuItem value="xyz">XYZ</MenuItem>
                <MenuItem value="synchro">Synchro</MenuItem>
                <MenuItem value="fusion">Fusion</MenuItem>
                <MenuItem value="ritual">Ritual</MenuItem>
                <MenuItem value="link">Link</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="race-filter-label" sx={{ color: 'text.secondary' }}>Raça / Família</InputLabel>
              <Select
                labelId="race-filter-label"
                value={raceFilter}
                label="Raça / Família"
                onChange={(e) => setRaceFilter(e.target.value)}
              >
                <MenuItem value="">Todas as Raças</MenuItem>
                {Array.from(races).sort().map(race => (
                  <MenuItem key={race} value={race}>{race}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="attr-filter-label" sx={{ color: 'text.secondary' }}>Atributo</InputLabel>
              <Select
                labelId="attr-filter-label"
                value={attrFilter}
                label="Atributo"
                onChange={(e) => setAttrFilter(e.target.value)}
              >
                <MenuItem value="">Todos os Atributos</MenuItem>
                <MenuItem value="LIGHT">Luz (LIGHT)</MenuItem>
                <MenuItem value="DARK">Trevas (DARK)</MenuItem>
                <MenuItem value="WATER">Água (WATER)</MenuItem>
                <MenuItem value="FIRE">Fogo (FIRE)</MenuItem>
                <MenuItem value="EARTH">Terra (EARTH)</MenuItem>
                <MenuItem value="WIND">Vento (WIND)</MenuItem>
                <MenuItem value="DIVINE">Divino (DIVINE)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {hasFilter ? (
        filteredCards.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: 'rgba(15,15,20,0.6)' }}>
            <Typography variant="h5" color="primary.main" gutterBottom sx={{ fontWeight: 700 }}>
              Nenhuma carta encontrada
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Tente ajustar seus termos ou seletores de filtro.
            </Typography>
          </Paper>
        ) : (
          <>
            <Box className="cards-section">
              {allCardTypes.map(({ key, label, type }) => {
                const group = filteredByType[type]
                if (!group || group.length === 0) return null
                const paginated = paginatedCards.filter(c => c._cardType === type)
                if (paginated.length === 0 && group.length > 0 && currentPage !== 1) return null
                return (
                  <Box key={key} className="cards-group" sx={{ mb: 4 }}>
                    <Typography variant="h6" className="group-title" sx={{ color: 'primary.main', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      {label} <Chip label={group.length} size="small" color="primary" variant="outlined" />
                    </Typography>
                    <div className="simple-card-grid">
                      {paginated.map(card => (
                        <MemoSimpleCard key={card.id} card={card} onClick={setModalCard} />
                      ))}
                    </div>
                  </Box>
                )
              })}
            </Box>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )
      ) : (
        <Box className="cards-section">
          {allCardTypes.map(({ key, label, type }) => {
            const typeCards = cards._byType?.[type] || []
            const isExpanded = expandedTypes[key]
            const displayCards = isExpanded ? typeCards : typeCards.slice(0, 20)
            if (typeCards.length === 0) return null
            
            return (
              <Box key={key} className="cards-group" sx={{ mb: 4 }}>
                <Box className="group-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" className="group-title" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {label} <Chip label={typeCards.length} size="small" color="primary" />
                  </Typography>
                  {typeCards.length > 20 && (
                    <Button 
                      size="small" 
                      variant="outlined" 
                      color="primary" 
                      onClick={() => toggleType(key)}
                    >
                      {isExpanded ? 'Ver menos' : 'Ver todas as cartas'}
                    </Button>
                  )}
                </Box>
                <div className="simple-card-grid">
                  {displayCards.map(card => (
                    <MemoSimpleCard key={card.id} card={card} onClick={setModalCard} />
                  ))}
                </div>
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )
}

function DeckPage({ cards, deck, setDeck, deckSearchTerm, setDeckSearchTerm, deckTypeFilter, setDeckTypeFilter, deckLevelFilter, setDeckLevelFilter, setModalCard, savedDecks, setSavedDecks, lang, setLang, isMobile, deckIdSet, onOpenScanner }) {
  const [activeId, setActiveId] = useState(null)
  const [deckName, setDeckName] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportOptions, setExportOptions] = useState(DEFAULT_EXPORT_OPTIONS)
  const [libraryOptions, setLibraryOptions] = useState({ groupDuplicates: true, hideInDeck: false, compactGrid: false })
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false)
  const fileInputRef = useRef(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const mainDeck = deck.filter(c => c.deckType === 'main' || !c.deckType)
  const extraDeck = deck.filter(c => c.deckType === 'extra')
  const sideDeck = deck.filter(c => c.deckType === 'side')

  const DeckLibraryCard = ({ card, onAdd, onIncrement, onDecrement, isInDeck, qty, onClick }) => {
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
        <div className="deck-library-controls">
          {isInDeck ? (
            <>
              <button 
                className="deck-library-btn decrement" 
                onClick={(e) => { e.stopPropagation(); onDecrement(card.id) }}
              >
                -1
              </button>
              <span className="deck-library-qty">{qty}/3</span>
              <button 
                className={`deck-library-btn increment ${qty >= 3 ? 'disabled' : ''}`}
                disabled={qty >= 3}
                onClick={(e) => { e.stopPropagation(); onIncrement(card) }}
              >
                +1
              </button>
            </>
          ) : (
            <button className="deck-library-btn add" onClick={(e) => { e.stopPropagation(); onAdd(card) }}>
              + Adicionar
            </button>
          )}
        </div>
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
      if (libraryOptions.hideInDeck && deckIdSet.has(card.id)) return false
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
  }, [cards, deckSearchTerm, deckTypeFilter, deckLevelFilter, libraryOptions.hideInDeck, deckIdSet])

  const totalPages = Math.ceil(filteredCards.length / ITEMS_PER_PAGE)
  const paginatedCards = filteredCards.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleDragStart = (event) => setActiveId(event.active.id)
  
  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const dragId = String(active.id)
    const fromDeck = dragId.startsWith('deck:')
    const parts = dragId.split(':')
    const baseCardId = fromDeck ? parts[1] : dragId
    const isSingleCopy = fromDeck && parts.length > 2

    const card = cards.find(c => c.id === baseCardId)
    if (!card) return

    let targetType = null
    if (over.id === 'main-deck-zone') targetType = 'main'
    else if (over.id === 'extra-deck-zone') targetType = 'extra'
    else if (over.id === 'side-deck-zone') targetType = 'side'
    if (!targetType) return

    if (targetType === 'extra' && !isExtraDeckCard(card)) {
      alert('Apenas cartas Fusão, Synchro, XYZ, Link ou Pêndulo podem ficar no Extra Deck.')
      return
    }

    if (!fromDeck) {
      addToDeck(card, targetType)
      return
    }

    const entry = deck.find(d => d.id === baseCardId)
    if (!entry || entry.deckType === targetType) return

    if (isSingleCopy) {
      setDeck(prev => {
        let sourceIdx = -1
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].id === baseCardId && prev[i].qty > 0 && prev[i].deckType !== targetType) {
            sourceIdx = i
            break
          }
        }
        if (sourceIdx === -1) return prev
        const next = [...prev]
        const source = next[sourceIdx]
        next[sourceIdx] = { ...source, qty: source.qty - 1 }
        const cleaned = next.filter(d => d.qty > 0)
        const targetEntry = cleaned.find(d => d.id === baseCardId && d.deckType === targetType)
        if (targetEntry) {
          return cleaned.map(d => (d.id === targetEntry.id && d.deckType === targetType) ? { ...d, qty: d.qty + 1 } : d)
        }
        return [...cleaned, { ...source, qty: 1, deckType: targetType }]
      })
    } else {
      setDeck(prev => prev.map(d => d.id === baseCardId ? { ...d, deckType: targetType } : d))
    }
  }

  const addToDeck = (card, deckTypeOverride) => {
    let deckType = deckTypeOverride
    if (!deckType) {
      deckType = isExtraDeckCard(card) ? 'extra' : 'main'
    }
    if (deckType === 'extra' && !isExtraDeckCard(card)) {
      alert('Apenas cartas Fusão, Synchro, XYZ, Link ou Pêndulo podem ficar no Extra Deck.')
      return
    }
    const existing = deck.find(c => c.id === card.id)
    if (existing) {
      if (existing.qty < 3) setDeck(prev => prev.map(c => c.id === card.id ? { ...c, qty: c.qty + 1 } : c))
      return
    }
    const totalCards = deck.reduce((sum, c) => sum + c.qty, 0)
    if (totalCards >= 60) alert('Deck cheio! (máx 60)')
    setDeck(prev => [...prev, { ...card, qty: 1, deckType }])
  }

  const incrementInDeck = (card) => {
    setDeck(prev => {
      const existing = prev.find(c => c.id === card.id)
      if (existing && existing.qty < 3) {
        return prev.map(c => c.id === card.id ? { ...c, qty: c.qty + 1 } : c)
      }
      return prev
    })
  }

  const decrementInDeck = (cardId) => {
    setDeck(prev => {
      const existing = prev.find(c => c.id === cardId)
      if (existing) {
        if (existing.qty <= 1) {
          return prev.filter(c => c.id !== cardId)
        }
        return prev.map(c => c.id === cardId ? { ...c, qty: c.qty - 1 } : c)
      }
      return prev
    })
  }

  const removeFromDeck = (cardId) => setDeck(prev => prev.filter(c => c.id !== cardId))

  const cardNameKey = (card) => (card?._ptName || card?.text?.en?.name || card?.id || '').toLowerCase()

  const removeGroupedCopy = (zoneEntries, nameKey) => {
    const matches = zoneEntries.filter(c => cardNameKey(c) === nameKey)
    const target = [...matches].reverse().find(c => c.qty > 0)
    if (!target) return
    if (target.qty > 1) {
      setDeck(prev => prev.map(c => c.id === target.id ? { ...c, qty: c.qty - 1 } : c))
    } else {
      setDeck(prev => prev.filter(c => c.id !== target.id))
    }
  }

  const saveDeck = () => {
    const name = deckName.trim() || `Deck ${savedDecks.length + 1}`
    if (mainDeck.length === 0) { alert('Adicione cartas ao deck principal!'); return }
    const mainTotal = mainDeck.reduce((sum, c) => sum + c.qty, 0)
    const extraTotal = extraDeck.reduce((sum, c) => sum + c.qty, 0)
    const sideTotal = sideDeck.reduce((sum, c) => sum + c.qty, 0)
    const violations = []
    if (mainTotal > 60) violations.push(`Main Deck: ${mainTotal}/60`)
    if (extraTotal > 15) violations.push(`Extra Deck: ${extraTotal}/15`)
    if (sideTotal > 15) violations.push(`Side Deck: ${sideTotal}/15`)
    if (violations.length > 0) {
      alert(`Deck não poderá ser utilizado em duelos, pois excede o valor permitido:\n\n${violations.join('\n')}\n\nO deck foi salvo mesmo assim, mas lembre-se de ajustá-lo antes de duelar.`)
    }
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

  const exportDeckJson = () => {
    if (mainDeck.length === 0 && extraDeck.length === 0 && sideDeck.length === 0) { alert('Adicione cartas ao deck!'); return }
    const name = deckName.trim() || 'ygo-deck'
    const deckData = {
      name,
      main: mainDeck.map(c => ({ id: c.id, qty: c.qty })),
      extra: extraDeck.map(c => ({ id: c.id, qty: c.qty })),
      side: sideDeck.map(c => ({ id: c.id, qty: c.qty }))
    }
    const blob = new Blob([JSON.stringify(deckData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getDetailedDeckStats = useCallback((deckArray) => {
    let monsters = 0, spells = 0, traps = 0
    let fusion = 0, synchro = 0, xyz = 0, link = 0, ritual = 0
    for (const c of deckArray) {
      const t = c._cardType
      if (t === 'monster') monsters += c.qty
      else if (t === 'spell') spells += c.qty
      else if (t === 'trap') traps += c.qty
      else if (t === 'fusion') fusion += c.qty
      else if (t === 'synchro') synchro += c.qty
      else if (t === 'xyz') xyz += c.qty
      else if (t === 'link') link += c.qty
      else if (t === 'ritual') ritual += c.qty
    }
    return { monsters, spells, traps, fusion, synchro, xyz, link, ritual, total: monsters + spells + traps + fusion + synchro + xyz + link + ritual }
  }, [])

  const buildDeckExportTxt = useCallback((opts) => {
    const isEmpty = mainDeck.length === 0 && extraDeck.length === 0 && sideDeck.length === 0
    if (isEmpty) return ''

    const name = deckName.trim() || 'ygo-deck'
    const allCards = [...mainDeck, ...extraDeck, ...sideDeck]
    const stats = getDetailedDeckStats(allCards)

    let content = `========================================\n`
    content += `       INFORMAÇÕES DO DECK: ${name.toUpperCase()}\n`
    content += `========================================\n\n`

    content += `NOME DO DECK: ${name}\n`
    content += `DATA DE EXPORTAÇÃO: ${new Date().toLocaleString('pt-BR')}\n\n`

    content += `========================================\n`
    content += `           CARTAS DO DECK\n`
    content += `========================================\n\n`

    const sections = [
      { title: 'MAIN DECK', cards: mainDeck },
      { title: 'EXTRA DECK', cards: extraDeck },
      { title: 'SIDE DECK', cards: sideDeck }
    ]

    let cardNumber = 1
    sections.forEach(section => {
      if (section.cards.length === 0) return

      if (opts.includeSections) {
        content += `--- ${section.title} (${section.cards.reduce((sum, c) => sum + c.qty, 0)} cartas) ---\n\n`
      }

      const cards = opts.groupDuplicates
        ? section.cards
        : section.cards.flatMap(c => Array.from({ length: c.qty }, () => ({ ...c })))

      cards.forEach(card => {
        const prefix = opts.enumerate ? `${cardNumber}. ` : ''
        const qtySuffix = opts.groupDuplicates ? ` (QUANTIDADE DESEJADA: ${card.qty}x)` : ''
        const nameParts = []
        if (opts.namePT) nameParts.push(card._ptName)
        if (opts.nameEN && card.text?.en?.name && card.text?.en?.name.toLowerCase() !== card._ptName.toLowerCase()) {
          nameParts.push(card.text.en.name)
        }
        const displayName = nameParts.join(' / ') || card.text?.en?.name || card._ptName

        content += `${prefix}${displayName}${qtySuffix}\n`

        const details = []
        if (opts.effect) details.push(`   EFEITO: ${card.text?.pt?.effect || card.text?.en?.effect || ''}`)
        if (opts.cardType) details.push(`   TIPO: ${getTypeLabelPT(card._cardType)}`)
        if (opts.level && card.level) details.push(`   NÍVEL: ${card.level}`)
        if (opts.attribute && card.attribute) details.push(`   ATRIBUTO: ${translateAttribute(card.attribute)}`)
        if (opts.race && card.type) details.push(`   RAÇA: ${translateRacePT(card.type)}`)
        if (opts.atk && card.atk !== undefined) details.push(`   ATK: ${card.atk}`)
        if (opts.def && card.def !== undefined) details.push(`   DEF: ${card.def}`)
        if (opts.image) details.push(`   IMAGEM DA CARTA: ${card._image}`)
        if (details.length > 0) content += `${details.join('\n')}\n`

        content += `\n`
        cardNumber++
      })
    })

    if (opts.summary) {
      content += `========================================\n`
      content += `           RESUMO DO DECK\n`
      content += `========================================\n\n`
      content += `TOTAL DE CARTAS: ${stats.total}\n\n`
      content += `Monstros Normais/Efeito: ${stats.monsters}\n`
      content += `Cartas Mágicas: ${stats.spells}\n`
      content += `Cartas Armadilhas: ${stats.traps}\n`
      content += `Fusão: ${stats.fusion}\n`
      content += `Synchro: ${stats.synchro}\n`
      content += `XYZ: ${stats.xyz}\n`
      content += `Link: ${stats.link}\n`
      content += `Ritual: ${stats.ritual}\n\n`

      content += `========================================\n`
      content += `       RESUMO POR TIPO DE DECK\n`
      content += `========================================\n\n`

      const mainStats = getDetailedDeckStats(mainDeck)
      const extraStats = getDetailedDeckStats(extraDeck)
      const sideStats = getDetailedDeckStats(sideDeck)

      content += `MAIN DECK: ${mainStats.total}/60\n`
      content += `  Monstros: ${mainStats.monsters} | Mágicas: ${mainStats.spells} | Armadilhas: ${mainStats.traps}\n`
      content += `  Fusion: ${mainStats.fusion} | Synchro: ${mainStats.synchro} | XYZ: ${mainStats.xyz} | Link: ${mainStats.link} | Ritual: ${mainStats.ritual}\n\n`

      content += `EXTRA DECK: ${extraStats.total}/15\n`
      content += `  Fusion: ${extraStats.fusion} | Synchro: ${extraStats.synchro} | XYZ: ${extraStats.xyz} | Link: ${extraStats.link} | Ritual: ${extraStats.ritual}\n\n`

      content += `SIDE DECK: ${sideStats.total}/15\n`
      content += `  Monstros: ${sideStats.monsters} | Mágicas: ${sideStats.spells} | Armadilhas: ${sideStats.traps}\n`
      content += `  Fusion: ${sideStats.fusion} | Synchro: ${sideStats.synchro} | XYZ: ${sideStats.xyz} | Link: ${sideStats.link} | Ritual: ${sideStats.ritual}\n\n`
    }

    content += `========================================\n`
    content += `       FIM DA EXPORTAÇÃO\n`
    content += `========================================\n`
    return content
  }, [deckName, getDetailedDeckStats, mainDeck, extraDeck, sideDeck])

  const downloadDeckTxt = () => {
    const content = buildDeckExportTxt(exportOptions)
    if (!content) { alert('Adicione cartas ao deck!'); return }
    const name = deckName.trim() || 'ygo-deck'
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setExportModalOpen(false)
  }

  const previewTxt = useMemo(
    () => buildDeckExportTxt(exportOptions),
    [exportOptions, buildDeckExportTxt]
  )

  const canExportTxt = mainDeck.length > 0 || extraDeck.length > 0 || sideDeck.length > 0

  const importDeck = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const isJson = file.name.toLowerCase().endsWith('.json')
    const isTxt = file.name.toLowerCase().endsWith('.txt')
    if (!isJson && !isTxt) { alert('Apenas arquivos .json ou .txt são suportados!'); return }

    if (!cards || cards.length === 0) {
      alert('As cartas ainda estão sendo carregadas! Por favor, aguarde alguns segundos e tente novamente.')
      event.target.value = ''
      return
    }

    const findCard = (c) => {
      if (!c) return null
      if (typeof c === 'string' || typeof c === 'number') {
        const valStr = String(c).trim()
        const valLower = valStr.toLowerCase()
        return cards.find(card => 
          String(card.id) === valStr ||
          (card.passwords && card.passwords.some(p => String(p) === valStr)) ||
          (card._ptName && card._ptName.toLowerCase() === valLower) ||
          (card.text?.en?.name && card.text.en.name.toLowerCase() === valLower)
        ) || null
      }

      const idStr = String(c.id || c.cardId || c.code || c.password || c.konami_id || '').trim()
      if (idStr) {
        const byId = cards.find(card => String(card.id) === idStr)
        if (byId) return byId
        const byPass = cards.find(card => card.passwords && card.passwords.some(p => String(p) === idStr))
        if (byPass) return byPass
      }

      const nameStr = String(c.name || c.cardName || c.title || c._ptName || '').trim().toLowerCase()
      if (nameStr) {
        const byName = cards.find(card => 
          (card._ptName && card._ptName.toLowerCase() === nameStr) ||
          (card.text?.en?.name && card.text.en.name.toLowerCase() === nameStr)
        )
        if (byName) return byName
      }

      return null
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        let mainRaw = []
        let extraRaw = []
        let sideRaw = []
        let importedDeckName = ''

        const content = e.target.result

        if (isJson) {
          const parsed = JSON.parse(content)
          importedDeckName = parsed.name || parsed.deckName || parsed.title || ''

          if (Array.isArray(parsed)) {
            parsed.forEach(item => {
              const type = item.deckType || item.section || 'main'
              if (type === 'extra') extraRaw.push(item)
              else if (type === 'side') sideRaw.push(item)
              else mainRaw.push(item)
            })
          } else {
            mainRaw = parsed.main || parsed.main_deck || parsed.mainDeck || parsed.cards || []
            extraRaw = parsed.extra || parsed.extra_deck || parsed.extraDeck || []
            sideRaw = parsed.side || parsed.side_deck || parsed.sideDeck || []
          }
        } else {
          // Parse TXT format
          const lines = content.split('\n')
          let currentSection = 'main'
          
          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed.startsWith('NOME DO DECK:')) {
              importedDeckName = trimmed.replace('NOME DO DECK:', '').trim()
            } else if (trimmed.includes('MAIN DECK')) {
              currentSection = 'main'
            } else if (trimmed.includes('EXTRA DECK')) {
              currentSection = 'extra'
            } else if (trimmed.includes('SIDE DECK')) {
              currentSection = 'side'
            } else if (trimmed.startsWith('QUANTIDADE NO DECK:')) {
              const qty = parseInt(trimmed.replace('QUANTIDADE NO DECK:', '').trim()) || 1
              const nameLineIdx = lines.indexOf(line) - 2
              if (nameLineIdx >= 0) {
                const nameLine = lines[nameLineIdx].trim()
                if (nameLine.startsWith('NOME DA CARTA:')) {
                  const cardName = nameLine.replace('NOME DA CARTA:', '').trim()
                  const targetObj = { name: cardName, qty }
                  if (currentSection === 'extra') extraRaw.push(targetObj)
                  else if (currentSection === 'side') sideRaw.push(targetObj)
                  else mainRaw.push(targetObj)
                }
              }
            }
          }
        }

        let notFoundCount = 0

        const buildSection = (arr, defaultType) => {
          const result = []
          for (const item of arr) {
            const card = findCard(item)
            const qty = typeof item === 'object' && item !== null
              ? (parseInt(item.qty || item.quantity || item.count || item.amount || 1) || 1)
              : 1
            if (card) {
              result.push({ ...card, qty, deckType: defaultType })
            } else {
              notFoundCount++
            }
          }
          return result
        }

        const mainDeckCards = buildSection(mainRaw, 'main')
        const extraDeckCards = buildSection(extraRaw, 'extra')
        const sideDeckCards = buildSection(sideRaw, 'side')

        const newDeck = [...mainDeckCards, ...extraDeckCards, ...sideDeckCards]

        if (newDeck.length === 0) {
          alert('Nenhuma carta válida pôde ser importada do arquivo!')
          return
        }

        setDeck(newDeck)
        setDeckName(importedDeckName || file.name.replace(/\.(json|txt)$/i, '') || 'Deck Importado')

        const mainQty = mainDeckCards.reduce((sum, c) => sum + c.qty, 0)
        const extraQty = extraDeckCards.reduce((sum, c) => sum + c.qty, 0)
        const sideQty = sideDeckCards.reduce((sum, c) => sum + c.qty, 0)

        let msg = `Deck importado com sucesso!\n\nMain Deck: ${mainQty} carta(s)\nExtra Deck: ${extraQty} carta(s)\nSide Deck: ${sideQty} carta(s)`
        if (notFoundCount > 0) {
          msg += `\n\nAviso: ${notFoundCount} carta(s) não foram encontradas no banco de dados.`
        }
        alert(msg)
      } catch (err) { 
        console.error(err)
        alert('Erro ao importar deck! Verifique o formato do arquivo.') 
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const getCardDeckType = (cardId) => {
    const card = deck.find(c => c.id === cardId)
    return card?.deckType || null
  }

  const stats = getDetailedDeckStats(mainDeck)
  const extraStats = getDetailedDeckStats(extraDeck)
  const sideStats = getDetailedDeckStats(sideDeck)
  const activeCard = useMemo(() => {
    if (activeId == null) return null
    const s = String(activeId)
    const id = s.startsWith('deck:') ? s.split(':')[1] : s
    return cards.find(c => c.id === id) || null
  }, [activeId, cards])

  const DeckCard = ({ card, qty, onClick, onRemove, dragId }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: dragId })
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
    return (
      <div
        className="deck-card-item"
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
      >
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
        <button className="deck-card-remove" onClick={(e) => { e.stopPropagation(); onRemove(card.id) }}>×</button>
      </div>
    )
  }

  const DeckZone = ({ title, deckArray, zoneId, stats, onEmptyClick, isMobile, showDetailed = false, groupDuplicates = true }) => {
    const { setNodeRef, isOver } = useDroppable({ id: zoneId })
    const maxCards = title.includes('Main') ? 60 : 15
    const isMain = title.includes('Main')

    const groupedCards = useMemo(() => {
      const map = new Map()
      for (const card of deckArray) {
        const key = cardNameKey(card)
        if (map.has(key)) {
          const g = map.get(key)
          g.qty += card.qty
          g.entries.push(card)
        } else {
          map.set(key, { key, card, qty: card.qty, entries: [card] })
        }
      }
      return [...map.values()]
    }, [deckArray])

    const zoneCards = groupDuplicates
      ? groupedCards.map(g => (
        <DeckCard
          key={g.entries.map(e => e.id).join('-')}
          card={g.card}
          qty={g.qty}
          dragId={`deck:${g.card.id}`}
          onClick={setModalCard}
          onRemove={() => removeGroupedCopy(deckArray, g.key)}
        />
      ))
      : deckArray.flatMap(card => Array.from({ length: card.qty }, (_, i) => (
        <DeckCard
          key={`${card.id}-${i}`}
          card={card}
          qty={1}
          dragId={`deck:${card.id}:${i}`}
          onClick={setModalCard}
          onRemove={id => decrementInDeck(id)}
        />
      )))

    return (
      <div 
        className={`deck-zone ${isOver ? 'drag-over' : ''} ${deckArray.length === 0 ? 'empty' : ''}`}
        ref={setNodeRef}
      >
        <div className="deck-zone-header">
          <h4>{title}</h4>
          <span className={`deck-count ${stats.total > maxCards ? 'error' : isMain && stats.total >= 40 ? 'warning' : isMain && stats.total < 40 ? 'warning' : 'ok'}`}>
            {stats.total}/{maxCards}
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
            zoneCards
          )}
        </div>
        {deckArray.length > 0 && (
          <div className="deck-zone-stats">
            {showDetailed && !isMain ? (
              <>
                <span>F: {stats.fusion}</span>
                <span>S: {stats.synchro}</span>
                <span>X: {stats.xyz}</span>
                <span>L: {stats.link}</span>
                <span>R: {stats.ritual}</span>
              </>
            ) : (
              <>
                <span>M: {stats.monsters}</span>
                <span>S: {stats.spells}</span>
                <span>T: {stats.traps}</span>
              </>
            )}
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
            
            <DeckZone title="Main Deck (40-60)" deckArray={mainDeck} zoneId="main-deck-zone" stats={stats} onEmptyClick={() => setMobileLibraryOpen(true)} isMobile={isMobile} showDetailed={false} groupDuplicates={libraryOptions.groupDuplicates} />
            <DeckZone title="Extra Deck (0-15)" deckArray={extraDeck} zoneId="extra-deck-zone" stats={extraStats} onEmptyClick={() => setMobileLibraryOpen(true)} isMobile={isMobile} showDetailed={true} groupDuplicates={libraryOptions.groupDuplicates} />
            <DeckZone title="Side Deck (0-15)" deckArray={sideDeck} zoneId="side-deck-zone" stats={sideStats} onEmptyClick={() => setMobileLibraryOpen(true)} isMobile={isMobile} showDetailed={false} groupDuplicates={libraryOptions.groupDuplicates} />

            <div className="deck-rules-info">
              <h4>Regras do Deck</h4>
              <ul>
                <li className={stats.total < 40 ? 'rule-error' : stats.total <= 60 ? 'rule-ok' : 'rule-error'}>
                  Main Deck: {stats.total}/60 {stats.total < 40 ? '(Mínimo 40!)' : stats.total > 60 ? '(Máximo 60!)' : '✓'}
                </li>
                <li className={extraStats.total <= 15 ? 'rule-ok' : 'rule-error'}>Extra Deck: {extraStats.total}/15</li>
                <li className={sideStats.total <= 15 ? 'rule-ok' : 'rule-error'}>Side Deck: {sideStats.total}/15</li>
                <li>Cópias por carta: máx 3</li>
              </ul>
            </div>

            <div className="deck-actions">
              <button className="btn btn-primary" onClick={saveDeck}>Salvar Deck</button>
              <button className="btn" onClick={() => setExportModalOpen(true)}>Exportar .txt</button>
              <button className="btn" onClick={exportDeckJson}>EXPORTAR DECK (JSON)</button>
              <button className="btn" onClick={() => fileInputRef.current?.click()}>IMPORTAR DECK (JSON/TXT)</button>
              <input type="file" ref={fileInputRef} onChange={importDeck} accept=".json,.txt" style={{ display: 'none' }} />
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

          <div className={`card-search-panel ${mobileLibraryOpen ? 'open' : ''}`}>
            <div className="search-panel-header">
              <h3>Biblioteca de Cartas</h3>
              <div className="search-panel-header-right">
                <div className="lang-toggle">
                  <button className={lang === 'pt' ? 'active' : ''} onClick={() => setLang('pt')}>PT</button>
                  <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
                  <button className={lang === 'ja' ? 'active' : ''} onClick={() => setLang('ja')}>JP</button>
                </div>
                <button className="library-close" onClick={() => setMobileLibraryOpen(false)}>&times;</button>
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
              <div className="library-options">
                <label className="library-option">
                  <input
                    type="checkbox"
                    checked={libraryOptions.groupDuplicates}
                    onChange={(e) => setLibraryOptions(prev => ({ ...prev, groupDuplicates: e.target.checked }))}
                  />
                  <span>Agrupar cartas repetidas</span>
                </label>
                <label className="library-option">
                  <input
                    type="checkbox"
                    checked={libraryOptions.hideInDeck}
                    onChange={(e) => { setLibraryOptions(prev => ({ ...prev, hideInDeck: e.target.checked })); setCurrentPage(1) }}
                  />
                  <span>Ocultar cartas já no deck</span>
                </label>
                <label className="library-option">
                  <input
                    type="checkbox"
                    checked={libraryOptions.compactGrid}
                    onChange={(e) => setLibraryOptions(prev => ({ ...prev, compactGrid: e.target.checked }))}
                  />
                  <span>Modo compacto (mais cartas)</span>
                </label>
              </div>
            </div>
            <div className="search-results-count">{filteredCards.length} cartas encontradas</div>
            <div className={`library-grid ${libraryOptions.compactGrid ? 'compact' : ''}`}>
              {paginatedCards.map(card => {
                const inDeck = deckIdSet.has(card.id)
                const deckCard = deck.find(d => d.id === card.id)
                const qty = deckCard?.qty || 0
                return (
                  <DeckLibraryCard 
                    key={card.id} 
                    card={card} 
                    onAdd={(c) => addToDeck(c)}
                    onIncrement={incrementInDeck}
                    onDecrement={decrementInDeck}
                    onRemove={removeFromDeck}
                    isInDeck={inDeck}
                    qty={qty}
                    deckType={getCardDeckType(card.id)}
                    onClick={setModalCard}
                  />
                )
              })}
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

      <ExportDeckModal
        open={exportModalOpen}
        options={exportOptions}
        onChange={setExportOptions}
        preview={previewTxt}
        canExport={canExportTxt}
        onExport={downloadDeckTxt}
        onClose={() => setExportModalOpen(false)}
      />
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
  const [isMobile, setIsMobile] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  useEffect(() => { loadCards(); loadSavedDecks() }, [])

  const getAttributeName = (attr) => translateAttribute(attr)

  const getAttributeNamePT = getAttributeName

  const getRacePT = (race) => translateRacePT(race)

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
      <Box 
        className="loading-overlay"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#0F0F14',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}
      >
        <img src="/loading-kaiba.gif" alt="Kaiba" className="loading-kaiba" />
        <Typography variant="h6" sx={{ color: 'primary.main', mt: 2, fontWeight: 700 }}>
          Carregando as Cartas...
        </Typography>
        <CircularProgress color="primary" sx={{ mt: 3 }} />
      </Box>
    )
  }

  const navItems = [
    { label: 'Cartas', path: '/', icon: <CardsIcon /> },
    { label: 'Monte seu Deck', path: '/deck', icon: <DeckIcon /> },
    { label: 'Pontos de Vida', path: '/batalha', icon: <BattleIcon /> },
    { label: 'Noite da Rapaziada', path: '/noite-da-rapaziada', icon: <EventIcon /> }
  ]

  return (
    <BrowserRouter>
      <Box className="app" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" elevation={4}>
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  component="img"
                  src="/yugidex-icon.png"
                  alt="Yugidex"
                  sx={{ width: 36, height: 36, filter: 'drop-shadow(0 0 8px rgba(229,191,53,0.6))' }}
                />
                <Typography 
                  variant="h5" 
                  component={Link} 
                  to="/" 
                  sx={{ 
                    textDecoration: 'none', 
                    color: 'text.primary', 
                    fontWeight: 800,
                    letterSpacing: 1,
                    '& span': { color: 'primary.main' }
                  }}
                >
                  Yugioh <span>Dex</span>
                </Typography>
              </Box>

              {/* Desktop Nav */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                {navItems.map((item) => (
                  <Button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    startIcon={item.icon}
                    color="primary"
                    sx={{ 
                      px: 2, 
                      py: 1,
                      fontWeight: 700,
                      '&:hover': { backgroundColor: 'rgba(229, 191, 53, 0.15)' }
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>

              {/* Mobile Menu Icon */}
              <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                <IconButton
                  color="primary"
                  onClick={() => setMenuOpen(true)}
                  edge="end"
                  aria-label="Abrir Menu"
                >
                  <MenuIcon fontSize="large" />
                </IconButton>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        {/* Mobile Navigation Drawer */}
        <Drawer
          anchor="right"
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          PaperProps={{
            sx: {
              width: 280,
              backgroundColor: '#0F0F14',
              borderLeft: '1px solid rgba(229, 191, 53, 0.3)',
              p: 2
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="primary.main" fontWeight={700}>
              Menu YugiDex
            </Typography>
            <IconButton onClick={() => setMenuOpen(false)} color="primary">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ borderColor: 'rgba(229, 191, 53, 0.2)', mb: 2 }} />
          <List>
            {navItems.map((item) => (
              <ListItem disablePadding key={item.path} sx={{ mb: 1 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  sx={{
                    borderRadius: 2,
                    color: 'text.primary',
                    '&:hover': { backgroundColor: 'rgba(229, 191, 53, 0.15)', color: 'primary.main' }
                  }}
                >
                  <ListItemIcon sx={{ color: 'primary.main' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Drawer>

        <Container maxWidth="xl" component="main" sx={{ flexGrow: 1, pt: 3, pb: 6 }}>
          <Routes>
            <Route path="/" element={<CardsView cards={cards} filteredCards={filteredCards} filteredByType={filteredByType} currentPage={currentPage} setCurrentPage={setCurrentPage} deck={deck} setModalCard={setModalCard} searchTerm={searchTerm} setSearchTerm={setSearchTerm} typeFilter={typeFilter} setTypeFilter={setTypeFilter} raceFilter={raceFilter} setRaceFilter={setRaceFilter} attrFilter={attrFilter} setAttrFilter={setAttrFilter} races={races} lang={lang} setLang={setLang} onOpenScanner={() => setScannerOpen(true)} />} />
            <Route path="/deck" element={<DeckPage cards={cards} deck={deck} setDeck={setDeck} deckSearchTerm={deckSearchTerm} setDeckSearchTerm={setDeckSearchTerm} deckTypeFilter={deckTypeFilter} setDeckTypeFilter={setDeckTypeFilter} deckLevelFilter={deckLevelFilter} setDeckLevelFilter={setDeckLevelFilter} setModalCard={setModalCard} savedDecks={savedDecks} setSavedDecks={setSavedDecks} lang={lang} setLang={setLang} isMobile={isMobile} deckIdSet={deckIdSet} onOpenScanner={() => setScannerOpen(true)} />} />
            <Route path="/batalha" element={<BattlePage />} />
            <Route path="/noite-da-rapaziada" element={<NoiteDaRapaziada />} />
          </Routes>
        </Container>

        {/* Modal de Zoom e Detalhes da Carta */}
        <Dialog
          open={Boolean(modalCard)}
          onClose={() => setModalCard(null)}
          maxWidth="sm"
          fullWidth
        >
          {modalCard && (
            <>
              <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography variant="h6" color="primary.main" fontWeight={700}>
                  {modalCard._ptName}
                </Typography>
                <IconButton onClick={() => setModalCard(null)} size="small" color="primary">
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, alignItems: { xs: 'center', sm: 'flex-start' } }}>
                  <Box
                    component="img"
                    src={modalCard._image}
                    alt={modalCard._ptName}
                    sx={{
                      maxWidth: 240,
                      width: '100%',
                      borderRadius: 2,
                      border: '2px solid #E5BF35',
                      boxShadow: '0 0 15px rgba(229,191,53,0.3)'
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    {modalCard.text?.en?.name && modalCard.text?.en?.name !== modalCard.text?.pt?.name && (
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, italic: true }}>
                        ({modalCard.text.en.name})
                      </Typography>
                    )}
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                      <Chip 
                        label={`Tipo: ${modalCard._cardType === 'monster' ? 'Monstro' : modalCard._cardType === 'spell' ? 'Magia' : modalCard._cardType === 'trap' ? 'Armadilha' : modalCard._cardType}`} 
                        color="primary" 
                        size="small" 
                        variant="outlined" 
                      />
                      {modalCard.level && (
                        <Chip label={`★ ${modalCard.level}`} color="secondary" size="small" />
                      )}
                      {modalCard.attribute && (
                        <Chip label={getAttributeNamePT(modalCard.attribute)} size="small" />
                      )}
                      {modalCard.type && (
                        <Chip label={getRacePT(modalCard.type)} size="small" variant="outlined" />
                      )}
                    </Stack>
                    
                    {(modalCard.atk !== undefined || modalCard.def !== undefined) && (
                      <Paper sx={{ p: 1.5, mb: 2, backgroundColor: 'rgba(15,15,20,0.6)', display: 'flex', gap: 2 }}>
                        {modalCard.atk !== undefined && (
                          <Typography variant="body2" fontWeight={700} color="primary.main">
                            ATK / {modalCard.atk}
                          </Typography>
                        )}
                        {modalCard.def !== undefined && (
                          <Typography variant="body2" fontWeight={700} color="text.secondary">
                            DEF / {modalCard.def}
                          </Typography>
                        )}
                      </Paper>
                    )}

                    <Typography variant="subtitle2" color="primary.main" fontWeight={700} sx={{ mb: 0.5 }}>
                      Efeito / Descrição
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6 }}>
                      {modalCard.text?.pt?.effect || modalCard.text?.en?.effect || 'Sem efeito disponível'}
                    </Typography>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                {(() => {
                  const cardInDeck = deck.find(c => c.id === modalCard.id)
                  const qty = cardInDeck?.qty || 0
                  return qty > 0 ? (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => {
                          if (qty <= 1) {
                            setDeck(prev => prev.filter(c => c.id !== modalCard.id))
                          } else {
                            setDeck(prev => prev.map(c => c.id === modalCard.id ? { ...c, qty: c.qty - 1 } : c))
                          }
                        }}
                        sx={{ flex: 1 }}
                      >
                        {qty <= 1 ? 'Remover' : '-1 Cópia'}
                      </Button>
                      <Chip label={`${qty} no Deck`} color="primary" fontWeight={700} />
                      <Button
                        variant="contained"
                        color="primary"
                        disabled={qty >= 3}
                        onClick={() => {
                          if (qty >= 3) { alert('Máximo 3 cópias por carta!'); return }
                          setDeck(prev => prev.map(c => c.id === modalCard.id ? { ...c, qty: c.qty + 1 } : c))
                        }}
                        sx={{ flex: 1 }}
                      >
                        +1 Cópia
                      </Button>
                    </Stack>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        let deckType = 'main'
                        if (['fusion', 'synchro', 'xyz', 'link', 'ritual'].includes(modalCard.cardType)) {
                          deckType = 'extra'
                        }
                        const totalCards = deck.reduce((sum, c) => sum + c.qty, 0)
                        if (totalCards >= 60) alert('Deck cheio! (máx 60)')
                        setDeck(prev => [...prev, { ...modalCard, qty: 1, deckType }])
                      }}
                    >
                      Adicionar ao Deck
                    </Button>
                  )
                })()}
              </DialogActions>
            </>
          )}
        </Dialog>

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

        <IconButton
          onClick={handleTranslate}
          title="Traduzir página"
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            backgroundColor: '#E5BF35',
            color: '#0F0F14',
            boxShadow: '0 4px 15px rgba(229,191,53,0.5)',
            '&:hover': { backgroundColor: '#f0d46a' },
            zIndex: 1000
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
          </svg>
        </IconButton>
      </Box>
    </BrowserRouter>
  )
}

export default App
