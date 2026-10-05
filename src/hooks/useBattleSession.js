import { useState, useCallback, useEffect } from 'react'

const SESSION_KEY = 'ygo_battle_session_v1'

const readSessions = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (error) {
    console.warn('Não foi possível ler a sessão de batalha:', error)
    return {}
  }
}

const writeSessions = (sessions) => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessions))
  } catch (error) {
    console.warn('Não foi possível salvar a sessão de batalha:', error)
  }
}

const createBattleId = () =>
  `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

/**
 * Gives the current battle a stable identity so the field can be persisted per
 * duel (survives reloads, cleared when a new battle starts).
 */
export function useBattleSession(mode) {
  const [battleId, setBattleId] = useState(() => {
    const sessions = readSessions()
    return sessions[mode] || createBattleId()
  })

  const persist = useCallback((nextBattleId) => {
    const sessions = readSessions()
    sessions[mode] = nextBattleId
    writeSessions(sessions)
  }, [mode])

  const startNewBattle = useCallback(() => {
    const nextBattleId = createBattleId()
    setBattleId(nextBattleId)
    persist(nextBattleId)
  }, [persist])

  // Make sure the id is registered even on the very first visit.
  useEffect(() => {
    const sessions = readSessions()
    if (sessions[mode] === battleId) return
    sessions[mode] = battleId
    writeSessions(sessions)
  }, [mode, battleId])

  return { battleId, startNewBattle }
}
