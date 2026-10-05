export function PlayerIndicator({ side, cardCount }) {
  const isOpponent = side === 'opponent'

  return (
    <div className={`player-indicator player-indicator-${side}`}>
      <span
        className={`player-diamond${isOpponent ? ' is-opponent' : ''}`}
        aria-hidden="true"
      />
      <span className="player-name">{isOpponent ? 'Oponente' : 'Jogador'}</span>
      <span className="player-card-count">{cardCount} carta(s)</span>
    </div>
  )
}

export default PlayerIndicator
