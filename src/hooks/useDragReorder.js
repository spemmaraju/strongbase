// Drag-to-reorder for a vertical list, built on Pointer Events.
// ---------------------------------------------------------------------------
// Pointer Events (not the HTML5 drag-and-drop API, which is genuinely bad on
// touch) give one code path for finger, pencil and mouse. The two details that
// make it work on an iPad:
//
//   touch-action: none   on the grip handle, so the browser doesn't claim the
//                        gesture for scrolling before we see it
//   setPointerCapture    so the drag survives the finger sliding off the handle
//
// The dragged row follows the finger and a marker shows where it will land;
// the other rows deliberately stay put. Shifting them would mean tracking every
// row's height, and rows here wrap to two lines at unpredictable widths.
// ---------------------------------------------------------------------------

import { useRef, useState, useCallback, useEffect } from 'react'

const EDGE = 90      // px from the viewport edge where auto-scroll kicks in
const SPEED = 12     // px per frame at full tilt

export default function useDragReorder(count, onCommit) {
  const [drag, setDrag] = useState(null) // { from, to, dy }
  const rowsRef  = useRef(new Map())     // index -> element
  const stateRef = useRef(null)
  const rafRef   = useRef(null)

  // The list starts empty (the session draft seeds on a later render), and the
  // pointer callbacks below are memoised. Reading `count` through a ref keeps
  // them from freezing the initial 0 — which silently clamped every drop
  // target to index 0.
  const countRef = useRef(count)
  countRef.current = count

  const registerRow = useCallback((index, el) => {
    if (el) rowsRef.current.set(index, el)
    else rowsRef.current.delete(index)
  }, [])

  // Midpoints are snapshotted once at drag start — cheap, and stable while the
  // list isn't reflowing underneath us.
  function snapshot() {
    const mids = []
    for (let i = 0; i < countRef.current; i++) {
      const el = rowsRef.current.get(i)
      mids.push(el ? el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2 : Infinity)
    }
    return mids
  }

  function targetFor(clientY, mids, from) {
    let to = 0
    while (to < mids.length && clientY > mids[to]) to++
    // Removing the row first shifts everything below it up by one.
    if (to > from) to -= 1
    return Math.max(0, Math.min(countRef.current - 1, to))
  }

  const stopAutoScroll = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
  }

  function autoScroll(clientY) {
    stopAutoScroll()
    const top = clientY - EDGE
    const bottom = window.innerHeight - clientY - EDGE
    let delta = 0
    if (top < 0)    delta = -SPEED * Math.min(1, -top / EDGE)
    if (bottom < 0) delta =  SPEED * Math.min(1, -bottom / EDGE)
    if (!delta) return

    const step = () => {
      window.scrollBy(0, delta)
      const s = stateRef.current
      if (!s) return
      // Re-derive the target as the page moves under a stationary finger.
      s.mids = snapshot()
      const to = targetFor(s.lastY, s.mids, s.from)
      s.to = to
      setDrag(d => (d ? { ...d, to } : d))
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }

  const onPointerDown = useCallback((e, index) => {
    if (e.button != null && e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)

    const mids = snapshot()
    stateRef.current = { from: index, to: index, startY: e.clientY, lastY: e.clientY, mids, pointerId: e.pointerId }
    setDrag({ from: index, to: index, dy: 0 })
    navigator.vibrate?.(8)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onPointerMove = useCallback(e => {
    const s = stateRef.current
    if (!s || e.pointerId !== s.pointerId) return
    s.lastY = e.clientY
    const to = targetFor(e.clientY, s.mids, s.from)
    s.to = to
    setDrag(d => (d ? { ...d, to, dy: e.clientY - s.startY } : d))
    autoScroll(e.clientY)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const finish = useCallback(() => {
    stopAutoScroll()
    const s = stateRef.current
    stateRef.current = null
    setDrag(null)
    // Deliberately NOT inside the setDrag updater: StrictMode double-invokes
    // updater functions to surface impure ones, which would apply the reorder
    // twice. The target lives on the ref so it can be read synchronously here.
    if (s && s.to != null && s.to !== s.from) {
      navigator.vibrate?.(12)
      onCommit(s.from, s.to)
    }
  }, [onCommit])

  // A pointer released outside the window still has to end the drag.
  useEffect(() => {
    if (!drag) return
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    return () => {
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
    }
  }, [drag, finish])

  useEffect(() => stopAutoScroll, [])

  return {
    drag,
    registerRow,
    handleProps: index => ({
      onPointerDown: e => onPointerDown(e, index),
      onPointerMove,
      onPointerUp: finish,
      style: { touchAction: 'none' },
    }),
  }
}
