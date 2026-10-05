import { useState, useCallback, useEffect } from 'react'
import FieldSide from './FieldSide'
import FieldZone from './FieldZone'
import SlotEditorModal from './SlotEditorModal'
import { useFieldState } from '../hooks/useFieldState'
import { playBattleSound, warmupBattleSounds } from '../battleSounds'
import { FIELD_SPELL_ZONE_ID } from '../fieldLayout'

/**
 * As duas Zonas de Monstro Extra do tabuleiro (colunas 3 e 5 da faixa central).
 * No jogo real existe um unico par no meio do campo, compartilhado pelos dois
 * lados -- por isso o oponente nao repete essas zonas aqui.
 */
const EXTRA_ZONE_IDS = [
  { zoneId: 'extra-monster-left', column: 3 },
  { zoneId: 'extra-monster-right', column: 5 },
]

/**
 * Tela do Campo de Batalha.
 *
 * Estrutura da referencia (7 colunas x 5 linhas):
 *   - lado do oponente (linhas 1 e 2) no topo, rotacionado 180 graus;
 *   - faixa central (linha 3) com a faixa cinza em degraus, o quadrado central
 *     decorativo, as duas Zonas de Campo deitadas e as Zonas de Monstro Extra;
 *   - lado do jogador (linhas 4 e 5) embaixo, na orientacao normal.
 */
export function FieldScreen({ battleId, mode, cards, currentTemplate, onBackToLP }) {
  const isDuo = mode === '2'
  const fieldApi = useFieldState(battleId, cards)

  // Destrava o audio no primeiro clique, para os efeitos tocarem sem atraso.
  useEffect(() => {
    warmupBattleSounds()
  }, [])
  const [editing, setEditing] = useState(null)

  const handleOpenZone = useCallback((side, zoneId, options) => {
    if (options?.remove) {
      fieldApi.clearSlot(side, zoneId)
      return
    }
    setEditing({ side, zoneId })
  }, [fieldApi])

  const closeEditor = useCallback(() => setEditing(null), [])

  const editingSlot = editing ? fieldApi.getSlot(editing.side, editing.zoneId) : null
  const showModal = !!editing && !!editingSlot

  // Cada carta que entra no campo toca o efeito de baixar carta.
  const handleSelectCard = useCallback((card) => {
    fieldApi.setCard(editing.side, editing.zoneId, card)
    playBattleSound('baixar-carta')
  }, [editing, fieldApi])

  // Concluir: fecha o modal e toca o efeito de baixar carta.
  const handleConclude = useCallback(() => {
    playBattleSound('baixar-carta')
    setEditing(null)
  }, [])

  // Qualquer mudanca de atributo (ATK/DEF/nivel) toca o efeito de ponto.
  const handleSetStat = useCallback((stat, value) => {
    fieldApi.setStat(editing.side, editing.zoneId, stat, value)
    playBattleSound('point-drop')
  }, [editing, fieldApi])

  const handleResetStat = useCallback((stat) => {
    fieldApi.resetStat(editing.side, editing.zoneId, stat)
    playBattleSound('point-drop')
  }, [editing, fieldApi])

  const handleResetStats = useCallback(() => {
    fieldApi.resetSlotStats(editing.side, editing.zoneId)
    playBattleSound('point-drop')
  }, [editing, fieldApi])

  // Alterna a postura da carta (em pe / deitada) direto no slot.
  const handleTogglePosition = useCallback((side, zoneId) => {
    fieldApi.togglePosition(side, zoneId)
  }, [fieldApi])

  return (
    <div className="field-screen" style={{ background: currentTemplate?.bgGradient }}>
      <div className="top-nav-wrapper">
        <div className="ygo-header-bar">
          <button type="button" className="ygo-nav-hex" onClick={onBackToLP} title="Voltar para os LP">
            ↩
          </button>
          <span className="field-screen-title">Campo de Batalha</span>
          <button type="button" className="ygo-nav-hex" onClick={fieldApi.resetField} title="Limpar campo">
            ⟲
          </button>
        </div>
      </div>

      <div className="field-body">
        <div className={`field-mat${isDuo ? ' is-duo' : ''}`}>
        {isDuo && (
          <FieldSide
            side="opponent"
            label="Campo do oponente"
            countCards={fieldApi.countCards}
            getSlot={fieldApi.getSlot}
            onOpenZone={handleOpenZone}
            onTogglePosition={handleTogglePosition}
          />
        )}

        <div className="field-center">
          {isDuo && (
            <div className="field-center-opponent">
              <div className="field-center-slot is-column-1">
                <FieldZone
                  side="opponent"
                  zoneId={FIELD_SPELL_ZONE_ID}
                  slot={fieldApi.getSlot('opponent', FIELD_SPELL_ZONE_ID)}
                  onOpen={handleOpenZone}
                  variant="field"
                />
              </div>
              </div>
          )}

          <div className="field-band" aria-hidden="true" />
          <div className="field-center-square" aria-hidden="true" />

          <div className="field-center-player">
            {EXTRA_ZONE_IDS.map(({ zoneId, column }, index) => (
              <div key={`pl-${zoneId}`} className={`field-center-slot is-column-${column}`}>
                <FieldZone
                  side="player"
                  zoneId={zoneId}
                  slot={fieldApi.getSlot('player', zoneId)}
                  onOpen={handleOpenZone}
                  onTogglePosition={handleTogglePosition}
                  /* Mesma alternancia das fileiras de monstros. */
                  plateSide={index % 2 === 0 ? 'top' : 'bottom'}
                />
              </div>
            ))}
            <div className="field-center-slot is-column-7">
              <FieldZone
                side="player"
                zoneId={FIELD_SPELL_ZONE_ID}
                slot={fieldApi.getSlot('player', FIELD_SPELL_ZONE_ID)}
                onOpen={handleOpenZone}
                variant="field"
              />
            </div>
          </div>
        </div>

        <FieldSide
          side="player"
          label="Seu campo"
          countCards={fieldApi.countCards}
          getSlot={fieldApi.getSlot}
          onOpenZone={handleOpenZone}
        />
        </div>
      </div>

      {showModal && (
        <SlotEditorModal
          slot={editingSlot}
          cards={cards}
          onClose={closeEditor}
          onSelectCard={handleSelectCard}
          onClear={() => {
            fieldApi.clearSlot(editing.side, editing.zoneId)
            closeEditor()
          }}
          onTogglePosition={() => {
            fieldApi.togglePosition(editing.side, editing.zoneId)
            playBattleSound('baixar-carta')
          }}
          onConclude={handleConclude}
          onSetStat={handleSetStat}
          onResetStat={handleResetStat}
          onResetStats={handleResetStats}
        />
      )}

      <p className="field-hint">
        Toque em uma zona para adicionar ou editar uma carta. Arraste na horizontal ou use as
        setas do teclado para trocar de tela.
      </p>
    </div>
  )
}

export default FieldScreen
