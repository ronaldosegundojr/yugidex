import { getStatMeta, compareStat, STAT_DIRECTION, getCardName, getCardImage } from '../cardUtils'
import { ZONE_LABELS, isPendulumZone, getPendulumColor, CARD_ASPECT_RATIO } from '../fieldLayout'

const StatBadge = ({ label, value, original, invertArrow = false }) => {
  if (value === null || value === undefined) return null

  const status = compareStat(value, original)
  const { arrow, sign } = STAT_DIRECTION[status]
  const delta = original !== null && original !== undefined ? value - original : 0
  const arrowChar = invertArrow ? (arrow === '▲' ? '▼' : arrow === '▼' ? '▲' : '') : arrow

  return (
    <span className={`field-slot-stat stat-${status}`}>
      {label} {value}
      {status !== 'neutral' && (
        <span className="field-slot-delta">
          <span aria-hidden="true">{arrowChar}</span>
          {sign}
          {Math.abs(delta)}
        </span>
      )}
    </span>
  )
}

const PendulumDiamond = ({ color, className = '' }) => (
  <span className={`field-pendulum-diamond is-${color} ${className}`} aria-hidden="true" />
)

/**
 * Placa grande de ATK/DEF/Level encaixada na base do slot.
 * Ela e mais larga que a carta e transborda para os espacamentos laterais,
 * ficando visualmente fora do quadro do slot.
 */
const StatPlate = ({ atk, def, level, levelLabel, showDef }) => {
  const items = []

  if (atk.value !== null && atk.value !== undefined) {
    items.push({ key: 'atk', label: 'ATK', value: atk.value, original: atk.original, invert: false })
  }

  if (showDef && def.value !== null && def.value !== undefined) {
    items.push({ key: 'def', label: 'DEF', value: def.value, original: def.original, invert: true })
  }

  if (level.value !== null && level.value !== undefined) {
    items.push({ key: 'level', label: levelLabel, value: level.value, original: level.original })
  }

  if (items.length === 0) return null

  return (
    <div className="field-stat-plate" aria-hidden="true">
      {items.map((item) => {
        const status = compareStat(item.value, item.original)
        const { arrow, sign } = STAT_DIRECTION[status]
        const delta = item.original !== null && item.original !== undefined ? item.value - item.original : 0
        const arrowChar = item.invert
          ? (arrow === '▲' ? '▼' : arrow === '▼' ? '▲' : '')
          : arrow

        return (
          <span key={item.key} className={`field-plate-stat stat-${status}`}>
            <span className="field-plate-label">{item.label}</span>
            <span className="field-plate-value">{item.value}</span>
            {status !== 'neutral' && (
              <span className="field-plate-delta">
                <span aria-hidden="true">{arrowChar}</span>
                {sign}
                {Math.abs(delta)}
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}

/**
 * Slot individual do campo.
 *
 * `variant`:
 *   'card'   -> vertical (proporcao de carta)
 *   'field'  -> deitado, para a Zona de Campo
 *   'lateral'-> contorno decorativo, sem clique (Deck/Cemiterio/Extra Deck)
 */
export function FieldZone({
  side,
  zoneId,
  slot,
  onOpen,
  variant = 'card',
  decorativeLabel = '',
  showPendulum = false,
  onTogglePosition,
  plateSide = 'bottom',
}) {
  const card = slot?.card || null
  const label = ZONE_LABELS[zoneId] || decorativeLabel || zoneId
  const meta = getStatMeta(card)
  const sideLabel = side === 'opponent' ? 'Oponente' : 'Jogador'
  const isDefense = slot?.position === 'defense'
  const cardName = card ? getCardName(card) : ''
  const pendulumColor = isPendulumZone(zoneId) ? getPendulumColor(zoneId) : null

  // Slot lateral: apenas contorno decorativo, sem interacao.
  if (variant === 'lateral') {
    return (
      <div
        className={`field-zone field-zone-lateral field-zone-${variant}`}
        aria-hidden="true"
        style={{ '--card-aspect': CARD_ASPECT_RATIO }}
      >
        <span className="field-lateral-label">{decorativeLabel}</span>
      </div>
    )
  }

  const className = [
    'field-zone',
    `field-zone-${variant}`,
    `field-zone-${zoneId}`,
    card ? 'is-filled' : '',
    card && isDefense ? 'is-defense' : '',
    // Placa de atributos alterna acima/abaixo entre monstros vizinhos, para
    // as placas nao se sobreporem quando ha varios monstros em linha.
    card ? `plate-${plateSide}` : '',
    pendulumColor ? `has-pendulum is-pendulum-${pendulumColor}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className} style={{ '--card-aspect': CARD_ASPECT_RATIO }}>
      <button
        type="button"
        className="field-zone-target"
        onClick={() => onOpen(side, zoneId)}
        aria-label={`${label} — ${sideLabel}${card ? `: ${cardName}${isDefense ? ' (defesa)' : ''}` : ', vazia'}`}
        title={card ? `${cardName}${isDefense ? ' — modo defesa' : ''}` : label}
      >
        {card ? (
          <>
            <img className="field-zone-image" src={getCardImage(card)} alt="" loading="lazy" />
            {showPendulum && pendulumColor && (
              <PendulumDiamond color={pendulumColor} className="field-pendulum-corner" />
            )}
            <StatPlate
              atk={{ value: slot.atk, original: slot.originalAtk }}
              def={{ value: slot.def, original: slot.originalDef }}
              level={{ value: slot.level, original: slot.originalLevel }}
              levelLabel={meta?.levelLabel}
              showDef={meta?.hasDef}
            />
            <span className="field-zone-stats">
              {meta?.hasAtk && (
                <StatBadge label="ATK" value={slot.atk} original={slot.originalAtk} />
              )}
              {meta?.hasDef && (
                <StatBadge label="DEF" value={slot.def} original={slot.originalDef} invertArrow />
              )}
              {meta?.hasLevel && slot.level !== null && slot.level !== undefined && (
                <StatBadge
                  label={meta.levelLabel}
                  value={slot.level}
                  original={slot.originalLevel}
                />
              )}
            </span>
          </>
        ) : (
          <>
            {showPendulum && pendulumColor && (
              <PendulumDiamond color={pendulumColor} className="field-pendulum-center" />
            )}
            <span className="field-zone-empty">{label}</span>
          </>
        )}
      </button>

      {card && (
        <>
          {/* Alterna entre modo de ataque (em pe) e de defesa (deitada). */}
          <button
            type="button"
            className="field-zone-rotate"
            onClick={() => onTogglePosition?.(side, zoneId)}
            disabled={!onTogglePosition}
            aria-label={`Colocar ${cardName} em modo de ${isDefense ? 'ataque' : 'defesa'}`}
            title={isDefense ? 'Modo defesa — clique para em pe' : 'Modo ataque — clique para deitar'}
          >
            {isDefense ? '⏍' : '⇅'}
          </button>
          <button
            type="button"
            className="field-zone-remove"
            onClick={() => onOpen(side, zoneId, { remove: true })}
            aria-label={`Remover carta de ${label}`}
            title="Remover"
          >
            ✕
          </button>
        </>
      )}
    </div>
  )
}

export default FieldZone
