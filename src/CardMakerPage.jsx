import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { toPng } from 'html-to-image'
import YugiohCardPreview from './YugiohCardPreview'
import {
  CARD_TYPES,
  ATTRIBUTES,
  SPELL_TRAP_ICONS,
  RARITIES,
  LEVELS,
  LINK_ARROWS,
  SPELL_TRAP_TYPES,
  TIPO_PADRAO,
  CARD_W,
  CARD_H,
  DECK_PER_PAGE,
  defaultCardState,
  stateFromDbCard,
} from './cardMakerData'
import { getCardImage, normalizeText } from './cardUtils'
import { buildDeckPdf } from './deckPdf'
import './CardMakerPage.css'

const STORAGE_KEY = 'ygoCustomCards'
const DECKS_KEY = 'ygoCustomDecks'
const DB_PER_PAGE = 40

// base64 seguro para unicode
const b64encode = (str) => btoa(unescape(encodeURIComponent(str)))
const b64decode = (str) => decodeURIComponent(escape(atob(str)))

// As artes vindas do banco ficam em outro dominio (images.ygoprodeck.com) sem
// cabecalho CORS, e o navegador nao deixa ler a imagem para desenhar no canvas
// (isso quebra a exportacao de PNG/PDF: "Failed to fetch" e canvas contaminado).
// Na hora de exportar, reencaminha a arte remota por um proxy com CORS; a
// imagem exibida na tela continua usando a URL original.
const artForExport = (art) => {
  if (!art || typeof art !== 'string' || !/^https?:\/\//i.test(art)) return art
  if (art.includes('images.weserv.nl')) return art
  return `https://images.weserv.nl/?url=${encodeURIComponent(art)}`
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function loadDecks() {
  try {
    const raw = localStorage.getItem(DECKS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function CardMakerPage({ cards = [] }) {
  const [state, setState] = useState(() => {
    const base = defaultCardState()
    try {
      const hash = window.location.hash
      const m = hash.match(/c=([^&]+)/)
      if (m) {
        const parsed = JSON.parse(b64decode(decodeURIComponent(m[1])))
        return { ...base, ...parsed }
      }
    } catch {
      /* ignora hash invalido */
    }
    return base
  })
  const [saved, setSaved] = useState(loadSaved)
  const [currentId, setCurrentId] = useState(null)
  const [savedSearch, setSavedSearch] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [previewWidth, setPreviewWidth] = useState(421)
  const [printCards, setPrintCards] = useState(null)
  const cardRef = useRef(null)
  const previewRef = useRef(null)
  const printRefs = useRef([])
  const deckTxtInputRef = useRef(null)
  const deckJsonInputRef = useRef(null)

  // ---- Montador de deck (cartas criadas) ----
  const [mode, setMode] = useState('editor')
  const [customDecks, setCustomDecks] = useState(loadDecks)
  const [currentDeckId, setCurrentDeckId] = useState(null)
  const [deckName, setDeckName] = useState('')
  const [deckCards, setDeckCards] = useState([])
  const [libTab, setLibTab] = useState('db')
  const [dbSearch, setDbSearch] = useState('')
  const [dbPage, setDbPage] = useState(1)

  const isTrapSpell = SPELL_TRAP_TYPES.includes(state.type)
  const canPendulum = !isTrapSpell && state.type !== 'link'

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (mode !== 'editor') return
    const el = previewRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      if (w > 0) setPreviewWidth(Math.max(220, Math.min(421, Math.floor(w - 32))))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [mode])

  // Ao entrar no Deck Criado sem um deck carregado, lista automaticamente
  // todas as cartas criadas para edicao/exportacao.
  const prevModeRef = useRef(mode)
  useEffect(() => {
    const prev = prevModeRef.current
    prevModeRef.current = mode
    if (prev === mode || mode !== 'deck') return
    if (currentDeckId !== null) return
    if (!saved.length) return
    setDeckCards(
      saved.map((c) => ({ id: `dc_saved_${c.id}`, state: { ...c.state } })),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Renderiza (oculto) as cartas do deck e gera o PDF A4 em matriz.
  useEffect(() => {
    const pc = printCards
    if (!pc) return
    let cancelled = false
    const run = async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        await new Promise((r) => setTimeout(r, 150))
        const images = []
        for (let i = 0; i < pc.cards.length; i++) {
          const el = printRefs.current[i]
          if (!el) continue
          const dataUrl = await toPng(el, {
            width: CARD_W,
            height: CARD_H,
            pixelRatio: 2,
            cacheBust: true,
            // O html-to-image usa a URL sem query como chave de cache. Como a
            // arte do banco passa pelo proxy (images.weserv.nl/?url=...), todas
            // as cartas cairiam na mesma chave e repetiriam a 1a imagem. Incluir
            // a query na chave mantem a arte correta de cada carta.
            includeQueryParams: true,
            style: { transform: 'none', transformOrigin: 'top left' },
          })
          if (cancelled) return
          images.push(dataUrl)
        }
        if (cancelled) return
        if (!images.length) return
        if (pc.kind === 'png') {
          const a = document.createElement('a')
          a.download = pc.filename
          a.href = images[0]
          a.click()
          setToast('Download gerado!')
        } else {
          const { pages } = await buildDeckPdf(images, pc.filename)
          setToast(`PDF gerado: ${images.length} carta(s) em ${pages} folha(s) A4`)
        }
      } catch (e) {
        console.error('Erro ao gerar arquivo do deck:', e)
        setToast(pc.kind === 'png' ? 'Falha ao gerar PNG' : 'Falha ao gerar PDF')
      } finally {
        if (!cancelled) {
          setBusy(false)
          setPrintCards(null)
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [printCards])

  const update = useCallback((patch) => {
    setState((s) => ({ ...s, ...patch }))
  }, [])

  const handleTypeChange = (type) => {
    setState((s) => {
      const next = { ...s, type }
      if (!SPELL_TRAP_TYPES.includes(type) && type !== 'link') {
        if (!s.monsterType || Object.values(TIPO_PADRAO).includes(s.monsterType)) {
          next.monsterType = TIPO_PADRAO[type] || s.monsterType
        }
      } else {
        next.pendulum = false
      }
      if (SPELL_TRAP_TYPES.includes(type)) next.attribute = type
      return next
    })
  }

  const handleArtFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => update({ art: reader.result })
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    const name = state.name?.trim() || 'Carta sem nome'
    const entry = {
      id: currentId || `card_${Date.now()}`,
      name,
      state,
      date: new Date().toISOString(),
    }
    setSaved((prev) => {
      const exists = prev.some((c) => c.id === entry.id)
      const next = exists ? prev.map((c) => (c.id === entry.id ? entry : c)) : [entry, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
    setCurrentId(entry.id)
    setToast('Carta salva!')
  }

  const handleLoad = (entry) => {
    setState({ ...defaultCardState(), ...entry.state })
    setCurrentId(entry.id)
    setListOpen(false)
    setSavedSearch('')
    setToast(`Carregada: ${entry.name}`)
  }

  const handleDelete = (id) => {
    setSaved((prev) => {
      const next = prev.filter((c) => c.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
    if (currentId === id) setCurrentId(null)
  }

  const handleNew = () => {
    setState(defaultCardState())
    setCurrentId(null)
    window.history.replaceState(null, '', window.location.pathname)
    setToast('Nova carta')
  }

  const handleDownload = () => {
    const safe = (state.name || 'yugioh-card').replace(/[^\w-]+/g, '_')
    generateFromStates([{ id: 'carta-atual', state }], `${safe}.png`, 'png')
  }

  const handleShare = async () => {
    try {
      const shareState = { ...state }
      if (shareState.art && shareState.art.startsWith('data:')) {
        delete shareState.art
        if (!state.art.startsWith('http')) {
          setToast('Arte enviada do PC não entra no link (use URL)')
        }
      }
      const encoded = encodeURIComponent(b64encode(JSON.stringify(shareState)))
      const url = `${window.location.origin}${window.location.pathname}#c=${encoded}`
      window.history.replaceState(null, '', `#c=${encoded}`)
      try {
        await navigator.clipboard.writeText(url)
        setToast('Link copiado!')
      } catch {
        setToast('Link gerado na barra de endereço')
      }
    } catch (e) {
      console.error(e)
      setToast('Falha ao gerar link')
    }
  }

  // ---- Exportacao em PNG/PDF (A4, matriz 3x3) ----
  const generateFromStates = (cards, filename, kind = 'pdf') => {
    if (!cards.length) {
      setToast('Nenhuma carta para exportar')
      return
    }
    printRefs.current = []
    setBusy(true)
    setPrintCards({
      cards: cards.map((c) => ({ ...c, state: { ...c.state, art: artForExport(c.state.art) } })),
      filename,
      kind,
    })
  }



  const handleSinglePdf = () => {
    const safe = (state.name || 'yugioh-card').replace(/[^\w-]+/g, '_')
    generateFromStates([{ id: 'carta-atual', state }], `${safe}.pdf`)
  }

  const clampSize = (v, min, max, def) => {
    const n = Number(v)
    if (Number.isNaN(n)) return def
    return Math.max(min, Math.min(max, Math.floor(n)))
  }



  // ---- Montador de deck (cartas criadas) ----
  const persistDecks = (next) => {
    setCustomDecks(next)
    localStorage.setItem(DECKS_KEY, JSON.stringify(next))
  }

  const newDeckCardId = () => `dc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  const addCurrentToDeck = () => {
    setDeckCards((prev) => [...prev, { id: newDeckCardId(), state: { ...state } }])
    setToast('Carta adicionada ao deck')
  }

  const addSavedToDeck = (entry) => {
    setDeckCards((prev) => [...prev, { id: newDeckCardId(), state: { ...entry.state } }])
    setToast(`${entry.name} adicionada ao deck`)
  }

  const removeDeckCard = (id) => setDeckCards((prev) => prev.filter((c) => c.id !== id))
  const clearDeckCards = () => setDeckCards([])

  const editDeckCard = (dc) => {
    setState({ ...defaultCardState(), ...dc.state })
    setCurrentId(null)
    setMode('editor')
    setToast('Editando carta do deck')
  }

  const saveCustomDeck = () => {
    if (!deckCards.length) {
      setToast('Adicione cartas ao deck primeiro')
      return
    }
    const name = deckName.trim() || `Deck ${customDecks.length + 1}`
    const entry = {
      id: currentDeckId || Date.now(),
      name,
      cards: deckCards.map((c) => c.state),
      date: new Date().toISOString(),
    }
    const exists = customDecks.some((d) => d.id === entry.id)
    const next = exists ? customDecks.map((d) => (d.id === entry.id ? entry : d)) : [entry, ...customDecks]
    persistDecks(next)
    setCurrentDeckId(entry.id)
    setDeckName(name)
    setToast('Deck salvo!')
  }

  const loadCustomDeck = (deck) => {
    setCurrentDeckId(deck.id)
    setDeckName(deck.name)
    setDeckCards((deck.cards || []).map((s, i) => ({ id: `dc_${deck.id}_${i}`, state: s })))
    setToast(`Deck carregado: ${deck.name}`)
  }

  const deleteCustomDeck = (id) => {
    persistDecks(customDecks.filter((d) => d.id !== id))
    if (currentDeckId === id) {
      setCurrentDeckId(null)
      setDeckCards([])
      setDeckName('')
    }
  }

  const newCustomDeck = () => {
    setCurrentDeckId(null)
    setDeckName('')
    setDeckCards([])
    setToast('Novo deck')
  }

  const importDbCard = (card) => {
    setState(stateFromDbCard(card))
    setCurrentId(null)
    setMode('editor')
    setToast('Carta importada para edição')
  }

  // ---- Arrastar carta do banco para o criador ----
  const [dragOver, setDragOver] = useState(false)

  const handleLibDragStart = (card) => (e) => {
    try {
      e.dataTransfer.setData('text/ygo-card-id', String(card.id))
      e.dataTransfer.effectAllowed = 'copy'
    } catch {
      /* navegadores podem bloquear */
    }
  }

  const findDbCard = (id) => cards.find((c) => String(c.id) === String(id))

  const addDbCardToDeck = (card) => {
    const s = stateFromDbCard(card)
    setDeckCards((prev) => [...prev, { id: newDeckCardId(), state: s }])
    setToast(`${s.name || 'Carta'} adicionada ao deck`)
  }

  const handleCreatorDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const id = e.dataTransfer.getData('text/ygo-card-id')
    if (!id) return
    const card = findDbCard(id)
    if (card) addDbCardToDeck(card)
    else setToast('Carta não encontrada no banco')
  }

  const deckFilename = () => (deckName.trim() || 'deck-yugidex').replace(/[^\w-]+/g, '_')

  const exportDeckPdf = () => {
    if (!deckCards.length) {
      setToast('Deck vazio')
      return
    }
    const safe = deckFilename()
    generateFromStates(
      deckCards.map((c, i) => ({ id: `dc${i}`, state: c.state })),
      `${safe}.pdf`,
    )
  }

  const CREATED_EXTRA_TYPES = ['fusion', 'synchro', 'dark-synchro', 'xyz', 'link']

  const cardTypeLabel = (s) => (CARD_TYPES.find((t) => t.value === s.type) || {}).label || s.type || ''
  const attributeLabel = (s) =>
    (ATTRIBUTES.find((a) => a.value === s.attribute) || {}).label || s.attribute || ''

  const escapeJsonArt = (state) => (state.art && /^https?:/i.test(state.art) ? state.art : '')

  const buildCreatedDeckTxt = () => {
    if (!deckCards.length) return ''
    const name = deckName.trim() || `Deck ${customDecks.length + 1}`

    const counts = {}
    deckCards.forEach((c) => {
      const t = c.state.type || 'outros'
      counts[t] = (counts[t] || 0) + 1
    })

    let content = `========================================\n`
    content += `       INFORMAÇÕES DO DECK: ${name.toUpperCase()}\n`
    content += `========================================\n\n`
    content += `NOME DO DECK: ${name}\n`
    content += `DATA DE EXPORTAÇÃO: ${new Date().toLocaleString('pt-BR')}\n`
    content += `TOTAL DE CARTAS: ${deckCards.length}\n\n`

    content += `========================================\n`
    content += `           CARTAS DO DECK\n`
    content += `========================================\n\n`

    deckCards.forEach((dc, i) => {
      const s = dc.state || {}
      content += `${i + 1}. ${s.name || 'Sem nome'}\n`

      const details = []
      details.push(`   TIPO DE CARTA: ${cardTypeLabel(s)}`)
      if (s.monsterType) details.push(`   TIPO/RAÇA: ${s.monsterType}`)
      if (s.attribute) details.push(`   ATRIBUTO: ${attributeLabel(s)}`)
      if (!SPELL_TRAP_TYPES.includes(s.type) && s.level !== undefined && s.level !== '') {
        details.push(`   NÍVEL: ${s.level}`)
      }
      if (s.atk !== undefined && s.atk !== '') details.push(`   ATK: ${s.atk}`)
      if (s.def !== undefined && s.def !== '') details.push(`   DEF: ${s.def}`)
      if (s.pendulum) details.push(`   PÊNDULO: Escala Azul ${s.scaleBlue} / Escala Vermelha ${s.scaleRed}`)
      if (s.effect) details.push(`   EFEITO: ${s.effect}`)
      if (s.pendulumEffect) details.push(`   EFEITO DO PÊNDULO: ${s.pendulumEffect}`)
      const art = escapeJsonArt(s)
      if (art) details.push(`   IMAGEM DA CARTA: ${art}`)
      if (s.set) details.push(`   SET: ${s.set}`)
      if (s.serial) details.push(`   SERIAL: ${s.serial}`)
      if (s.edition) details.push(`   EDIÇÃO: ${s.edition}`)
      if (s.year) details.push(`   ANO: ${s.year}`)
      if (s.creator) details.push(`   CRIADOR: ${s.creator}`)
      content += `${details.join('\n')}\n\n`
    })

    content += `========================================\n`
    content += `           RESUMO DO DECK\n`
    content += `========================================\n\n`
    content += `TOTAL DE CARTAS: ${deckCards.length}\n\n`
    const known = new Set(CARD_TYPES.map((t) => t.value))
    CARD_TYPES.forEach((t) => {
      if (counts[t.value]) content += `${t.label}: ${counts[t.value]}\n`
    })
    Object.keys(counts).forEach((k) => {
      if (!known.has(k)) content += `${k}: ${counts[k]}\n`
    })

    content += `\n========================================\n`
    content += `       FIM DA EXPORTAÇÃO\n`
    content += `========================================\n`
    return content
  }

  const downloadBlob = (content, type, filename) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCreatedDeckTxt = () => {
    const content = buildCreatedDeckTxt()
    if (!content) {
      setToast('Adicione cartas ao deck primeiro')
      return
    }
    downloadBlob(content, 'text/plain;charset=utf-8', `${deckFilename()}.txt`)
    setToast('Deck salvo em .txt')
  }

  const exportCreatedDeckJson = () => {
    if (!deckCards.length) {
      setToast('Adicione cartas ao deck primeiro')
      return
    }
    const name = deckName.trim() || `Deck ${customDecks.length + 1}`
    const main = []
    const extra = []
    deckCards.forEach((dc) => {
      const s = dc.state || {}
      const item = { id: dc.id, qty: 1, name: s.name || '', state: s }
      if (CREATED_EXTRA_TYPES.includes(s.type)) extra.push(item)
      else main.push(item)
    })
    const deckData = {
      name,
      type: 'custom',
      exportedAt: new Date().toISOString(),
      count: deckCards.length,
      main,
      extra,
      side: [],
    }
    downloadBlob(JSON.stringify(deckData, null, 2), 'application/json', `${deckFilename()}.json`)
    setToast('Deck salvo em .json')
  }

  // ---- Importar deck salvo (.txt / .json) ----
  // Le o arquivo como texto UTF-8.
  const readFileText = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file, 'utf-8')
    })

  // Converte um rotulo salvo (ex.: "Monstro de Efeito") de volta para o valor.
  const valueFromLabel = (list, label) => {
    const norm = String(label || '').trim().toLowerCase()
    const hit = list.find(
      (o) => String(o.label).toLowerCase() === norm || String(o.value).toLowerCase() === norm,
    )
    return hit ? hit.value : ''
  }

  const TXT_FIELD_BY_LABEL = {
    'TIPO DE CARTA': 'type',
    'TIPO/RAÇA': 'monsterType',
    'ATRIBUTO': 'attribute',
    'NÍVEL': 'level',
    'ATK': 'atk',
    'DEF': 'def',
    'PÊNDULO': 'pendulum',
    'EFEITO': 'effect',
    'EFEITO DO PÊNDULO': 'pendulumEffect',
    'IMAGEM DA CARTA': 'art',
    'SET': 'set',
    'SERIAL': 'serial',
    'EDIÇÃO': 'edition',
    'ANO': 'year',
    'CRIADOR': 'creator',
  }

  // Le o .txt gerado por "Salvar .txt" e reconstroi os estados das cartas.
  const parseDeckTxt = (text) => {
    const lines = String(text || '').split(/\r?\n/)
    let name = ''
    const cards = []
    let current = null
    let lastField = null

    lines.forEach((line) => {
      const nameMatch = line.match(/^\s*NOME DO DECK:\s*(.*)$/i)
      if (nameMatch) {
        name = nameMatch[1].trim()
        return
      }
      const numMatch = line.match(/^\s*\d+\.\s+(.*)$/)
      if (numMatch) {
        current = { name: numMatch[1].trim(), fields: [] }
        cards.push(current)
        lastField = null
        return
      }
      if (!current) return
      if (line.trim() === '') {
        lastField = null
        return
      }
      const keyMatch = line.match(/^\s{2,}([^:]+):\s?(.*)$/)
      if (keyMatch) {
        const key = TXT_FIELD_BY_LABEL[keyMatch[1].trim().toUpperCase()]
        if (key) {
          lastField = { key, value: keyMatch[2] }
          current.fields.push(lastField)
          return
        }
      }
      // Linha sem rotulo: continua o valor anterior (ex.: efeito multilinha).
      if (lastField) lastField.value += `\n${line}`
    })

    const states = cards.map((card) => {
      const s = { name: card.name }
      card.fields.forEach(({ key, value }) => {
        switch (key) {
          case 'type':
            s.type = valueFromLabel(CARD_TYPES, value) || s.type
            break
          case 'attribute':
            s.attribute = valueFromLabel(ATTRIBUTES, value) || s.attribute
            break
          case 'level':
            s.level = Number(value) || 0
            break
          case 'pendulum': {
            const m = value.match(/azul\s+(\d+)\D+vermelha\s+(\d+)/i)
            if (m) {
              s.pendulum = true
              s.scaleBlue = Number(m[1])
              s.scaleRed = Number(m[2])
            }
            break
          }
          default:
            s[key] = value
        }
      })
      return s
    })

    return { name, states }
  }

  // Le o .json gerado por "Salvar .json" e reconstroi os estados das cartas.
  const parseDeckJson = (text) => {
    const data = JSON.parse(text)
    const list = []
    ;['main', 'extra', 'side'].forEach((k) => {
      if (Array.isArray(data[k])) list.push(...data[k])
    })
    const source = list.length ? list : Array.isArray(data) ? data : []
    const states = source
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        if (item.state && typeof item.state === 'object') return item.state
        if (item.type || item.name || item.effect) return item
        return null
      })
      .filter(Boolean)
    return { name: data.name || '', states }
  }

  const applyImportedDeck = (name, states) => {
    if (!states.length) {
      setToast('Nenhuma carta encontrada no arquivo')
      return
    }
    setDeckName(name || '')
    setCurrentDeckId(null)
    setDeckCards(
      states.map((s) => ({ id: newDeckCardId(), state: { ...defaultCardState(), ...s } })),
    )
    setToast(`${states.length} carta(s) importada(s)`)
  }

  const handleImportDeckTxt = async (file) => {
    if (!file) return
    try {
      const text = await readFileText(file)
      const { name, states } = parseDeckTxt(text)
      applyImportedDeck(name, states)
    } catch (e) {
      console.error('Falha ao importar .txt:', e)
      setToast('Não foi possível ler o arquivo .txt')
    }
  }

  const handleImportDeckJson = async (file) => {
    if (!file) return
    try {
      const text = await readFileText(file)
      const { name, states } = parseDeckJson(text)
      applyImportedDeck(name, states)
    } catch (e) {
      console.error('Falha ao importar .json:', e)
      setToast('Arquivo .json inválido')
    }
  }

  const importDeckTxt = () => deckTxtInputRef.current?.click()
  const importDeckJson = () => deckJsonInputRef.current?.click()

  const filteredSaved = useMemo(() => {
    const q = savedSearch.trim().toLowerCase()
    if (!q) return saved
    return saved.filter((c) => c.name.toLowerCase().includes(q))
  }, [saved, savedSearch])



  const filteredDb = useMemo(() => {
    const q = normalizeText(dbSearch)
    if (!q) return cards
    return cards.filter((c) => (c._normalizedNames || '').includes(q))
  }, [cards, dbSearch])

  const dbTotalPages = Math.max(1, Math.ceil(filteredDb.length / DB_PER_PAGE))
  const dbPageCards = useMemo(
    () => filteredDb.slice((dbPage - 1) * DB_PER_PAGE, dbPage * DB_PER_PAGE),
    [filteredDb, dbPage],
  )

  const toggleArrow = (id) => {
    setState((s) => {
      const arrows = { ...s.linkArrows }
      if (arrows[id]) delete arrows[id]
      else arrows[id] = true
      return { ...s, linkArrows: arrows }
    })
  }

  return (
    <div className="cm-page">
      <div className="cm-toolbar">
        <div className="cm-toolbar-title">
          <h2>Criador de Cartas</h2>
          <p>Monte sua carta de Yu-Gi-Oh personalizada</p>
        </div>
        <div className="cm-toolbar-actions">
          <div className="cm-mode-toggle">
            <button
              type="button"
              className={mode === 'editor' ? 'active' : ''}
              onClick={() => setMode('editor')}
            >
              Editor
            </button>
      <button
        type="button"
        className={mode === 'deck' ? 'active' : ''}
        onClick={() => setMode('deck')}
      >
        Deck Criado
      </button>
          </div>

          {mode === 'editor' && (
            <>
              <div className="cm-combo">
                <input
                  type="text"
                  placeholder="Buscar minhas cartas..."
                  value={savedSearch}
                  onChange={(e) => {
                    setSavedSearch(e.target.value)
                    setListOpen(true)
                  }}
                  onFocus={() => setListOpen(true)}
                  onBlur={() => setTimeout(() => setListOpen(false), 150)}
                />
                {listOpen && (
                  <div className="cm-combo-list">
                    {filteredSaved.length === 0 && <div className="cm-combo-empty">Nenhuma carta salva</div>}
                    {filteredSaved.map((c) => (
                      <div key={c.id} className="cm-combo-item" onMouseDown={() => handleLoad(c)}>
                        <span className="cm-combo-name">{c.name}</span>
                        <button
                          type="button"
                          className="cm-combo-del"
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            handleDelete(c.id)
                          }}
                          title="Excluir"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" className="cm-btn primary" onClick={handleSave}>
                Salvar
              </button>
              <button type="button" className="cm-btn ghost" onClick={handleNew}>
                Nova
              </button>
            </>
          )}
        </div>
      </div>

      {mode === 'editor' && (
      <div className="cm-layout">
        <section className="cm-preview" ref={previewRef}>
          <div className="cm-preview-inner">
            <YugiohCardPreview state={state} width={previewWidth} innerRef={cardRef} />
          </div>
          <div className="cm-preview-actions">
            <button type="button" className="cm-btn primary" onClick={handleDownload} disabled={busy}>
              {busy ? 'Gerando...' : 'Baixar PNG'}
            </button>
            <button type="button" className="cm-btn ghost" onClick={handleSinglePdf} disabled={busy}>
              PDF A4 (esta carta)
            </button>
            <button type="button" className="cm-btn ghost" onClick={handleShare}>
              Link de compartilhamento
            </button>
          </div>
        </section>

        <aside className="cm-form">
          <fieldset className="cm-group">
            <legend>Tipo &amp; Atributo</legend>
            <label className="cm-field">
              <span>Tipo de carta</span>
              <select value={state.type} onChange={(e) => handleTypeChange(e.target.value)}>
                {CARD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            {!isTrapSpell && (
              <label className="cm-field">
                <span>Atributo</span>
                <select value={state.type === 'spell' || state.type === 'trap' ? state.type : state.attribute} onChange={(e) => update({ attribute: e.target.value })} disabled={state.type === 'spell' || state.type === 'trap'}>
                  {ATTRIBUTES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {isTrapSpell && (
              <label className="cm-field">
                <span>Subtipo (ícone)</span>
                <select value={state.spellTrapIcon} onChange={(e) => update({ spellTrapIcon: e.target.value })}>
                  {SPELL_TRAP_ICONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="cm-field">
              <span>Raridade</span>
              <select value={state.rarity} onChange={(e) => update({ rarity: e.target.value })}>
                {RARITIES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>

            {canPendulum && (
              <label className="cm-check">
                <input type="checkbox" checked={!!state.pendulum} onChange={(e) => update({ pendulum: e.target.checked })} />
                <span>Monstro Pêndulo</span>
              </label>
            )}
          </fieldset>

          <fieldset className="cm-group">
            <legend>Conteúdo</legend>
            <label className="cm-field">
              <span>Nome</span>
              <input type="text" value={state.name} maxLength={3060} onChange={(e) => update({ name: e.target.value })} placeholder="Ex: Dragão Negro de Olhos Vermelhos" />
            </label>

            <label className="cm-field">
              <span>Tamanho da fonte do nome (px)</span>
              <input
                type="number"
                min="8"
                max="120"
                step="1"
                list="cm-size-presets"
                value={state.nameSize ?? 65}
                onChange={(e) => update({ nameSize: clampSize(e.target.value, 8, 120, 65) })}
              />
            </label>

            {!isTrapSpell && (
              <label className="cm-field">
                <span>Tipo do monstro (raça)</span>
                <input type="text" value={state.monsterType} onChange={(e) => update({ monsterType: e.target.value })} placeholder="Ex: Dragon / Effect" />
              </label>
            )}

            <label className="cm-field">
              <span>{isTrapSpell ? 'Efeito da carta' : 'Texto de efeito / lore'}</span>
              <textarea rows={5} value={state.effect} onChange={(e) => update({ effect: e.target.value })} placeholder="Descreva o efeito..." />
            </label>

            <label className="cm-field">
              <span>Tamanho da fonte do efeito (px)</span>
              <input
                type="number"
                min="6"
                max="60"
                step="1"
                list="cm-size-presets"
                value={state.effectSize ?? 24}
                onChange={(e) => update({ effectSize: clampSize(e.target.value, 6, 60, 24) })}
              />
            </label>

            {canPendulum && state.pendulum && (
              <label className="cm-field">
                <span>Efeito Pêndulo</span>
                <textarea rows={3} value={state.pendulumEffect} onChange={(e) => update({ pendulumEffect: e.target.value })} />
              </label>
            )}
          </fieldset>

          {!isTrapSpell && (
            <fieldset className="cm-group">
              <legend>{state.type === 'xyz' ? 'Rank & Status' : 'Nível & Status'}</legend>
              <label className="cm-field">
                <span>{state.type === 'xyz' ? 'Rank (estrelas)' : 'Nível (estrelas)'}</span>
                <select value={state.level} onChange={(e) => update({ level: Number(e.target.value) })}>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>

              {state.type !== 'link' && (
                <div className="cm-row">
                  <label className="cm-field">
                    <span>ATK</span>
                    <input type="text" inputMode="numeric" maxLength={3005} value={state.atk} onChange={(e) => update({ atk: e.target.value })} placeholder="0" />
                  </label>
                  <label className="cm-field">
                    <span>DEF</span>
                    <input type="text" inputMode="numeric" maxLength={3005} value={state.def} onChange={(e) => update({ def: e.target.value })} placeholder="0" />
                  </label>
                </div>
              )}

              {state.type === 'link' && (
                <div className="cm-field">
                  <span>Setas de Link</span>
                  <div className="cm-arrows">
                    {LINK_ARROWS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        className={`cm-arrow ${state.linkArrows?.[a.id] ? 'on' : ''}`}
                        onClick={() => toggleArrow(a.id)}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {canPendulum && state.pendulum && (
                <div className="cm-row">
                  <label className="cm-field">
                    <span>Escala Azul</span>
                    <input type="text" maxLength={3002} value={state.scaleBlue} onChange={(e) => update({ scaleBlue: e.target.value })} />
                  </label>
                  <label className="cm-field">
                    <span>Escala Vermelha</span>
                    <input type="text" maxLength={3002} value={state.scaleRed} onChange={(e) => update({ scaleRed: e.target.value })} />
                  </label>
                </div>
              )}
            </fieldset>
          )}

          <fieldset className="cm-group">
            <legend>Arte</legend>
            <label className="cm-field">
              <span>Enviar imagem (PNG/JPG)</span>
              <input type="file" accept="image/*" onChange={(e) => handleArtFile(e.target.files?.[0])} />
            </label>
            <label className="cm-field">
              <span>Ou URL da imagem</span>
              <input type="url" value={state.art?.startsWith('data:') ? '' : state.art} onChange={(e) => update({ art: e.target.value })} placeholder="https://..." />
            </label>
            {state.art && (
              <button type="button" className="cm-btn ghost small" onClick={() => update({ art: '' })}>
                Remover arte
              </button>
            )}
          </fieldset>

          <fieldset className="cm-group">
            <legend>Dados de coleção</legend>
            <div className="cm-row">
              <label className="cm-field">
                <span>Código do set</span>
                <input type="text" maxLength={3012} value={state.set} onChange={(e) => update({ set: e.target.value })} placeholder="YGIDX-EN001" />
              </label>
              <label className="cm-field">
                <span>Serial #</span>
                <input type="text" maxLength={3008} value={state.serial} onChange={(e) => update({ serial: e.target.value })} placeholder="00000000" />
              </label>
            </div>
            <div className="cm-row">
              <label className="cm-field">
                <span>Edição</span>
                <input type="text" maxLength={3020} value={state.edition} onChange={(e) => update({ edition: e.target.value })} placeholder="1st Edition" />
              </label>
              <label className="cm-field">
                <span>Ano</span>
                <input type="text" maxLength={3004} value={state.year} onChange={(e) => update({ year: e.target.value })} />
              </label>
            </div>
            <label className="cm-field">
              <span>Criador</span>
              <input type="text" maxLength={3030} value={state.creator} onChange={(e) => update({ creator: e.target.value })} placeholder="Seu nome" />
            </label>
            <label className="cm-field">
              <span>Rodapé</span>
              <input type="text" maxLength={3060} value={state.footer} onChange={(e) => update({ footer: e.target.value })} />
            </label>
          </fieldset>
        </aside>
      </div>
      )}

      {mode === 'deck' && (
        <div className="cdm-layout">
          <section
            className={`cdm-deck ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => {
              if (!e.dataTransfer.types.includes('text/ygo-card-id')) return
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget)) return
              setDragOver(false)
            }}
            onDrop={handleCreatorDrop}
          >
            <input
              ref={deckTxtInputRef}
              type="file"
              accept=".txt,text/plain"
              style={{ display: 'none' }}
              onChange={(e) => {
                handleImportDeckTxt(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <input
              ref={deckJsonInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                handleImportDeckJson(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <div className="cdm-deck-head">
              <input
                type="text"
                className="cdm-deck-name"
                placeholder="Nome do deck"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
              />
              <button type="button" className="cm-btn primary" onClick={saveCustomDeck}>
                Salvar deck
              </button>
              <button type="button" className="cm-btn ghost" onClick={newCustomDeck}>
                Novo
              </button>
            </div>

            <div className="cdm-deck-bar">
              <span>
                {deckCards.length} carta(s) • {Math.max(1, Math.ceil(deckCards.length / DECK_PER_PAGE))} folha(s) A4
              </span>
              <div className="cdm-deck-bar-actions">
                <span className="cdm-drag-hint">Arraste uma carta do banco para o deck</span>
                <div className="cdm-deck-group">
                  <button type="button" className="cm-btn ghost small" onClick={addCurrentToDeck}>
                    + Carta atual
                  </button>
                  <button type="button" className="cm-btn ghost small" onClick={clearDeckCards} disabled={!deckCards.length}>
                    Limpar
                  </button>
                </div>
                <div className="cdm-deck-group">
                  <button type="button" className="cm-btn ghost small" onClick={exportCreatedDeckTxt} disabled={!deckCards.length}>
                    Salvar .txt
                  </button>
                  <button type="button" className="cm-btn ghost small" onClick={exportCreatedDeckJson} disabled={!deckCards.length}>
                    Salvar .json
                  </button>
                  <button type="button" className="cm-btn primary small" onClick={exportDeckPdf} disabled={busy || !deckCards.length} style={{ fontWeight: '700', boxShadow: '0 0 0 2px rgba(229, 191, 53, 0.4)' }}>
                    {busy ? 'Gerando...' : 'Salvar deck em PDF (A4)'}
                  </button>
                </div>
                <div className="cdm-deck-group">
                  <button type="button" className="cm-btn ghost small" onClick={importDeckTxt}>
                    Importar .txt
                  </button>
                  <button type="button" className="cm-btn ghost small" onClick={importDeckJson}>
                    Importar .json
                  </button>
                </div>
              </div>
            </div>

            {deckCards.length === 0 ? (
              <p className="cdm-empty">Deck vazio. Adicione cartas criadas pela biblioteca ao lado ou clique em “+ Carta atual”.</p>
            ) : (
              <div className="cdm-grid">
                {deckCards.map((dc) => (
                  <div key={dc.id} className="cdm-card">
                    <YugiohCardPreview state={dc.state} width={170} />
                    <div className="cdm-card-name">{dc.state.name || 'Sem nome'}</div>
                    <div className="cdm-card-actions">
                      <button type="button" className="cm-btn ghost small" onClick={() => editDeckCard(dc)}>
                        Editar
                      </button>
                      <button type="button" className="cm-btn ghost small danger" onClick={() => removeDeckCard(dc.id)}>
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {customDecks.length > 0 && (
              <div className="cdm-saved">
                <h4>Decks salvos</h4>
                <div className="cdm-saved-list">
                  {customDecks.map((d) => (
                    <div key={d.id} className={`cdm-saved-item ${currentDeckId === d.id ? 'active' : ''}`}>
                      <button type="button" className="cdm-saved-name" onClick={() => loadCustomDeck(d)}>
                        {d.name} <span>({d.cards?.length || 0})</span>
                      </button>
                      <button type="button" className="cm-combo-del" onClick={() => deleteCustomDeck(d.id)} title="Excluir">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="cdm-library">
            <div className="cdm-lib-tabs">
              <button
                type="button"
                className={libTab === 'db' ? 'active' : ''}
                onClick={() => setLibTab('db')}
              >
                Banco de cartas
              </button>
              <button
                type="button"
                className={libTab === 'mine' ? 'active' : ''}
                onClick={() => setLibTab('mine')}
              >
                Minhas cartas ({saved.length})
              </button>
            </div>

            {libTab === 'db' ? (
              <>
                <input
                  type="text"
                  className="cdm-search"
                  placeholder="Buscar carta no banco..."
                  value={dbSearch}
                  onChange={(e) => {
                    setDbSearch(e.target.value)
                    setDbPage(1)
                  }}
                />
                <p className="cdm-lib-info">{filteredDb.length} carta(s) • clique para editar</p>
                <div className="cdm-lib-grid">
                  {dbPageCards.map((card) => {
                    const img = getCardImage(card)
                    const nm = card._ptName || card.text?.pt?.name || card.text?.en?.name || ''
                    return (
                      <button
                        key={card.id}
                        type="button"
                        className="cdm-lib-card"
                        draggable
                        onDragStart={handleLibDragStart(card)}
                        onDragEnd={() => setDragOver(false)}
                        onClick={() => importDbCard(card)}
                        title={`Editar: ${nm}`}
                      >
                        {img ? <img src={img} alt={nm} loading="lazy" /> : <div className="cdm-lib-noimg">{nm.slice(0, 12)}</div>}
                        <span>{nm}</span>
                      </button>
                    )
                  })}
                </div>
                {dbTotalPages > 1 && (
                  <div className="cdm-pagination">
                    <button type="button" className="cm-btn ghost small" disabled={dbPage <= 1} onClick={() => setDbPage((p) => p - 1)}>
                      ‹
                    </button>
                    <span>
                      {dbPage}/{dbTotalPages}
                    </span>
                    <button
                      type="button"
                      className="cm-btn ghost small"
                      disabled={dbPage >= dbTotalPages}
                      onClick={() => setDbPage((p) => p + 1)}
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            ) : saved.length === 0 ? (
              <p className="cdm-empty">Nenhuma carta criada ainda. Crie e salve cartas no Editor.</p>
            ) : (
              <div className="cdm-lib-grid">
                {saved.map((entry) => (
                  <div key={entry.id} className="cdm-saved-card">
                    <button type="button" className="cdm-lib-card" onClick={() => addSavedToDeck(entry)} title={`Adicionar ${entry.name} ao deck`}>
                      <YugiohCardPreview state={entry.state} width={110} />
                      <span>{entry.name}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Palco oculto: renderiza as cartas em tamanho real para captura */}
      {printCards && (
        <div className="cm-print-stage" aria-hidden="true">
          {printCards.cards.map((c, i) => (
            <YugiohCardPreview
              key={c.id}
              state={c.state}
              width={CARD_W}
              innerRef={(el) => {
                printRefs.current[i] = el
              }}
            />
          ))}
        </div>
      )}

      <datalist id="cm-size-presets">
        <option value="6"></option>
        <option value="8"></option>
        <option value="10"></option>
        <option value="12"></option>
        <option value="14"></option>
        <option value="16"></option>
        <option value="18"></option>
        <option value="20"></option>
        <option value="22"></option>
        <option value="24"></option>
        <option value="26"></option>
        <option value="28"></option>
        <option value="30"></option>
        <option value="32"></option>
        <option value="34"></option>
        <option value="36"></option>
        <option value="40"></option>
        <option value="45"></option>
        <option value="50"></option>
        <option value="55"></option>
        <option value="60"></option>
        <option value="65"></option>
        <option value="70"></option>
        <option value="75"></option>
        <option value="80"></option>
        <option value="90"></option>
        <option value="100"></option>
        <option value="110"></option>
        <option value="120"></option>
      </datalist>

      {toast && <div className="cm-toast">{toast}</div>}
    </div>
  )
}
