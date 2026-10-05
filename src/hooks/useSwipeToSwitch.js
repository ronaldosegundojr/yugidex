import { useCallback, useEffect, useRef } from 'react'

const MIN_DISTANCE = 48
const MIN_DISTANCE_FAST = 24
const VELOCITY_THRESHOLD = 0.35
const AXIS_LOCK = 8

const INTERACTIVE_SELECTOR = [
  'button',
  'a',
  'input',
  'select',
  'textarea',
  'label',
  '[role="button"]',
  '[role="dialog"]',
  '[data-no-swipe]',
  '[data-scrollable]',
].join(', ')

const shouldIgnoreKeyboard = (target) =>
  !!target?.closest?.('input, select, textarea, [contenteditable="true"]') ||
  // Com um modal aberto o switcher nao pode roubar as setas.
  !!document.querySelector('[role="dialog"]')

/**
 * Troca de tela por gesto horizontal, sem mover nenhum elemento.
 *
 * Nao aplicamos transform em nenhum ancestral das telas: isso criaria um
 * containing block para os `position: fixed` dos modais e ainda alteraria o
 * layout original da tela de LP.
 */
export function useSwipeToSwitch({ count, index, onIndexChange, enabled = true }) {
  const gestureRef = useRef(null)
  const indexRef = useRef(index)
  const countRef = useRef(count)

  useEffect(() => {
    indexRef.current = index
    countRef.current = count
  }, [index, count])

  const goTo = useCallback((nextIndex) => {
    const total = countRef.current
    if (total < 1) return
    const clamped = Math.max(0, Math.min(total - 1, nextIndex))
    if (clamped !== indexRef.current) onIndexChange?.(clamped)
  }, [onIndexChange])

  const handlePointerDown = useCallback((event) => {
    if (!enabled || countRef.current < 2) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (event.target?.closest?.(INTERACTIVE_SELECTOR)) return

    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startT: performance.now(),
      axis: null,
    }
  }, [enabled])

  const handlePointerMove = useCallback((event) => {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return

    const deltaX = event.clientX - gesture.startX
    const deltaY = event.clientY - gesture.startY

    if (gesture.axis) return

    if (Math.abs(deltaX) < AXIS_LOCK && Math.abs(deltaY) < AXIS_LOCK) return

    // Predomina vertical: leave the gesture to the page (scroll).
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      gestureRef.current = null
      return
    }

    gesture.axis = 'x'
  }, [])

  const endGesture = useCallback((event) => {
    const gesture = gestureRef.current
    gestureRef.current = null
    if (!gesture || gesture.pointerId !== event.pointerId) return
    if (gesture.axis !== 'x') return

    const deltaX = event.clientX - gesture.startX
    const elapsed = Math.max(1, performance.now() - gesture.startT)
    const velocity = deltaX / elapsed

    const farEnough = Math.abs(deltaX) >= MIN_DISTANCE
    const fastEnough = Math.abs(velocity) >= VELOCITY_THRESHOLD && Math.abs(deltaX) >= MIN_DISTANCE_FAST
    if (!farEnough && !fastEnough) return

    if (deltaX < 0) goTo(indexRef.current + 1)
    else goTo(indexRef.current - 1)
  }, [goTo])

  const cancelGesture = useCallback(() => {
    gestureRef.current = null
  }, [])

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerup', endGesture)
    window.addEventListener('pointercancel', cancelGesture)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', endGesture)
      window.removeEventListener('pointercancel', cancelGesture)
    }
  }, [handlePointerMove, endGesture, cancelGesture])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!enabled || countRef.current < 2) return
      if (shouldIgnoreKeyboard(event.target)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goTo(indexRef.current + 1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goTo(indexRef.current - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, goTo])

  return {
    handlePointerDown,
    goTo,
    next: () => goTo(indexRef.current + 1),
    prev: () => goTo(indexRef.current - 1),
  }
}
