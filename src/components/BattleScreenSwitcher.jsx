import { useSwipeToSwitch } from '../hooks/useSwipeToSwitch'

/**
 * Alternador de telas da batalha (LP <-> Campo de Batalha).
 *
 * Regra importante: a tela ativa usa `display: contents`, ou seja, o wrapper
 * nao gera nenhuma caixa e o layout da tela de LP fica EXATAMENTE como estava
 * antes desta feature. A tela inativa usa `display: none`, continua montada
 * (preservando LP, historico e o campo) e nao recebe foco nem cliques.
 *
 * Nenhum transform e aplicado aqui de proposito: um ancestral com transform
 * viraria containing block dos `position: fixed` dos modais.
 */
export function BattleScreenSwitcher({ index, onIndexChange, screens }) {
  const count = screens.length
  const { handlePointerDown, prev, next } = useSwipeToSwitch({
    count,
    index,
    onIndexChange,
  })

  return (
    <div className="battle-screens" onPointerDown={handlePointerDown}>
      {screens.map((screen, screenIndex) => (
        <div
          key={screen.key}
          className="battle-screen-slot"
          style={{ display: screenIndex === index ? 'contents' : 'none' }}
          aria-hidden={screenIndex === index ? undefined : 'true'}
          inert={screenIndex !== index}
        >
          {screen.node}
        </div>
      ))}

      <nav className="battle-screen-nav" aria-label="Telas da batalha">
        <button
          type="button"
          className="carousel-arrow"
          onClick={prev}
          disabled={index === 0}
          aria-label="Tela anterior"
        >
          ‹
        </button>

        <div className="carousel-dots">
          {screens.map((screen, screenIndex) => (
            <button
              type="button"
              key={screen.key}
              className={`carousel-tab${screenIndex === index ? ' is-active' : ''}`}
              onClick={() => onIndexChange(screenIndex)}
              aria-current={screenIndex === index ? 'page' : undefined}
            >
              {screen.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="carousel-arrow"
          onClick={next}
          disabled={index === count - 1}
          aria-label="Próxima tela"
        >
          ›
        </button>
      </nav>
    </div>
  )
}

export default BattleScreenSwitcher
