import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCardSearch } from '../hooks/useCardSearch'
import { getStatMeta, getCardName, getCardImage, LEVEL_MAX } from '../cardUtils'
import { getZoneAllowedTypes, ZONE_LABELS } from '../fieldLayout'
import StatAdjuster from './StatAdjuster'

const TYPE_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'monster', label: 'Monstros' },
  { value: 'spell', label: 'Magias' },
  { value: 'trap', label: 'Armadilhas' },
]

/**
 * Card picker + stat editor for a single zone.
 *
 * `slot` is always the live object coming from the field state, so replacing
 * the card or editing a value is reflected here immediately.
 */
export function SlotEditorModal({
  slot,
  cards,
  onClose,
  onSelectCard,
  onClear,
  onTogglePosition,
  onConclude,
  onSetStat,
  onResetStat,
  onResetStats,
}) {
  const zoneId = slot?.zoneId
  const card = slot?.card || null
  const meta = getStatMeta(card)
  const allowedTypes = getZoneAllowedTypes(zoneId)

  const dialogRef = useRef(null)
  const scrollRef = useRef(null)
  const previouslyFocusedRef = useRef(null)
  const [showSearch, setShowSearch] = useState(false)

  const {
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    results,
    totalMatches,
    loading,
    isFiltered,
    clearFilters,
  } = useCardSearch(cards, { allowedTypes })

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement
    dialogRef.current?.focus()
    return () => {
      if (previouslyFocusedRef.current instanceof HTMLElement) {
        previouslyFocusedRef.current.focus()
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const label = ZONE_LABELS[zoneId] || zoneId
  const canEditStats = !!meta?.isMonster

  // Texto da carta: monstros de efeito (e magias/armadilhas) exibem o efeito.
  const effectText = String(card?.text?.pt?.effect || card?.text?.en?.effect || '').trim()
  const classifications = Array.isArray(card?.classifications)
    ? card.classifications.map(item => String(item).toLowerCase())
    : []
  const isVanillaMonster =
    String(card?.cardType || '').toLowerCase() === 'monster' &&
    classifications.includes('normal') &&
    !classifications.includes('effect')
  const showEffect = !!effectText && !isVanillaMonster

  // Volta ao topo apos trocar a carta, senao a lista preserva o scroll antigo.
  const resetScroll = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }

  // Renderizado no body: garante que o overlay cubra a viewport inteira e que
  // o `position: fixed` nao seja contido por algum ancestral transformado.
  return createPortal(
    <div className="slot-editor-overlay" onClick={onClose} data-no-swipe>
      <div
        className="slot-editor"
        role="dialog"
        aria-modal="true"
        aria-label={`Editar ${label}`}
        tabIndex={-1}
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="slot-editor-header">
          <h3>{label}</h3>
          <button type="button" className="slot-editor-close" onClick={onClose} aria-label="Fechar">
            &times;
          </button>
        </header>

        <div className="slot-editor-scroll" data-scrollable ref={scrollRef}>
          <div className="slot-editor-current">
            {card ? (
              <>
                <img className="slot-editor-image" src={getCardImage(card)} alt="" />
                <div className="slot-editor-current-info">
                  <strong>{getCardName(card)}</strong>
                  {meta?.isMonster && (
                    <span>
                      Impresso: ATK {meta.atk ?? '?'} · DEF {meta.hasDef ? meta.def : '—'} ·{' '}
                      {meta.levelLabel} {meta.level ?? '?'}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <span className="slot-editor-empty">Nenhuma carta nesta zona.</span>
            )}
          </div>

          {showEffect && (
            <div className="slot-editor-effect">
              <span className="slot-editor-effect-title">Efeito</span>
              <p>{effectText}</p>
            </div>
          )}

          {canEditStats && card && (
            <div className="slot-editor-stats">
              <StatAdjuster
                label="ATK"
                value={slot.atk}
                originalValue={slot.originalAtk}
                min={0}
                onChange={(value) => onSetStat('atk', value)}
                onReset={() => onResetStat('atk')}
              />
              {meta.hasDef && (
                <StatAdjuster
                  label="DEF"
                  value={slot.def}
                  originalValue={slot.originalDef}
                  min={0}
                  onChange={(value) => onSetStat('def', value)}
                  onReset={() => onResetStat('def')}
                />
              )}
              <StatAdjuster
                label={meta.levelLabel}
                value={slot.level}
                originalValue={slot.originalLevel}
                min={meta.levelMin}
                max={LEVEL_MAX}
                onChange={(value) => onSetStat('level', value)}
                onReset={() => onResetStat('level')}
              />
            </div>
          )}

          {showSearch && (
            <div className="slot-editor-search" data-no-swipe>
              <input
                type="search"
                className="slot-editor-search-input"
                placeholder="Buscar carta pelo nome..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                autoFocus
              />

              <div className="slot-editor-filters">
                {TYPE_FILTERS.map(filter => (
                  <button
                    type="button"
                    key={filter.value}
                    className={`slot-editor-filter${typeFilter === filter.value ? ' is-active' : ''}`}
                    onClick={() => setTypeFilter(filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}
                {isFiltered && (
                  <button type="button" className="slot-editor-filter is-ghost" onClick={clearFilters}>
                    Limpar filtros
                  </button>
                )}
              </div>

              <div className="slot-editor-results" data-scrollable>
                {loading && <p className="slot-editor-status">Carregando cartas...</p>}
                {!loading && results.length === 0 && (
                  <p className="slot-editor-status">
                    Nenhuma carta encontrada para esta zona.
                  </p>
                )}
                {!loading && results.length > 0 && (
                  <p className="slot-editor-count">
                    {results.length} de {totalMatches} carta(s)
                  </p>
                )}

                <ul className="slot-editor-list">
                  {results.map(result => (
                    <li key={result.id}>
                      <button
                        type="button"
                        className={`slot-editor-result${result.id === slot?.cardId ? ' is-selected' : ''}`}
                        onClick={() => {
                          onSelectCard(result)
                          setShowSearch(false)
                          resetScroll()
                        }}
                      >
                        <img src={getCardImage(result)} alt="" loading="lazy" />
                        <span className="slot-editor-result-name">{getCardName(result)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="slot-editor-actions">
          <button
            type="button"
            className="slot-editor-button"
            onClick={() => setShowSearch(prev => !prev)}
          >
            {showSearch ? 'Fechar busca' : card ? 'Trocar carta' : 'Adicionar carta'}
          </button>
          {card && <button type="button" className="slot-editor-button is-danger" onClick={onClear}>Remover</button>}
          {canEditStats && (
            <button type="button" className="slot-editor-button" onClick={onResetStats}>
              Restaurar atributos
            </button>
          )}
          {card && (
            <button
              type="button"
              className="slot-editor-button"
              onClick={onTogglePosition}
              aria-pressed={slot.position === 'defense'}
            >
              {slot.position === 'defense' ? 'Modo ataque' : 'Modo defesa'}
            </button>
          )}
          <button type="button" className="slot-editor-button is-primary" onClick={onConclude}>
            Concluir
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default SlotEditorModal
