import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { toPng } from 'html-to-image'
import YugiohCardPreview from './YugiohCardPreview'
import {
  CARD_TYPES,
  ATTRIBUTES,
  SPELL_TRAP_ICONS,
  spellTrapIconsFor,
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
  dbCardCategory,
  editionLabel,
  isWhiteName,
} from './cardMakerData'
import { loadPrintings, printingsForCard, defaultPrinting, regionLabel } from './printingsData'
import { getCardImage, normalizeText } from './cardUtils'
import { buildDeckPdf } from './deckPdf'
import './CardMakerPage.css'

const STORAGE_KEY = 'ygoCustomCards'
const DECKS_KEY = 'ygoCustomDecks'
const DECK_VIEW_KEY = 'ygoCustomDeckView'
// Rascunho automatico do editor: guarda o trabalho em andamento (carta +
// deck) e expira apos 30 dias sem uso, avisando o usuario nas ultimas 48h.
const DRAFT_KEY = 'ygoCardMakerDraft'
const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 dias
const DRAFT_WARN_MS = 48 * 60 * 60 * 1000 // aviso quando restam < 48h
const DB_PER_PAGE = 40

// ---- Preferencias de exibicao do "Deck Criado" ----
const DECK_VIEW_DEFAULTS = {
  cardSize: 'auto', // auto | sm | md | lg | xl
  cols: '4', // auto | 1 | 2 | 3 | 4  (4 colunas por padrao: tamanho ja ajustado)
  gap: 'normal', // compact | normal | wide
  groupRepeated: false,
  showName: true,
  showActions: true,
  showNumber: false,
  sort: 'added', // added | name | type | level | atk
}

const DECK_CARD_SIZES = { sm: 190, md: 260, lg: 340, xl: 421 }
const DECK_GAPS = { compact: 10, normal: 18, wide: 30 }

// Calcula largura/colunas da grade do deck a partir da largura disponivel e das
// preferencias escolhidas (tamanho fixo, numero de colunas ou automatico).
function computeDeckLayout(containerW, view) {
  const w = Math.max(240, Math.floor(containerW || 756))
  const gap = DECK_GAPS[view?.gap] ?? DECK_GAPS.normal
  const MAX = 421
  const MIN = 130
  let cols

  const explicitCols = view?.cols && view.cols !== 'auto' ? Number(view.cols) : 0
  const preset = view?.cardSize && view.cardSize !== 'auto' ? DECK_CARD_SIZES[view.cardSize] : 0

  if (explicitCols > 0) {
    cols = Math.max(1, Math.min(4, explicitCols))
  } else if (preset) {
    cols = Math.max(1, Math.min(4, Math.floor((w + gap) / (preset + gap))))
  } else {
    const MIN_CARD = 300
    cols = 1
    for (let c = 2; c <= 3; c++) {
      if (Math.floor((w - gap * (c - 1)) / c) >= MIN_CARD) cols = c
    }
  }

  // Em telas estreitas reduz as colunas para nao estourar a largura.
  const maxCols = Math.max(1, Math.floor((w + gap) / (MIN + gap)))
  cols = Math.max(1, Math.min(cols, maxCols))

  let cardW = Math.floor((w - gap * (cols - 1)) / cols)
  if (preset && !explicitCols) cardW = Math.min(cardW, preset)
  cardW = Math.max(MIN, Math.min(MAX, cardW))
  return { cardWidth: cardW, cols, gap }
}

// Chips de filtro por tipo de carta (no estilo do filtro do Master Duel).
const DECK_FILTER_CHIPS = [
  { value: 'monster', label: 'Monstros', test: (s) => !SPELL_TRAP_TYPES.includes(s.type) && s.type !== 'token' },
  { value: 'normal', label: 'Normais', test: (s) => s.type === 'normal' },
  { value: 'effect', label: 'Efeito', test: (s) => s.type === 'effect' },
  { value: 'ritual', label: 'Ritual', test: (s) => s.type === 'ritual' },
  { value: 'fusion', label: 'Fusão', test: (s) => s.type === 'fusion' },
  { value: 'synchro', label: 'Synchro', test: (s) => s.type === 'synchro' || s.type === 'dark-synchro' },
  { value: 'xyz', label: 'Xyz', test: (s) => s.type === 'xyz' },
  { value: 'link', label: 'Link', test: (s) => s.type === 'link' },
  { value: 'pendulum', label: 'Pêndulo', test: (s) => !!s.pendulum },
  { value: 'spell', label: 'Magias', test: (s) => s.type === 'spell' },
  { value: 'trap', label: 'Armadilhas', test: (s) => s.type === 'trap' },
  { value: 'token', label: 'Token', test: (s) => s.type === 'token' },
]

// Chips de filtro para o "Banco de cartas" (pool), no estilo do Master Duel.
const DB_FILTER_CHIPS = [
  { value: 'monster', label: 'Monstros', test: (c) => !['spell', 'trap'].includes(dbCardCategory(c)) },
  { value: 'normal', label: 'Normais', test: (c) => dbCardCategory(c) === 'normal' },
  { value: 'effect', label: 'Efeito', test: (c) => dbCardCategory(c) === 'effect' },
  { value: 'ritual', label: 'Ritual', test: (c) => dbCardCategory(c) === 'ritual' },
  { value: 'fusion', label: 'Fusão', test: (c) => dbCardCategory(c) === 'fusion' },
  { value: 'synchro', label: 'Synchro', test: (c) => dbCardCategory(c) === 'synchro' },
  { value: 'xyz', label: 'Xyz', test: (c) => dbCardCategory(c) === 'xyz' },
  { value: 'link', label: 'Link', test: (c) => dbCardCategory(c) === 'link' },
  { value: 'spell', label: 'Magias', test: (c) => dbCardCategory(c) === 'spell' },
  { value: 'trap', label: 'Armadilhas', test: (c) => dbCardCategory(c) === 'trap' },
]

// Chave estavel para agrupar cartas repetidas (mesmo conteudo = mesma chave).
const deckStateKey = (s) => {  if (!s) return ''
  try {
    return JSON.stringify(s)
  } catch {
    return String(Math.random())
  }
}

function loadDeckView() {
  try {
    const raw = localStorage.getItem(DECK_VIEW_KEY)
    return raw ? { ...DECK_VIEW_DEFAULTS, ...JSON.parse(raw) } : { ...DECK_VIEW_DEFAULTS }
  } catch {
    return { ...DECK_VIEW_DEFAULTS }
  }
}

// base64 seguro para unicode
const b64encode = (str) => btoa(unescape(encodeURIComponent(str)))
const b64decode = (str) => decodeURIComponent(escape(atob(str)))

// ---- Formatacao do texto do efeito ----
// Remove emojis/pictogramas/simbolos quando "Permitir símbolos" esta desligado.
const EFFECT_SYMBOL_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{25A0}-\u{25FF}]/gu
const stripEffectSymbols = (s) => String(s || '').replace(EFFECT_SYMBOL_RE, '')
// Aplica as regras de formato (simbolos/limite de caracteres) ao texto digitado.
const applyEffectRules = (value, s) => {
  let v = String(value ?? '')
  if (s.effectAllowSymbols === false) v = stripEffectSymbols(v)
  if (s.effectLimitEnabled) {
    const lim = Number(s.effectLimit) > 0 ? Math.floor(Number(s.effectLimit)) : 300
    if (v.length > lim) v = v.slice(0, lim)
  }
  return v
}

const formatDeckDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR')
}

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

// Grava no localStorage sem deixar estourar a cota (~5MB): se o valor nao
// couber, tenta de novo sem as artes em base64 (data:) e, se ainda assim
// falhar, apenas ignora (o aviso e feito pelo chamador).
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    try {
      const stripped = JSON.parse(value)
      const strip = (s) => {
        if (Array.isArray(s)) return s.map(strip)
        if (s && typeof s === 'object') {
          const o = { ...s }
          if (typeof o.art === 'string' && o.art.startsWith('data:')) o.art = ''
          if (Array.isArray(o.cards)) o.cards = o.cards.map(strip)
          if (o.state && typeof o.state === 'object') o.state = strip(o.state)
          return o
        }
        return s
      }
      localStorage.setItem(key, JSON.stringify(strip(stripped)))
      return 'stripped'
    } catch {
      return false
    }
  }
}

// Reduz a imagem no upload para caber no localStorage: max 1024px no maior
// lado, JPEG 0.85 (PNG vira JPEG, menos ~80% do tamanho). Imagens de celular
// costumam ter 10-40MB em base64 e quebravam o salvamento + travavam a UI.
const MAX_ART_DIM = 1024
function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      const img = new Image()
      img.onerror = () => reject(new Error('imagem invalida'))
      img.onload = () => {
        try {
          const w = img.naturalWidth || img.width
          const h = img.naturalHeight || img.height
          if (!w || !h) {
            resolve(dataUrl)
            return
          }
          const scale = Math.min(1, MAX_ART_DIM / Math.max(w, h))
          if (scale === 1 && dataUrl.length < 400_000) {
            resolve(dataUrl)
            return
          }
          const canvas = document.createElement('canvas')
          canvas.width = Math.max(1, Math.round(w * scale))
          canvas.height = Math.max(1, Math.round(h * scale))
          const ctx = canvas.getContext('2d')
          ctx.fillStyle = '#000'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', 0.85))
        } catch {
          resolve(dataUrl)
        }
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  })
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const d = JSON.parse(raw)
    if (!d || !d.savedAt) return null
    if (Date.now() - d.savedAt > DRAFT_TTL_MS) {
      localStorage.removeItem(DRAFT_KEY)
      return null
    }
    return d
  } catch {
    return null
  }
}

const draftRemainingLabel = (ms) => {
  if (ms <= 0) return 'expirado'
  const mins = Math.max(1, Math.floor(ms / 60000))
  const days = Math.floor(mins / 1440)
  const hours = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${m}min`
  return `${m}min`
}

export default function CardMakerPage({ cards = [] }) {
  // Rascunho carregado uma unica vez; usado para restaurar o trabalho na
  // abertura da pagina (o link #c= tem prioridade sobre o rascunho).
  const [initialDraft] = useState(loadDraft)
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
    if (initialDraft?.state) return { ...base, ...initialDraft.state }
    return base
  })
  const [saved, setSaved] = useState(loadSaved)
  const [currentId, setCurrentId] = useState(() => initialDraft?.currentId ?? null)
  const [savedSearch, setSavedSearch] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [previewWidth, setPreviewWidth] = useState(421)
  const [printCards, setPrintCards] = useState(null)
  const [deckContainerW, setDeckContainerW] = useState(756)
  const cardRef = useRef(null)
  const previewRef = useRef(null)
  const deckSectionRef = useRef(null)
  const printRefs = useRef([])
  const deckTxtInputRef = useRef(null)
  const deckJsonInputRef = useRef(null)

  // ---- Montador de deck (cartas criadas) ----
  const [mode, setMode] = useState(() => initialDraft?.mode || 'editor')
  const [customDecks, setCustomDecks] = useState(loadDecks)
  const [currentDeckId, setCurrentDeckId] = useState(() => initialDraft?.currentDeckId ?? null)
  const [deckName, setDeckName] = useState(() => initialDraft?.deckName || '')
  const [deckCards, setDeckCards] = useState(() =>
    (initialDraft?.deckCards || []).map((c, i) => ({ id: c.id || `dc_draft_${i}`, state: c.state || {} })),
  )
  const [deckView, setDeckView] = useState(loadDeckView)
  const [deckFilters, setDeckFilters] = useState({ q: '', kinds: [], attribute: 'all' })
  const [libTab, setLibTab] = useState('db')
  const [dbSearch, setDbSearch] = useState('')
  const [dbPage, setDbPage] = useState(1)
  const [dbFilters, setDbFilters] = useState({ kinds: [], attribute: 'all' })
  // Sobe quando o catalogo de impressoes (sets) termina de carregar, para
  // recalcular as opcoes de impressao na tela.
  const [printingsReady, setPrintingsReady] = useState(false)
  // Momento do ultimo rascunho salvo (null = nenhum rascunho nesta sessao).
  const [draftSavedAt, setDraftSavedAt] = useState(() => initialDraft?.savedAt || null)
  // Aviso de expiracao do rascunho pode ser dispensado pelo usuario.
  const [draftWarnDismissed, setDraftWarnDismissed] = useState(false)
  // Relogio para calcular o tempo restante do rascunho (atualiza 1x/min).
  const [now, setNow] = useState(() => Date.now())

  const isTrapSpell = SPELL_TRAP_TYPES.includes(state.type)
  const canPendulum = !isTrapSpell && state.type !== 'link'

  const collOptions = useMemo(() => {
    if (!state.dbCardId) return []
    return printingsForCard(state.dbCardId)
  }, [state.dbCardId, printingsReady])

  const collIndex = useMemo(() => {
    if (!collOptions.length || !state.set) return -1
    const idx = collOptions.findIndex((p) => p.code === state.set)
    return idx
  }, [collOptions, state.set])

  const applyPrinting = useCallback(
    (idx) => {
      const i = Number(idx)
      if (!collOptions[i]) return
      const p = collOptions[i]
      setState((prev) => ({
        ...prev,
        set: p.code,
        edition: editionLabel(p.edition),
        year: p.year ? String(p.year) : prev.year,
      }))
    },
    [collOptions, setState],
  )

  // Carrega (uma vez) o catalogo de impressoes sob demanda.
  useEffect(() => {
    let alive = true
    loadPrintings()
      .then(() => {
        if (alive) setPrintingsReady(true)
      })
      .catch(() => {
        /* sem o catalogo, seguimos apenas com o passcode (Serial) */
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(t)
  }, [toast])

  // Relogio do rascunho: recalcula o tempo restante a cada minuto.
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(iv)
  }, [])

  // Autosave do rascunho: grava o trabalho em andamento (carta + deck +
  // modo) no localStorage 1.2s depois de cada mudanca, sem bloquear a UI.
  const draftTimerRef = useRef(null)
  useEffect(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => {
      try {
        const payload = {
          savedAt: Date.now(),
          currentId,
          mode,
          state,
          deckName,
          currentDeckId,
          deckCards: deckCards.map((c) => ({ id: c.id, state: c.state })),
        }
        safeSetItem(DRAFT_KEY, JSON.stringify(payload))
        setDraftSavedAt(payload.savedAt)
      } catch {
        /* rascunho e melhor esforco */
      }
    }, 1200)
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    }
  }, [state, currentId, mode, deckCards, deckName, currentDeckId])

  const draftExpiresAt = draftSavedAt ? draftSavedAt + DRAFT_TTL_MS : null
  const draftRemainingMs = draftExpiresAt ? draftExpiresAt - now : 0
  const draftExpiringSoon =
    draftExpiresAt !== null && draftRemainingMs > 0 && draftRemainingMs < DRAFT_WARN_MS

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

  // Mede a largura disponivel do "Deck Criado"; a largura final das cartas e o
  // numero de colunas sao calculados a partir das preferencias de exibicao.
  useEffect(() => {
    if (mode !== 'deck') return
    const el = deckSectionRef.current
    if (!el) return
    const compute = () => {
      const w = el.clientWidth - 32 // padding 1rem de cada lado
      if (w > 0) setDeckContainerW(w)
    }
    compute()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [mode])

  // Ao entrar no Deck Criado sem um deck carregado, lista automaticamente
  // todas as cartas criadas para edicao/exportacao (apenas se o deck ainda
  // estiver vazio — nao sobrescreve um deck restaurado do rascunho).
  const prevModeRef = useRef(mode)
  useEffect(() => {
    const prev = prevModeRef.current
    prevModeRef.current = mode
    if (prev === mode || mode !== 'deck') return
    if (currentDeckId !== null) return
    if (deckCards.length > 0) return
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

  // ---- Derivados da exibicao do "Deck Criado" ----
  const { cardWidth: deckCardWidth, cols: deckCols, gap: deckGap } = useMemo(
    () => computeDeckLayout(deckContainerW, deckView),
    [deckContainerW, deckView],
  )

  // Agrupa cartas repetidas (mesmo conteudo) quando a opcao esta ligada.
  const deckGroups = useMemo(() => {
    if (!deckView.groupRepeated) {
      return deckCards.map((dc) => ({ key: dc.id, state: dc.state, items: [dc] }))
    }
    const map = new Map()
    deckCards.forEach((dc) => {
      const key = deckStateKey(dc.state)
      const g = map.get(key)
      if (g) g.items.push(dc)
      else map.set(key, { key, state: dc.state, items: [dc] })
    })
    return [...map.values()]
  }, [deckCards, deckView.groupRepeated])

  // Aplica busca + filtros (tipo e atributo) + ordenacao.
  const filteredDeckGroups = useMemo(() => {
    const q = deckFilters.q.trim().toLowerCase()
    const kinds = deckFilters.kinds
    const attr = deckFilters.attribute
    const tests = DECK_FILTER_CHIPS.filter((c) => kinds.includes(c.value))
    let list = deckGroups.filter((g) => {
      const s = g.state || {}
      if (q) {
        const name = String(s.name || '').toLowerCase()
        const eff = String(s.effect || '').toLowerCase()
        if (!name.includes(q) && !eff.includes(q)) return false
      }
      if (tests.length && !tests.some((c) => c.test(s))) return false
      if (attr !== 'all') {
        const a = SPELL_TRAP_TYPES.includes(s.type) ? s.type : s.attribute
        if (a !== attr) return false
      }
      return true
    })
    const num = (v) => {
      const n = Number(v)
      return Number.isFinite(n) ? n : 0
    }
    if (deckView.sort === 'name') {
      list = [...list].sort((a, b) =>
        String(a.state?.name || '').localeCompare(String(b.state?.name || ''), 'pt', {
          sensitivity: 'base',
        }),
      )
    } else if (deckView.sort === 'type') {
      list = [...list].sort((a, b) =>
        String(a.state?.type || '').localeCompare(String(b.state?.type || '')),
      )
    } else if (deckView.sort === 'level') {
      list = [...list].sort((a, b) => num(b.state?.level) - num(a.state?.level))
    } else if (deckView.sort === 'atk') {
      list = [...list].sort((a, b) => num(b.state?.atk) - num(a.state?.atk))
    }
    return list
  }, [deckGroups, deckFilters, deckView.sort])

  const deckHasFilters =
    deckFilters.q.trim() !== '' || deckFilters.kinds.length > 0 || deckFilters.attribute !== 'all'
  const deckShownCount = filteredDeckGroups.reduce((n, g) => n + g.items.length, 0)

  // Resumo por categoria (estilo Master Duel).
  const deckBreakdown = useMemo(() => {
    const acc = { monster: 0, spell: 0, trap: 0, other: 0 }
    deckCards.forEach((c) => {
      const t = c.state?.type
      if (t === 'spell') acc.spell++
      else if (t === 'trap') acc.trap++
      else if (t === 'token') acc.other++
      else acc.monster++
    })
    return acc
  }, [deckCards])

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
      if (SPELL_TRAP_TYPES.includes(type)) {
        next.attribute = type
        // descarta um subtipo que nao exista no novo tipo (ex.: Rapida -> Armadilha)
        if (s.spellTrapIcon) {
          const valid = SPELL_TRAP_ICONS.some(
            (i) => i.value === s.spellTrapIcon && (!i.types || i.types.includes(type)),
          )
          if (!valid) next.spellTrapIcon = ''
        }
      }
      return next
    })
  }

  const handleArtFile = async (file, inputEl) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setToast('Selecione um arquivo de imagem (PNG/JPG)')
      return
    }
    try {
      setBusy(true)
      const art = await compressImageFile(file)
      update({ art })
      setToast('Imagem carregada!')
    } catch {
      setToast('Falha ao ler a imagem do dispositivo')
    } finally {
      setBusy(false)
      // Permite selecionar o MESMO arquivo de novo (sem isso o onChange nao
      // dispara e o usuario achava que o upload "nao funcionava").
      if (inputEl) inputEl.value = ''
    }
  }

  const handleSave = () => {
    const name = state.name?.trim() || 'Carta sem nome'
    const entry = {
      id: currentId || `card_${Date.now()}`,
      name,
      state,
      date: new Date().toISOString(),
    }
    const exists = saved.some((c) => c.id === entry.id)
    const next = exists ? saved.map((c) => (c.id === entry.id ? entry : c)) : [entry, ...saved]
    // Grava FORA do updater do React: se o localStorage estourar a cota, o
    // erro nao pode derrubar a pagina (isso travava a edição e exigia reload).
    const ok = safeSetItem(STORAGE_KEY, JSON.stringify(next))
    setSaved(next)
    setCurrentId(entry.id)
    if (ok === false) {
      setToast('Sem espaço no navegador para salvar a carta')
    } else if (ok === 'stripped') {
      setToast('Carta salva (arte local removida do salvamento por espaço)')
    } else {
      setToast('Carta salva!')
    }
  }

  const handleLoad = (entry) => {
    setState({ ...defaultCardState(), ...entry.state })
    setCurrentId(entry.id)
    setListOpen(false)
    setSavedSearch('')
    setToast(`Carregada: ${entry.name}`)
  }

  const handleDelete = (id) => {
    const next = saved.filter((c) => c.id !== id)
    safeSetItem(STORAGE_KEY, JSON.stringify(next))
    setSaved(next)
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

  // Normaliza o limite de caracteres ao sair do campo (permite digitar livremente
  // e nao deixa o valor "pular" a cada tecla). Se o limite estiver ativo, corta o
  // efeito para o novo tamanho.
  const commitEffectLimit = () => {
    const raw = state.effectLimit
    const lim = raw === '' || raw === null || raw === undefined ? 300 : clampSize(raw, 20, 2000, 300)
    const patch = { effectLimit: lim }
    if (state.effectLimitEnabled) patch.effect = String(state.effect || '').slice(0, lim)
    update(patch)
  }

  // Normaliza o espacamento entre linhas ao sair do campo.
  const commitEffectSpacing = () => {
    const raw = state.effectSpacing
    const n = raw === '' || raw === null || raw === undefined ? 1.15 : Number(raw)
    update({ effectSpacing: Number.isNaN(n) ? 1.15 : Math.max(0.8, Math.min(2.4, n)) })
  }



  // ---- Montador de deck (cartas criadas) ----
  const persistDecks = (next) => {
    setCustomDecks(next)
    const ok = safeSetItem(DECKS_KEY, JSON.stringify(next))
    if (ok === false) setToast('Sem espaço no navegador para salvar o deck')
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
  const removeDeckCardIds = (ids) => {
    const set = new Set(ids)
    setDeckCards((prev) => prev.filter((c) => !set.has(c.id)))
  }
  const clearDeckCards = () => setDeckCards([])

  // ---- Preferencias de exibicao / filtros do deck ----
  const persistDeckView = (next) => {
    setDeckView(next)
    try {
      localStorage.setItem(DECK_VIEW_KEY, JSON.stringify(next))
    } catch {
      /* localStorage pode estar indisponivel */
    }
  }
  const updateDeckView = (patch) => persistDeckView({ ...deckView, ...patch })

  const toggleDeckKind = (value) =>
    setDeckFilters((f) => ({
      ...f,
      kinds: f.kinds.includes(value) ? f.kinds.filter((k) => k !== value) : [...f.kinds, value],
    }))
  const clearDeckFilters = () => setDeckFilters({ q: '', kinds: [], attribute: 'all' })

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
    const p = defaultPrinting(card.id)
    setState(stateFromDbCard(card, p))
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
    const p = defaultPrinting(card.id)
    const s = stateFromDbCard(card, p)
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
      if (s.nameColor) details.push(`   COR DO TÍTULO: ${s.nameColor}`)
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

  // ---- Exportacao do rascunho (estado em andamento) ----
  // Salva a carta atual + o deck em andamento em .txt/.json, para o usuario
  // nao perder o trabalho quando o rascunho estiver perto de expirar.
  const exportDraftJson = () => {
    const payload = {
      app: 'yugidex-criar-cards',
      kind: 'draft',
      exportedAt: new Date().toISOString(),
      currentId,
      card: state,
      deck: {
        name: deckName,
        id: currentDeckId,
        cards: deckCards.map((c) => c.state),
      },
    }
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
    downloadBlob(JSON.stringify(payload, null, 2), 'application/json', `rascunho-yugidex-${stamp}.json`)
    setToast('Rascunho salvo em .json')
  }

  const exportDraftTxt = () => {
    let content = `========================================\n`
    content += `       RASCUNHO - CRIADOR DE CARTAS\n`
    content += `========================================\n\n`
    content += `EXPORTADO EM: ${new Date().toLocaleString('pt-BR')}\n`
    if (draftExpiresAt) {
      content += `EXPIRA EM: ${new Date(draftExpiresAt).toLocaleString('pt-BR')}\n`
    }
    content += `\n========================================\n`
    content += `           CARTA ATUAL\n`
    content += `========================================\n\n`
    const s = state || {}
    content += `NOME: ${s.name || 'Sem nome'}\n`
    content += `   TIPO DE CARTA: ${cardTypeLabel(s)}\n`
    if (s.monsterType) content += `   TIPO/RAÇA: ${s.monsterType}\n`
    if (s.attribute) content += `   ATRIBUTO: ${attributeLabel(s)}\n`
    if (!SPELL_TRAP_TYPES.includes(s.type) && s.level !== undefined && s.level !== '') {
      content += `   NÍVEL: ${s.level}\n`
    }
    if (s.atk !== undefined && s.atk !== '') content += `   ATK: ${s.atk}\n`
    if (s.def !== undefined && s.def !== '') content += `   DEF: ${s.def}\n`
    if (s.effect) content += `   EFEITO: ${s.effect}\n`
    if (s.pendulumEffect) content += `   EFEITO DO PÊNDULO: ${s.pendulumEffect}\n`
    if (s.nameColor) content += `   COR DO TÍTULO: ${s.nameColor}\n`
    const art = escapeJsonArt(s)
    if (art) content += `   IMAGEM DA CARTA: ${art}\n`
    else if (s.art && s.art.startsWith('data:')) content += `   IMAGEM DA CARTA: (imagem local - use o .json)\n`
    if (s.serial) content += `   SERIAL: ${s.serial}\n`
    if (s.creator) content += `   CRIADOR: ${s.creator}\n`
    content += `\n`
    if (deckCards.length) {
      content += `========================================\n`
      content += `    DECK EM ANDAMENTO: ${deckName || 'Sem nome'}\n`
      content += `========================================\n\n`
      content += `TOTAL: ${deckCards.length} carta(s)\n\n`
      deckCards.forEach((dc, i) => {
        content += `${i + 1}. ${dc.state?.name || 'Sem nome'} (${cardTypeLabel(dc.state || {})})\n`
      })
      content += `\n(O deck completo pode ser exportado na aba Deck Criado)\n`
    }
    content += `\n========================================\n`
    content += `       FIM DO RASCUNHO\n`
    content += `========================================\n`
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
    downloadBlob(content, 'text/plain;charset=utf-8', `rascunho-yugidex-${stamp}.txt`)
    setToast('Rascunho salvo em .txt')
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
    'COR DO TÍTULO': 'nameColor',
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
    const tests = DB_FILTER_CHIPS.filter((c) => dbFilters.kinds.includes(c.value))
    const attr = dbFilters.attribute
    return cards.filter((c) => {
      if (q && !(c._normalizedNames || '').includes(q)) return false
      if (tests.length && !tests.some((t) => t.test(c))) return false
      if (attr !== 'all' && String(c.attribute || '').toLowerCase() !== attr) return false
      return true
    })
  }, [cards, dbSearch, dbFilters])

  const dbHasFilters = dbFilters.kinds.length > 0 || dbFilters.attribute !== 'all'
  const toggleDbKind = (value) =>
    setDbFilters((f) => ({
      ...f,
      kinds: f.kinds.includes(value) ? f.kinds.filter((k) => k !== value) : [...f.kinds, value],
    }))
  const clearDbFilters = () => setDbFilters({ kinds: [], attribute: 'all' })

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
      {/* Aviso de rascunho proximo da expiracao: oferece exportar .txt/.json
          antes de perder o trabalho salvo automaticamente. */}
      {draftExpiringSoon && !draftWarnDismissed && (
        <div className="cm-draft-warning" role="alert">
          <div className="cm-draft-warning-text">
            <strong>⚠ Seu rascunho automático expira em {draftRemainingLabel(draftRemainingMs)}</strong>
            <span>
              Salvo automaticamente em {new Date(draftSavedAt).toLocaleString('pt-BR')}. Exporte
              abaixo para não perder seu trabalho.
            </span>
          </div>
          <div className="cm-draft-warning-actions">
            <button type="button" className="cm-btn ghost small" onClick={exportDraftTxt}>
              Salvar .txt
            </button>
            <button type="button" className="cm-btn ghost small" onClick={exportDraftJson}>
              Salvar .json
            </button>
            <button
              type="button"
              className="cm-btn ghost small"
              onClick={() => {
                const payload = {
                  savedAt: Date.now(),
                  currentId,
                  mode,
                  state,
                  deckName,
                  currentDeckId,
                  deckCards: deckCards.map((c) => ({ id: c.id, state: c.state })),
                }
                safeSetItem(DRAFT_KEY, JSON.stringify(payload))
                setDraftSavedAt(payload.savedAt)
                setNow(Date.now())
                setToast('Rascunho renovado por mais 30 dias')
              }}
            >
              Renovar 30 dias
            </button>
            <button
              type="button"
              className="cm-btn ghost small danger"
              onClick={() => setDraftWarnDismissed(true)}
            >
              Dispensar
            </button>
          </div>
        </div>
      )}
      <div className="cm-toolbar">
        <div className="cm-toolbar-title">
          <h2>Criador de Cartas</h2>
          <p>
            Monte sua carta de Yu-Gi-Oh personalizada
            {draftSavedAt && (
              <span className="cm-draft-badge" title="Trabalho salvo automaticamente neste navegador">
                {' • '}
                Rascunho salvo (expira em {draftRemainingLabel(draftRemainingMs)})
              </span>
            )}
          </p>
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
                <span>{state.type === 'trap' ? 'Tipo de Armadilha' : 'Tipo de Magia'}</span>
                <select value={state.spellTrapIcon} onChange={(e) => update({ spellTrapIcon: e.target.value })}>
                  {spellTrapIconsFor(state.type).map((s) => (
                    <option key={s.value || 'none'} value={s.value}>
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

            <label className="cm-check">
              <input
                type="checkbox"
                checked={!!state.holographic}
                onChange={(e) => update({ holographic: e.target.checked })}
              />
              <span>Carta holográfica / metalizada (foil)</span>
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

            <div className="cm-field">
              <span>Cor do título</span>
              <div className="cm-color-row">
                <label className="cm-check">
                  <input
                    type="checkbox"
                    checked={!state.nameColor}
                    onChange={(e) =>
                      update({
                        nameColor: e.target.checked
                          ? ''
                          : isWhiteName(state)
                            ? '#ffffff'
                            : '#000000',
                      })
                    }
                  />
                  <span>Automática</span>
                </label>
                <input
                  type="color"
                  className="cm-color-input"
                  value={state.nameColor || (isWhiteName(state) ? '#ffffff' : '#000000')}
                  disabled={!state.nameColor}
                  onChange={(e) => update({ nameColor: e.target.value })}
                  title="Escolher cor do título"
                />
                {state.nameColor && (
                  <button
                    type="button"
                    className="cm-btn ghost small"
                    onClick={() => update({ nameColor: '' })}
                  >
                    Resetar
                  </button>
                )}
              </div>
            </div>

            {!isTrapSpell && (
              <label className="cm-field">
                <span>Tipo do monstro (raça)</span>
                <input type="text" value={state.monsterType} onChange={(e) => update({ monsterType: e.target.value })} placeholder="Ex: Dragon / Effect" />
              </label>
            )}

            <label className="cm-field">
              <span>{isTrapSpell ? 'Efeito da carta' : 'Texto de efeito / lore'}</span>
              <textarea
                rows={5}
                value={state.effect}
                maxLength={
                  state.effectLimitEnabled
                    ? Number(state.effectLimit) > 0
                      ? Math.floor(Number(state.effectLimit))
                      : 300
                    : undefined
                }
                onChange={(e) => update({ effect: applyEffectRules(e.target.value, state) })}
                placeholder="Descreva o efeito..."
              />
            </label>

            <div className="cm-field">
              <span>Formatação do efeito</span>
              <div className="cm-format">
                <label className="cm-check">
                  <input
                    type="checkbox"
                    checked={state.autoFit !== false}
                    onChange={(e) => update({ autoFit: e.target.checked })}
                  />
                  <span>Ajustar texto automaticamente ao espaço</span>
                </label>
                <label className="cm-check">
                  <input
                    type="checkbox"
                    checked={state.effectAllowSymbols !== false}
                    onChange={(e) =>
                      update({
                        effectAllowSymbols: e.target.checked,
                        effect: e.target.checked
                          ? state.effect
                          : stripEffectSymbols(state.effect),
                      })
                    }
                  />
                  <span>Permitir símbolos</span>
                </label>
                <label className="cm-check">
                  <input
                    type="checkbox"
                    checked={!!state.effectLimitEnabled}
                    onChange={(e) =>
                      update({
                        effectLimitEnabled: e.target.checked,
                        effect: e.target.checked
                          ? String(state.effect || '').slice(
                              0,
                              clampSize(state.effectLimit, 20, 2000, 300),
                            )
                          : state.effect,
                      })
                    }
                  />
                  <span>Definir limite de caracteres</span>
                </label>
                <div className="cm-row">
                  <label className="cm-field">
                    <span>Limite de caracteres</span>
                    <input
                      type="number"
                      min="20"
                      max="2000"
                      step="1"
                      disabled={!state.effectLimitEnabled}
                      value={state.effectLimit ?? 300}
                      onChange={(e) => update({ effectLimit: e.target.value })}
                      onBlur={commitEffectLimit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur()
                      }}
                    />
                  </label>
                  <label className="cm-field">
                    <span>Espaçamento (linhas)</span>
                    <input
                      type="number"
                      min="0.8"
                      max="2.4"
                      step="0.05"
                      value={state.effectSpacing ?? 1.15}
                      onChange={(e) => update({ effectSpacing: e.target.value })}
                      onBlur={commitEffectSpacing}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur()
                      }}
                    />
                  </label>
                </div>
                <label className="cm-field">
                  <span>Alinhamento do texto</span>
                  <select value={state.effectAlign || 'justify'} onChange={(e) => update({ effectAlign: e.target.value })}>
                    <option value="justify">Justificado</option>
                    <option value="left">Esquerda</option>
                    <option value="center">Centro</option>
                    <option value="right">Direita</option>
                  </select>
                </label>
                <p className="cm-format-hint">
                  {String(state.effect || '').length} caractere(s)
                  {state.effectLimitEnabled
                    ? ` • limite ${clampSize(state.effectLimit, 20, 2000, 300)}`
                    : ''}
                </p>
              </div>
            </div>

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
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleArtFile(e.target.files?.[0], e.target)}
              />
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
            {collOptions.length > 1 && (
              <div className="cm-row">
                <label className="cm-field cm-field-wide">
                  <span>Impressão (set)</span>
                  <select
                    className="cm-select"
                    value={collIndex >= 0 ? collIndex : ''}
                    onChange={(e) => applyPrinting(e.target.value)}
                  >
                    <option value="" disabled>
                      Selecione uma impressão
                    </option>
                    {collOptions.map((p, i) => (
                      <option key={`${p.code}-${i}`} value={i}>
                        {p.code} — {p.setName}
                        {p.rarity ? ` · ${p.rarity}` : ''}
                        {p.edition ? ` · ${editionLabel(p.edition)}` : ''}
                        {p.year ? ` · ${p.year}` : ''}
                        {` (${regionLabel(p.lang)})`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
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
            ref={deckSectionRef}
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
              <div className="cdm-deck-bar-actions">
                <div className="cdm-deck-group">
                  <span className="cdm-deck-group-label">Cartas</span>
                  <button type="button" className="cm-btn ghost small" onClick={addCurrentToDeck}>
                    + Carta atual
                  </button>
                  <button type="button" className="cm-btn ghost small danger" onClick={clearDeckCards} disabled={!deckCards.length}>
                    Limpar
                  </button>
                </div>
                <div className="cdm-deck-group">
                  <span className="cdm-deck-group-label">Importar</span>
                  <button type="button" className="cm-btn ghost small" onClick={importDeckTxt}>
                    .txt
                  </button>
                  <button type="button" className="cm-btn ghost small" onClick={importDeckJson}>
                    .json
                  </button>
                </div>
                <div className="cdm-deck-group">
                  <span className="cdm-deck-group-label">Exportar</span>
                  <button type="button" className="cm-btn ghost small" onClick={exportCreatedDeckTxt} disabled={!deckCards.length}>
                    .txt
                  </button>
                  <button type="button" className="cm-btn ghost small" onClick={exportCreatedDeckJson} disabled={!deckCards.length}>
                    .json
                  </button>
                  <button
                    type="button"
                    className="cm-btn primary small cdm-pdf-btn"
                    onClick={exportDeckPdf}
                    disabled={busy || !deckCards.length}
                  >
                    {busy ? 'Gerando...' : 'Salvar PDF (A4)'}
                  </button>
                </div>
              </div>
              <div className="cdm-deck-info">
                <span>
                  {deckCards.length} carta(s) • {deckBreakdown.monster} monstro(s) • {deckBreakdown.spell} magia(s) •{' '}
                  {deckBreakdown.trap} armadilha(s) • {Math.max(1, Math.ceil(deckCards.length / DECK_PER_PAGE))} folha(s) A4
                  {deckHasFilters ? ` • ${deckShownCount} exibida(s)` : ''}
                </span>
                <span className="cdm-drag-hint">Arraste uma carta do banco para o deck</span>
              </div>
            </div>

            <div className="cdm-display">
              <div className="cdm-display-row">
                <label className="cm-field">
                  <span>Tamanho das cartas</span>
                  <select
                    value={deckView.cardSize}
                    onChange={(e) => updateDeckView({ cardSize: e.target.value })}
                    disabled={deckView.cols !== 'auto'}
                    title={
                      deckView.cols !== 'auto'
                        ? 'Definido pelas colunas escolhidas'
                        : 'Tamanho das cartas na grade'
                    }
                  >
                    <option value="auto">Automático</option>
                    <option value="sm">Pequeno</option>
                    <option value="md">Médio</option>
                    <option value="lg">Grande</option>
                    <option value="xl">Extra</option>
                  </select>
                </label>
                <label className="cm-field">
                  <span>Colunas</span>
                  <select value={deckView.cols} onChange={(e) => updateDeckView({ cols: e.target.value })}>
                    <option value="auto">Automático</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </label>
                <label className="cm-field">
                  <span>Espaçamento</span>
                  <select value={deckView.gap} onChange={(e) => updateDeckView({ gap: e.target.value })}>
                    <option value="compact">Compacto</option>
                    <option value="normal">Normal</option>
                    <option value="wide">Amplo</option>
                  </select>
                </label>
                <label className="cm-field">
                  <span>Ordenar por</span>
                  <select value={deckView.sort} onChange={(e) => updateDeckView({ sort: e.target.value })}>
                    <option value="added">Ordem de adição</option>
                    <option value="name">Nome (A-Z)</option>
                    <option value="type">Tipo</option>
                    <option value="level">Nível</option>
                    <option value="atk">ATK</option>
                  </select>
                </label>
              </div>
              <div className="cdm-display-checks">
                <label className="cm-check">
                  <input
                    type="checkbox"
                    checked={deckView.groupRepeated}
                    onChange={(e) => updateDeckView({ groupRepeated: e.target.checked })}
                  />
                  <span>Agrupar cartas repetidas</span>
                </label>
                <label className="cm-check">
                  <input
                    type="checkbox"
                    checked={deckView.showName}
                    onChange={(e) => updateDeckView({ showName: e.target.checked })}
                  />
                  <span>Mostrar nome</span>
                </label>
                <label className="cm-check">
                  <input
                    type="checkbox"
                    checked={deckView.showActions}
                    onChange={(e) => updateDeckView({ showActions: e.target.checked })}
                  />
                  <span>Mostrar botões</span>
                </label>
                <label className="cm-check">
                  <input
                    type="checkbox"
                    checked={deckView.showNumber}
                    onChange={(e) => updateDeckView({ showNumber: e.target.checked })}
                  />
                  <span>Numerar cartas</span>
                </label>
              </div>
            </div>

            <div className="cdm-filters">
              <div className="cdm-filter-row">
                <input
                  type="text"
                  className="cdm-search"
                  placeholder="Buscar no deck (nome ou efeito)..."
                  value={deckFilters.q}
                  onChange={(e) => setDeckFilters((f) => ({ ...f, q: e.target.value }))}
                />
                <select
                  className="cdm-filter-select"
                  value={deckFilters.attribute}
                  onChange={(e) => setDeckFilters((f) => ({ ...f, attribute: e.target.value }))}
                >
                  <option value="all">Todos os atributos</option>
                  {ATTRIBUTES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                  <option value="spell">Magia (tipo)</option>
                  <option value="trap">Armadilha (tipo)</option>
                </select>
                {deckHasFilters && (
                  <button type="button" className="cm-btn ghost small" onClick={clearDeckFilters}>
                    Limpar filtros
                  </button>
                )}
              </div>
              <div className="cdm-chips">
                <button
                  type="button"
                  className={`cdm-chip ${deckFilters.kinds.length === 0 ? 'active' : ''}`}
                  onClick={() => setDeckFilters((f) => ({ ...f, kinds: [] }))}
                >
                  Todos
                </button>
                {DECK_FILTER_CHIPS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`cdm-chip ${deckFilters.kinds.includes(c.value) ? 'active' : ''}`}
                    onClick={() => toggleDeckKind(c.value)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {deckCards.length === 0 ? (
              <p className="cdm-empty">Deck vazio. Adicione cartas criadas pela biblioteca ao lado ou clique em “+ Carta atual”.</p>
            ) : filteredDeckGroups.length === 0 ? (
              <p className="cdm-empty">
                Nenhuma carta corresponde aos filtros.{' '}
                <button type="button" className="cm-btn ghost small" onClick={clearDeckFilters}>
                  Limpar filtros
                </button>
              </p>
            ) : (
              <div
                className="cdm-grid"
                style={{ gridTemplateColumns: `repeat(${deckCols}, minmax(0, 1fr))`, gap: `${deckGap}px` }}
              >
                {filteredDeckGroups.map((g, idx) => (
                  <div key={g.key} className="cdm-card">
                    <div className="cdm-card-preview">
                      <YugiohCardPreview state={g.state} width={deckCardWidth} />
                      {deckView.showNumber && <span className="cdm-card-index">{idx + 1}</span>}
                      {g.items.length > 1 && <span className="cdm-card-count">×{g.items.length}</span>}
                    </div>
                    {deckView.showName && <div className="cdm-card-name">{g.state.name || 'Sem nome'}</div>}
                    {deckView.showActions && (
                      <div className="cdm-card-actions">
                        <button type="button" className="cm-btn ghost small" onClick={() => editDeckCard(g.items[0])}>
                          Editar
                        </button>
                        {g.items.length > 1 ? (
                          <>
                            <button
                              type="button"
                              className="cm-btn ghost small danger"
                              onClick={() => removeDeckCard(g.items[g.items.length - 1].id)}
                              title="Remover 1 cópia"
                            >
                              −1
                            </button>
                            <button
                              type="button"
                              className="cm-btn ghost small danger"
                              onClick={() => removeDeckCardIds(g.items.map((i) => i.id))}
                              title="Remover todas as cópias"
                            >
                              Todas
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="cm-btn ghost small danger"
                            onClick={() => removeDeckCard(g.items[0].id)}
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    )}
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
                      <button
                        type="button"
                        className="cdm-saved-name"
                        onClick={() => loadCustomDeck(d)}
                        title="Clique para carregar este deck"
                      >
                        <strong>{d.name}</strong>
                        <span>
                          {d.cards?.length || 0} carta(s)
                          {d.date ? ` • ${formatDeckDate(d.date)}` : ''}
                        </span>
                      </button>
                      <div className="cdm-saved-actions">
                        <button type="button" className="cm-btn primary small" onClick={() => loadCustomDeck(d)}>
                          Load
                        </button>
                        <button
                          type="button"
                          className="cm-btn ghost small danger"
                          onClick={() => deleteCustomDeck(d.id)}
                          title="Excluir"
                        >
                          ×
                        </button>
                      </div>
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
                <div className="cdm-lib-filter-row">
                  <select
                    className="cdm-filter-select"
                    value={dbFilters.attribute}
                    onChange={(e) => {
                      setDbFilters((f) => ({ ...f, attribute: e.target.value }))
                      setDbPage(1)
                    }}
                  >
                    <option value="all">Todos os atributos</option>
                    {ATTRIBUTES.filter((a) => ['dark', 'light', 'fire', 'water', 'earth', 'wind', 'divine'].includes(a.value)).map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                  {dbHasFilters && (
                    <button
                      type="button"
                      className="cm-btn ghost small"
                      onClick={() => {
                        clearDbFilters()
                        setDbPage(1)
                      }}
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <div className="cdm-chips cdm-chips-sm">
                  <button
                    type="button"
                    className={`cdm-chip ${dbFilters.kinds.length === 0 ? 'active' : ''}`}
                    onClick={() => {
                      setDbFilters((f) => ({ ...f, kinds: [] }))
                      setDbPage(1)
                    }}
                  >
                    Todos
                  </button>
                  {DB_FILTER_CHIPS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`cdm-chip ${dbFilters.kinds.includes(c.value) ? 'active' : ''}`}
                      onClick={() => {
                        toggleDbKind(c.value)
                        setDbPage(1)
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
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
