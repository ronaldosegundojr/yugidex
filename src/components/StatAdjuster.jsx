import { compareStat, STAT_DIRECTION } from '../cardUtils'

const QUICK_DELTAS = [-1000, -500, -100, 100, 500, 1000]

const clamp = (raw, min, max) => {
  const numeric = Number(raw)
  if (!Number.isFinite(numeric)) return null
  const lowerBounded = Math.max(min, numeric)
  return max !== undefined ? Math.min(max, lowerBounded) : lowerBounded
}

/**
 * ATK / DEF / Level-Rank-Link controls for a single field slot.
 * Stat changes are always relative to the printed value and can be undone.
 */
export function StatAdjuster({ label, value, originalValue, min = 0, max, onChange, onReset }) {
  const status = compareStat(value, originalValue)
  const { arrow, sign } = STAT_DIRECTION[status]
  const delta = value !== null && originalValue !== null ? value - originalValue : 0
  const displayed = value === null || value === undefined ? '' : String(value)

  const handleStep = (amount) => {
    const base = value ?? originalValue ?? 0
    onChange(clamp(base + amount, min, max))
  }

  const handleInputChange = (event) => {
    const raw = event.target.value
    onChange(raw.trim() === '' ? null : clamp(raw, min, max))
  }

  return (
    <div className={`stat-adjuster stat-${status}`}>
      <div className="stat-adjuster-head">
        <span className="stat-label">{label}</span>
        <span className="stat-original">
          Original: {originalValue === null || originalValue === undefined ? '?' : originalValue}
        </span>
      </div>

      <div className="stat-controls">
        <button
          type="button"
          className="stat-step"
          onClick={() => handleStep(-1)}
          aria-label={`Diminuir ${label}`}
        >
          −
        </button>

        <input
          className="stat-input"
          type="number"
          inputMode="numeric"
          value={displayed}
          min={min}
          max={max}
          onChange={handleInputChange}
          aria-label={`${label} atual`}
        />

        <button
          type="button"
          className="stat-step"
          onClick={() => handleStep(1)}
          aria-label={`Aumentar ${label}`}
        >
          +
        </button>
      </div>

      <div className="stat-quick-row">
        {QUICK_DELTAS.map(amount => (
          <button
            type="button"
            key={amount}
            className={`stat-quick${amount > 0 ? ' is-up' : ' is-down'}`}
            onClick={() => handleStep(amount)}
            aria-label={`${amount > 0 ? 'Aumentar' : 'Diminuir'} ${label} em ${Math.abs(amount)}`}
          >
            {amount > 0 ? `+${amount}` : amount}
          </button>
        ))}
      </div>

      <div className="stat-current">
        <span className="stat-value">{value === null || value === undefined ? '?' : value}</span>
        {status !== 'neutral' && (
          <span className="stat-delta">
            <span className="stat-arrow" aria-hidden="true">{arrow}</span>
            {sign}
            {Math.abs(delta)} ({originalValue})
          </span>
        )}
        <button
          type="button"
          className="stat-reset"
          onClick={onReset}
          disabled={status === 'neutral'}
        >
          Restaurar
        </button>
      </div>
    </div>
  )
}

export default StatAdjuster
