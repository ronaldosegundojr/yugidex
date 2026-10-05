import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { getStatMeta, parseNumeric } from '../cardUtils'
import { ALL_ZONE_IDS } from '../fieldLayout'

const STORAGE_VERSION = 1
const STORAGE_PREFIX = `ygo_battle_field_v${STORAGE_VERSION}_`

const createEmptySlot = (zoneId) => ({
  zoneId,
  cardId: null,
  card: null,
  atk: null,
  def: null,
  level: null,
  originalAtk: null,
  originalDef: null,
  originalLevel: null,
  // 'attack' = carta em pe | 'defense' = carta deitada.
  position: 'attack',
})

const createEmptySide = () => {
  const side = {}
  ALL_ZONE_IDS.forEach(zoneId => {
    side[zoneId] = createEmptySlot(zoneId)
  })
  return side
}

const createEmptyField = () => ({
  player: createEmptySide(),
  opponent: createEmptySide(),
})

const clampStat = (value) => {
  const numeric = parseNumeric(value)
  if (numeric === null) return null
  return Math.max(0, numeric)
}

/**
 * Rebuilds a side from a persisted snapshot, re-attaching the live card objects
 * from the shared card database so images/names stay correct after updates.
 */
const hydrateSide = (persistedSide, cardsById) => {
  const side = createEmptySide()
  if (!persistedSide) return side

  ALL_ZONE_IDS.forEach(zoneId => {
    const saved = persistedSide[zoneId]
    if (!saved || saved.cardId === null || saved.cardId === undefined) return

    const card = cardsById.get(saved.cardId) || saved.card || null
    const meta = getStatMeta(card)

    const slot = {
      zoneId,
      cardId: saved.cardId,
      card,
      atk: saved.atk ?? null,
      def: saved.def ?? null,
      level: saved.level ?? null,
      originalAtk: saved.originalAtk ?? null,
      originalDef: saved.originalDef ?? null,
      originalLevel: saved.originalLevel ?? null,
      // Attack/defence posture, persisted with the rest of the slot.
      // Default 'attack' keeps older snapshots (saved before this field existed).
      position: saved.position === 'defense' ? 'defense' : 'attack',
    }

    // First run after a data update: fall back to the database values.
    if (meta && saved.originalAtk === null && meta.atk !== null) {
      slot.atk = meta.atk
      slot.originalAtk = meta.atk
    }
    if (meta && saved.originalDef === null && meta.hasDef) {
      slot.def = meta.def
      slot.originalDef = meta.def
    }
    if (meta && saved.originalLevel === null && meta.level !== null) {
      slot.level = meta.level
      slot.originalLevel = meta.level
    }

    side[zoneId] = slot
  })

  return side
}

/** Only the minimum needed to rebuild the field is written to localStorage. */
const serializeField = (field) => {
  const stripSide = (side) => {
    const out = {}
    ALL_ZONE_IDS.forEach(zoneId => {
      const slot = side[zoneId]
      if (!slot || slot.cardId === null || slot.cardId === undefined) return
      out[zoneId] = {
        cardId: slot.cardId,
        atk: slot.atk,
        def: slot.def,
        level: slot.level,
        originalAtk: slot.originalAtk,
        originalDef: slot.originalDef,
        originalLevel: slot.originalLevel,
        position: slot.position === 'defense' ? 'defense' : 'attack',
      }
    })
    return out
  }

  return {
    version: STORAGE_VERSION,
    updatedAt: Date.now(),
    player: stripSide(field.player),
    opponent: stripSide(field.opponent),
  }
}

export function useFieldState(battleId, cards) {
  const cardsById = useMemo(() => {
    const map = new Map()
    if (Array.isArray(cards)) cards.forEach(card => map.set(card.id, card))
    return map
  }, [cards])

  // Cards load asynchronously, so the snapshot is rebuilt once the database
  // becomes available (slot ids stay intact either way).
  const cardsReady = cardsById.size > 0
  const loadKey = `${battleId}|${cardsReady ? 'ready' : 'loading'}`

  const loadField = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + battleId)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && parsed.version === STORAGE_VERSION) {
          return {
            player: hydrateSide(parsed.player, cardsById),
            opponent: hydrateSide(parsed.opponent, cardsById),
          }
        }
      }
    } catch (error) {
      console.warn('Não foi possível restaurar o campo salvo:', error)
    }
    return createEmptyField()
  }, [battleId, cardsById])

  const [state, setState] = useState(() => ({ loadKey, field: loadField() }))

  // Adjusting state when the inputs change (documented React pattern) instead
  // of syncing through an effect.
  if (state.loadKey !== loadKey) {
    setState({ loadKey, field: loadField() })
  }

  const field = state.field
  const saveTimerRef = useRef(null)
  const previousBattleRef = useRef(battleId)

  // Drop the snapshot of the battle that just ended.
  useEffect(() => {
    const previous = previousBattleRef.current
    if (previous && previous !== battleId) {
      try {
        localStorage.removeItem(STORAGE_PREFIX + previous)
      } catch (error) {
        console.warn('Não foi possível limpar o campo anterior:', error)
      }
    }
    previousBattleRef.current = battleId
  }, [battleId])

  // Debounced persistence + a synchronous flush when the tab goes away.
  useEffect(() => {
    const save = () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      try {
        localStorage.setItem(
          STORAGE_PREFIX + battleId,
          JSON.stringify(serializeField(field)),
        )
      } catch (error) {
        console.warn('Não foi possível salvar o campo:', error)
      }
    }

    saveTimerRef.current = setTimeout(save, 300)

    const flush = () => save()
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', flush)

    return () => {
      save()
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', flush)
    }
  }, [field, battleId])

  const updateSlot = useCallback((side, zoneId, updater) => {
    setState(prev => {
      const current = prev.field[side]?.[zoneId]
      if (!current) return prev
      const next = updater(current)
      if (next === current) return prev
      return {
        ...prev,
        field: { ...prev.field, [side]: { ...prev.field[side], [zoneId]: next } },
      }
    })
  }, [])

  const setCard = useCallback((side, zoneId, card) => {
    if (!card) return
    const meta = getStatMeta(card)

    updateSlot(side, zoneId, () => ({
      zoneId,
      cardId: card.id,
      card,
      atk: meta?.hasAtk ? meta.atk : null,
      def: meta?.hasDef ? meta.def : null,
      level: meta?.hasLevel ? meta.level : null,
      originalAtk: meta?.hasAtk ? meta.atk : null,
      originalDef: meta?.hasDef ? meta.def : null,
      originalLevel: meta?.hasLevel ? meta.level : null,
      // Nova carta sempre entra em modo de ataque.
      position: 'attack',
    }))
  }, [updateSlot])

  const clearSlot = useCallback((side, zoneId) => {
    updateSlot(side, zoneId, () => createEmptySlot(zoneId))
  }, [updateSlot])

  const setStat = useCallback((side, zoneId, stat, value) => {
    updateSlot(side, zoneId, current => ({ ...current, [stat]: clampStat(value) }))
  }, [updateSlot])

  const resetStat = useCallback((side, zoneId, stat) => {
    const originalKey = `original${stat.charAt(0).toUpperCase()}${stat.slice(1)}`
    updateSlot(side, zoneId, current => ({
      ...current,
      [stat]: current[originalKey] ?? null,
    }))
  }, [updateSlot])

  const resetSlotStats = useCallback((side, zoneId) => {
    updateSlot(side, zoneId, current => ({
      ...current,
      atk: current.originalAtk ?? null,
      def: current.originalDef ?? null,
      level: current.originalLevel ?? null,
    }))
  }, [updateSlot])

  const setPosition = useCallback((side, zoneId, position) => {
    updateSlot(side, zoneId, current => ({
      ...current,
      position: position === 'defense' ? 'defense' : 'attack',
    }))
  }, [updateSlot])

  const togglePosition = useCallback((side, zoneId) => {
    updateSlot(side, zoneId, current => ({
      ...current,
      position: current.position === 'defense' ? 'attack' : 'defense',
    }))
  }, [updateSlot])

  const resetField = useCallback(() => {
    setState(prev => ({ ...prev, field: createEmptyField() }))
  }, [])

  const getSlot = useCallback((side, zoneId) => field[side]?.[zoneId] ?? null, [field])

  const countCards = useCallback((side) => {
    const sideState = field[side] || {}
    return ALL_ZONE_IDS.reduce(
      (total, zoneId) => total + (sideState[zoneId]?.cardId ? 1 : 0),
      0,
    )
  }, [field])

  const moveCard = useCallback((fromSide, fromZone, toSide, toZone) => {
    setState(prev => {
      const source = prev.field[fromSide]?.[fromZone]
      if (!source?.cardId || !prev.field[toSide]?.[toZone]) return prev
      if (fromSide === toSide && fromZone === toZone) return prev

      return {
        ...prev,
        field: {
          ...prev.field,
          [fromSide]: { ...prev.field[fromSide], [fromZone]: createEmptySlot(fromZone) },
          [toSide]: { ...prev.field[toSide], [toZone]: { ...source, zoneId: toZone } },
        },
      }
    })
  }, [])

  return {
    field,
    setCard,
    clearSlot,
    setStat,
    resetStat,
    resetSlotStats,
    setPosition,
    togglePosition,
    resetField,
    getSlot,
    countCards,
    moveCard,
  }
}