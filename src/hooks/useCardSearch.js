import { useState, useMemo, useCallback } from 'react'
import { normalizeText, useDebounce } from '../cardUtils'

const SEARCH_DEBOUNCE_MS = 200
export const SEARCH_RESULT_LIMIT = 60

const matchesLevelFilter = (card, levelFilter) => {
  if (!levelFilter) return true
  const level = card.level || 0
  const type = card._cardType

  if (levelFilter === '1-3') return level >= 1 && level <= 3
  if (levelFilter === '4-6') return level >= 4 && level <= 6
  if (levelFilter === '7+') return level >= 7
  if (levelFilter === 'spell') return type === 'spell'
  if (levelFilter === 'trap') return type === 'trap'
  return true
}

/**
 * Same search behaviour as the /deck library panel: debounced term, shared
 * normalization (so "dragao" finds "Dragão") and the same filters.
 */
export function useCardSearch(cards, options = {}) {
  const {
    limit = SEARCH_RESULT_LIMIT,
    allowedTypes = null,
    initialSearchTerm = '',
    initialTypeFilter = '',
    initialLevelFilter = '',
    initialAttrFilter = '',
  } = options

  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [typeFilter, setTypeFilter] = useState(initialTypeFilter)
  const [levelFilter, setLevelFilter] = useState(initialLevelFilter)
  const [attrFilter, setAttrFilter] = useState(initialAttrFilter)

  const debouncedSearchTerm = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS)

  const cardsAvailable = Array.isArray(cards) && cards.length > 0
  const loading = !cardsAvailable
  const error = null

  const results = useMemo(() => {
    if (!cardsAvailable) return []

    const normalizedSearch = normalizeText(debouncedSearchTerm)
    const hasSearch = !!debouncedSearchTerm
    const lowerAttr = attrFilter ? attrFilter.toLowerCase() : null
    const matches = []

    for (const card of cards) {
      if (hasSearch && !card._normalizedNames?.includes(normalizedSearch)) continue
      if (typeFilter && card._cardType !== typeFilter) continue
      if (attrFilter && String(card.attribute || '').toLowerCase() !== lowerAttr) continue
      if (!matchesLevelFilter(card, levelFilter)) continue
      if (allowedTypes && !allowedTypes.includes(card._cardType)) continue

      matches.push(card)
      if (limit > 0 && matches.length >= limit) break
    }

    return matches
  }, [cards, cardsAvailable, debouncedSearchTerm, typeFilter, levelFilter, attrFilter, allowedTypes, limit])

  const totalMatches = useMemo(() => {
    if (!cardsAvailable) return 0
    const normalizedSearch = normalizeText(debouncedSearchTerm)
    const hasSearch = !!debouncedSearchTerm
    const lowerAttr = attrFilter ? attrFilter.toLowerCase() : null
    let total = 0

    for (const card of cards) {
      if (hasSearch && !card._normalizedNames?.includes(normalizedSearch)) continue
      if (typeFilter && card._cardType !== typeFilter) continue
      if (attrFilter && String(card.attribute || '').toLowerCase() !== lowerAttr) continue
      if (!matchesLevelFilter(card, levelFilter)) continue
      if (allowedTypes && !allowedTypes.includes(card._cardType)) continue
      total += 1
    }

    return total
  }, [cards, cardsAvailable, debouncedSearchTerm, typeFilter, levelFilter, attrFilter, allowedTypes])

  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setTypeFilter('')
    setLevelFilter('')
    setAttrFilter('')
  }, [])

  const isFiltered = !!(searchTerm || typeFilter || levelFilter || attrFilter)

  return {
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    levelFilter,
    setLevelFilter,
    attrFilter,
    setAttrFilter,
    results,
    totalMatches,
    loading,
    error,
    isFiltered,
    clearFilters,
  }
}