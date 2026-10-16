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
  const [deckOpen, setDeckOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [printCards, setPrintCards] = useState(null)
  const cardRef = useRef(null)
  const previewRef = useRef(null)
  const printRefs = useRef([])

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
    const el = previewRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      setPreviewWidth(Math.max(220, Math.min(421, Math.floor(w - 32))))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Renderiza (oculto) as cartas do deck e gera o PDF A4 em matriz.
  useEffect(() => {
    if (!printCards) return
    let cancelled = false
    const run = async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        await new Promise((r) => setTimeout(r, 150))
        const images = []
        for (let i = 0; i < printCards.cards.length; i++) {
          const el = printRefs.current[i]
          if (!el) continue
          const dataUrl = await toPng(el, {
            width: CARD_W,
            height: CARD_H,
            pixelRatio: 2,
            cacheBust: true,
            style: { transform: 'none', transformOrigin: 'top left' },
          })
          if (cancelled) return
          images.push(dataUrl)
        }
        if (cancelled) return
        const { pages } = await buildDeckPdf(images, printCards.filename)
        setToast(`PDF gerado: ${images.length} carta(s) em ${pages} folha(s) A4`)
      } catch (e) {
        console.error('Erro ao gerar PDF do deck:', e)
        setToast('Falha ao gerar PDF')
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

  const handleDownload = async () => {
    if (!cardRef.current) return
    setBusy(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: CARD_W,
        height: CARD_H,
        pixelRatio: 2,
        cacheBust: true,
        style: { transform: 'none', transformOrigin: 'top left' },
      })
      const a = document.createElement('a')
      a.download = `${(state.name || 'yugioh-card').replace(/[^\w-]+/g, '_')}.png`
      a.href = dataUrl
      a.click()
      setToast('Download gerado!')
    } catch (e) {
      console.error('Erro ao gerar PNG:', e)
      setToast('Falha ao gerar PNG')
    } finally {
      setBusy(false)
    }
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

  // ---- Exportacao em PDF (A4, matriz 3x3) ----
  const generateFromStates = (cards, filename) => {
    if (!cards.length) {
      setToast('Nenhuma carta para exportar')
      return
    }
    printRefs.current = []
    setBusy(true)
    setDeckOpen(false)
    setPrintCards({ cards, filename })
  }

  const handleDeckPdf = () => {
    const cards = saved
      .filter((c) => selectedIds.has(c.id))
      .map((c) => ({ id: c.id, state: c.state }))
    generateFromStates(cards, 'deck-yugidex.pdf')
  }

  const handleSinglePdf = () => {
    const safe = (state.name || 'yugioh-card').replace(/[^\w-]+/g, '_')
    generateFromStates([{ id: 'carta-atual', state }], `${safe}.pdf`)
  }

  const openDeckModal = () => {
    setSelectedIds(new Set(saved.map((c) => c.id)))
    setDeckOpen(true)
  }

  const toggleSelect = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const selectAllSaved = () => setSelectedIds(new Set(saved.map((c) => c.id)))
  const clearSelection = () => setSelectedIds(new Set())

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

  const exportDeckPdf = () => {
    if (!deckCards.length) {
      setToast('Deck vazio')
      return
    }
    const safe = (deckName.trim() || 'deck-yugidex').replace(/[^\w-]+/g, '_')
    generateFromStates(
      deckCards.map((c, i) => ({ id: `dc${i}`, state: c.state })),
      `${safe}.pdf`,
    )
  }

  const filteredSaved = useMemo(() => {
    const q = savedSearch.trim().toLowerCase()
    if (!q) return saved
    return saved.filter((c) => c.name.toLowerCase().includes(q))
  }, [saved, savedSearch])

  const selectedCount = useMemo(
    () => saved.filter((c) => selectedIds.has(c.id)).length,
    [saved, selectedIds],
  )
  const deckPages = Math.ceil(selectedCount / DECK_PER_PAGE)

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
              Deck de cartas criadas
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
            <button type="button" className="cm-btn primary" onClick={openDeckModal} disabled={busy}>
              Imprimir deck (PDF A4)
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
              <input type="text" value={state.name} maxLength={60} onChange={(e) => update({ name: e.target.value })} placeholder="Ex: Dragão Negro de Olhos Vermelhos" />
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
                    <input type="text" inputMode="numeric" maxLength={5} value={state.atk} onChange={(e) => update({ atk: e.target.value })} placeholder="0" />
                  </label>
                  <label className="cm-field">
                    <span>DEF</span>
                    <input type="text" inputMode="numeric" maxLength={5} value={state.def} onChange={(e) => update({ def: e.target.value })} placeholder="0" />
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
                    <input type="text" maxLength={2} value={state.scaleBlue} onChange={(e) => update({ scaleBlue: e.target.value })} />
                  </label>
                  <label className="cm-field">
                    <span>Escala Vermelha</span>
                    <input type="text" maxLength={2} value={state.scaleRed} onChange={(e) => update({ scaleRed: e.target.value })} />
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
                <input type="text" maxLength={12} value={state.set} onChange={(e) => update({ set: e.target.value })} placeholder="YGIDX-EN001" />
              </label>
              <label className="cm-field">
                <span>Serial #</span>
                <input type="text" maxLength={8} value={state.serial} onChange={(e) => update({ serial: e.target.value })} placeholder="00000000" />
              </label>
            </div>
            <div className="cm-row">
              <label className="cm-field">
                <span>Edição</span>
                <input type="text" maxLength={20} value={state.edition} onChange={(e) => update({ edition: e.target.value })} placeholder="1st Edition" />
              </label>
              <label className="cm-field">
                <span>Ano</span>
                <input type="text" maxLength={4} value={state.year} onChange={(e) => update({ year: e.target.value })} />
              </label>
            </div>
            <label className="cm-field">
              <span>Criador</span>
              <input type="text" maxLength={30} value={state.creator} onChange={(e) => update({ creator: e.target.value })} placeholder="Seu nome" />
            </label>
            <label className="cm-field">
              <span>Rodapé</span>
              <input type="text" maxLength={60} value={state.footer} onChange={(e) => update({ footer: e.target.value })} />
            </label>
          </fieldset>
        </aside>
      </div>
      )}

      {mode === 'deck' && (
        <div className="cdm-layout">
          <section className="cdm-deck">
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
                <button type="button" className="cm-btn ghost small" onClick={addCurrentToDeck}>
                  + Carta atual
                </button>
                <button type="button" className="cm-btn ghost small" onClick={clearDeckCards} disabled={!deckCards.length}>
                  Limpar
                </button>
                <button type="button" className="cm-btn primary small" onClick={exportDeckPdf} disabled={busy || !deckCards.length}>
                  {busy ? 'Gerando...' : 'Exportar PDF (A4)'}
                </button>
              </div>
            </div>

            {deckCards.length === 0 ? (
              <p className="cdm-empty">Deck vazio. Adicione cartas criadas pela biblioteca ao lado ou clique em “+ Carta atual”.</p>
            ) : (
              <div className="cdm-grid">
                {deckCards.map((dc) => (
                  <div key={dc.id} className="cdm-card">
                    <YugiohCardPreview state={dc.state} width={120} />
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
                      <button key={card.id} type="button" className="cdm-lib-card" onClick={() => importDbCard(card)} title={nm}>
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
                      <YugiohCardPreview state={entry.state} width={120} />
                      <span>{entry.name}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}

      {deckOpen && (
        <div className="cm-modal-backdrop" onMouseDown={() => setDeckOpen(false)}>
          <div className="cm-modal" onMouseDown={(e) => e.stopPropagation()}>
            <h3>Imprimir deck em PDF (A4)</h3>
            <p className="cm-modal-sub">
              {selectedCount} de {saved.length} carta(s) • {deckPages} folha(s) A4 • {DECK_PER_PAGE} cartas por
              folha (3×3) • 59×86 mm
            </p>

            {saved.length === 0 ? (
              <p className="cm-modal-empty">
                Você ainda não salvou cartas. Use o botão <strong>Salvar</strong> para adicioná-las ao deck.
              </p>
            ) : (
              <>
                <div className="cm-modal-tools">
                  <button type="button" className="cm-btn ghost small" onClick={selectAllSaved}>
                    Selecionar todas
                  </button>
                  <button type="button" className="cm-btn ghost small" onClick={clearSelection}>
                    Limpar seleção
                  </button>
                </div>
                <div className="cm-modal-list">
                  {saved.map((c) => (
                    <label key={c.id} className="cm-deck-item">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                      />
                      <span className="cm-deck-name">{c.name}</span>
                    </label>
                  ))}
                </div>
              </>
            )}

            <div className="cm-modal-actions">
              <button type="button" className="cm-btn ghost" onClick={() => setDeckOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="cm-btn primary"
                onClick={handleDeckPdf}
                disabled={busy || selectedCount === 0}
              >
                {busy ? 'Gerando...' : 'Gerar PDF do deck'}
              </button>
            </div>
          </div>
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

      {toast && <div className="cm-toast">{toast}</div>}
    </div>
  )
}
