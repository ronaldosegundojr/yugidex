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
  defaultCardState,
} from './cardMakerData'
import './CardMakerPage.css'

const STORAGE_KEY = 'ygoCustomCards'

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

export default function CardMakerPage() {
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
  const cardRef = useRef(null)
  const previewRef = useRef(null)

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

  const filteredSaved = useMemo(() => {
    const q = savedSearch.trim().toLowerCase()
    if (!q) return saved
    return saved.filter((c) => c.name.toLowerCase().includes(q))
  }, [saved, savedSearch])

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
        </div>
      </div>

      <div className="cm-layout">
        <section className="cm-preview" ref={previewRef}>
          <div className="cm-preview-inner">
            <YugiohCardPreview state={state} width={previewWidth} innerRef={cardRef} />
          </div>
          <div className="cm-preview-actions">
            <button type="button" className="cm-btn primary" onClick={handleDownload} disabled={busy}>
              {busy ? 'Gerando...' : 'Baixar PNG'}
            </button>
            <button type="button" className="cm-btn primary" onClick={handleShare}>
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

      {toast && <div className="cm-toast">{toast}</div>}
    </div>
  )
}
