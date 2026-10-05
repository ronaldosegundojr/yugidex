import FieldZone from './FieldZone'
import PlayerIndicator from './PlayerIndicator'
import { FRONT_ROW_ZONE_IDS, BACK_ROW_ZONE_IDS } from '../fieldLayout'

/** Laterais decorativas (nao clicaveis) das colunas 1 e 7. */
const LATERALS = [
  { label: 'Deck' },
  { label: 'Cemitério' },
  { label: 'Deck' },
  { label: 'Extra Deck' },
]

/**
 * Meio campo de um duelista: 7 colunas x 2 fileiras (frente + tras), com as
 * colunas laterais decorativas. O DOM e identico para os dois lados; o oponente
 * e rotacionado 180 graus pelo CSS, o que espelha fileiras, colunas e os
 * losangos de pendulo.
 */
export function FieldSide({ side, countCards, getSlot, onOpenZone, onTogglePosition, label }) {
  const slot = (zoneId) => getSlot(side, zoneId)

  // Cada linha usa um rotulo lateral proprio: Deck/Cemiterio na de tras e
  // Deck/Extra Deck na da frente.
  const row = (zoneIds, { pendulum = false, left = LATERALS[0], right = LATERALS[1] } = {}) => (
    <>
      <FieldZone side={side} variant="lateral" decorativeLabel={left.label} />
      {zoneIds.map((zoneId, index) => (
        <FieldZone
          key={zoneId}
          side={side}
          zoneId={zoneId}
          slot={slot(zoneId)}
          onOpen={onOpenZone}
          onTogglePosition={onTogglePosition}
          showPendulum={pendulum}
          /* Alterna a placa acima/abaixo a cada monstro vizinho, evitando
             que os valores de monstros seguidos se sobreponham. */
          plateSide={index % 2 === 0 ? 'top' : 'bottom'}
        />
      ))}
      <FieldZone side={side} variant="lateral" decorativeLabel={right.label} />
    </>
  )

  return (
    <section className={`field-side field-side-${side}`} aria-label={label}>
      <PlayerIndicator side={side} cardCount={countCards(side)} />

      <div className="field-side-grid">
        {row(FRONT_ROW_ZONE_IDS, { left: LATERALS[0], right: LATERALS[3] })}
        {row(BACK_ROW_ZONE_IDS, { pendulum: true, left: LATERALS[0], right: LATERALS[1] })}
      </div>
    </section>
  )
}

export default FieldSide
