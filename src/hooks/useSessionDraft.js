// The editable session for one day.
// ---------------------------------------------------------------------------
// Historically DayOverview and WorkoutPlayer each rebuilt the day's exercise
// list independently from buildSessionExercises(), which worked only because
// neither could change it. Now that you can reorder, swap and remove, the
// session has to be real state that both screens read.
//
// A draft is { order: exerciseId[], done: exerciseId[] } scoped to
// (date, dayNumber). It seeds from the programmed session on first open and is
// persisted to localStorage so a mid-workout reload — or an iPad dropping the
// tab — doesn't lose your place.
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback, useMemo } from 'react'
import { buildSessionExercises } from '../utils/sessionPlan'

export const todayStr = () => new Date().toISOString().slice(0, 10)

export const draftKey = (dayNumber, date = todayStr()) =>
  `strongbase_session_${date}_d${dayNumber}`

function readDraft(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const d = JSON.parse(raw)
    if (!Array.isArray(d?.order)) return null
    return { order: d.order, done: Array.isArray(d.done) ? d.done : [] }
  } catch { return null }
}

function writeDraft(key, draft) {
  try { localStorage.setItem(key, JSON.stringify(draft)) } catch { /* quota — ignore */ }
}

/**
 * Read a persisted draft without subscribing to it. Used by the guided player
 * so it plays exactly what you picked rather than rebuilding the default.
 */
export function peekDraftOrder(dayNumber, date = todayStr()) {
  return readDraft(draftKey(dayNumber, date))?.order ?? null
}

/**
 * @param day       the weeklyPlan day object (may be undefined while loading)
 * @param exMap     id -> exercise
 * @param options   { mode, userEquipment, sessionLength } for the initial seed
 */
export default function useSessionDraft(day, exMap, options) {
  const dayNumber = day?.day
  const key = dayNumber ? draftKey(dayNumber) : null

  // userEquipment is usually derived inline from user metadata, so it is a new
  // array on every render. Depend on its contents, not its identity, or the
  // memo below re-runs forever.
  const { mode, sessionLength, userEquipment } = options
  const equipKey = (userEquipment || []).join(',')

  // The programmed session — the seed, and what "Reset to suggested" restores.
  const suggested = useMemo(
    () => (day ? buildSessionExercises(day, exMap, { mode, sessionLength, userEquipment }).map(e => e.id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [day, exMap, mode, sessionLength, equipKey],
  )

  const [draft, setDraft] = useState(() =>
    (key && readDraft(key)) || { order: [], done: [] },
  )

  // Seed once per (day, date) when there is nothing persisted yet.
  useEffect(() => {
    if (!key) return
    const existing = readDraft(key)
    if (existing) { setDraft(existing); return }
    if (suggested.length) {
      const seeded = { order: suggested, done: [] }
      setDraft(seeded)
      writeDraft(key, seeded)
    }
  }, [key, suggested])

  const update = useCallback(next => {
    setDraft(prev => {
      const value = typeof next === 'function' ? next(prev) : next
      if (key) writeDraft(key, value)
      return value
    })
  }, [key])

  // ── Actions ──────────────────────────────────────────────────────────────
  const toggleDone = useCallback(id => update(d => ({
    ...d,
    done: d.done.includes(id) ? d.done.filter(x => x !== id) : [...d.done, id],
  })), [update])

  const move = useCallback((from, to) => update(d => {
    if (to < 0 || to >= d.order.length || from === to) return d
    const order = [...d.order]
    const [moved] = order.splice(from, 1)
    order.splice(to, 0, moved)
    return { ...d, order }
  }), [update])

  const swap = useCallback((oldId, newId) => update(d => {
    if (d.order.includes(newId)) return d              // already in the session
    const i = d.order.indexOf(oldId)
    if (i === -1) return d
    const order = [...d.order]
    order[i] = newId
    // A swapped-in exercise starts unticked even if the one it replaced was done.
    return { order, done: d.done.filter(x => x !== oldId) }
  }), [update])

  const remove = useCallback(id => update(d => ({
    order: d.order.filter(x => x !== id),
    done:  d.done.filter(x => x !== id),
  })), [update])

  const add = useCallback(id => update(d => (
    d.order.includes(id) ? d : { ...d, order: [...d.order, id] }
  )), [update])

  const resetToSuggested = useCallback(() => {
    update({ order: suggested, done: [] })
  }, [update, suggested])

  // ── Derived ──────────────────────────────────────────────────────────────
  // filter(Boolean) matters: an id can go stale if an exercise is renamed or
  // removed from exercises.json between sessions.
  const exercises = useMemo(
    () => draft.order.map(id => exMap[id]).filter(Boolean),
    [draft.order, exMap],
  )

  const doneSet   = useMemo(() => new Set(draft.done), [draft.done])
  const doneCount = exercises.filter(e => doneSet.has(e.id)).length

  // Σ sets of ticked exercises. This is what becomes total_sets on the log,
  // which is also the XP currency (Home and Profile both do totalSets × 25).
  const totalSets = exercises.reduce(
    (sum, e) => sum + (doneSet.has(e.id) ? (e.sets || 0) : 0), 0,
  )

  const isCustomised =
    draft.order.length !== suggested.length ||
    draft.order.some((id, i) => suggested[i] !== id)

  return {
    exercises, order: draft.order, doneSet, doneCount, totalSets,
    suggested, isCustomised,
    toggleDone, move, swap, remove, add, resetToSuggested,
  }
}
