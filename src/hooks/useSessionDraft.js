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

// Adds made from outside the day screen (the Library) before the draft has
// seeded. Merged in — after the programmed warm-up, before the cooldown — the
// first time the draft is built for that (date, day), then cleared.
const pendingKey = (dayNumber, date = todayStr()) =>
  `strongbase_session_pending_${date}_d${dayNumber}`

function readPending(dayNumber, date = todayStr()) {
  try {
    const p = JSON.parse(localStorage.getItem(pendingKey(dayNumber, date)) || '[]')
    return Array.isArray(p) ? p : []
  } catch { return [] }
}

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
 * What's currently planned for a day, viewed from outside the day screen.
 * Draft if one exists, else any pending Library adds waiting to be merged.
 */
export function plannedIdsForDay(dayNumber, date = todayStr()) {
  return readDraft(draftKey(dayNumber, date))?.order ?? readPending(dayNumber, date)
}

/**
 * Add an exercise to a day's session from anywhere (the Library tab).
 * Appends to the live draft when one exists; otherwise queues it so the draft
 * picks it up when it first seeds. @returns 'added' | 'already'
 */
export function addExerciseToDay(dayNumber, exerciseId, date = todayStr()) {
  const key = draftKey(dayNumber, date)
  const draft = readDraft(key)
  if (draft) {
    if (draft.order.includes(exerciseId)) return 'already'
    writeDraft(key, { ...draft, order: [...draft.order, exerciseId] })
    return 'added'
  }
  const pending = readPending(dayNumber, date)
  if (pending.includes(exerciseId)) return 'already'
  try { localStorage.setItem(pendingKey(dayNumber, date), JSON.stringify([...pending, exerciseId])) } catch { /* quota */ }
  return 'added'
}

/** Undo an addExerciseToDay from outside the day screen. */
export function removeExerciseFromDay(dayNumber, exerciseId, date = todayStr()) {
  const key = draftKey(dayNumber, date)
  const draft = readDraft(key)
  if (draft) {
    writeDraft(key, {
      order: draft.order.filter(x => x !== exerciseId),
      done:  draft.done.filter(x => x !== exerciseId),
    })
    return
  }
  const pending = readPending(dayNumber, date)
  try { localStorage.setItem(pendingKey(dayNumber, date), JSON.stringify(pending.filter(x => x !== exerciseId))) } catch { /* quota */ }
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

  // Seed once per (day, date) when there is nothing persisted yet. Anything
  // added from the Library before first open is folded in at the end here.
  useEffect(() => {
    if (!key) return
    const existing = readDraft(key)
    if (existing) { setDraft(existing); return }
    if (suggested.length) {
      const pending = readPending(dayNumber).filter(id => !suggested.includes(id))
      const seeded = { order: [...suggested, ...pending], done: [] }
      try { localStorage.removeItem(pendingKey(dayNumber)) } catch { /* fine */ }
      setDraft(seeded)
      writeDraft(key, seeded)
    }
  }, [key, dayNumber, suggested])

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

  /**
   * Thread the stretches through the strength work instead of leaving them at
   * the end.
   *
   * Cool-downs get skipped because of where they sit, not because they're hard
   * — by the time you reach them you're finished and mentally done. Between
   * sets you're standing around anyway, so the same work costs no extra time
   * and stops being a thing you can skip.
   *
   * Warm-ups deliberately stay at the front: doing them first is their whole
   * job. Only `flexibility` items move, which includes the back-care moves that
   * otherwise sit last.
   */
  const interleaveMobility = useCallback(() => update(d => {
    const cat = id => exMap[id]?.category

    const warm   = d.order.filter(id => cat(id) === 'warm-up')
    const mobile = d.order.filter(id => cat(id) === 'flexibility')
    const main   = d.order.filter(id => {
      const c = cat(id)
      return c && c !== 'warm-up' && c !== 'flexibility'
    })
    // Ids whose exercise has gone missing from the library — keep them rather
    // than silently dropping the row.
    const unknown = d.order.filter(id => !cat(id))

    if (!mobile.length || !main.length) return d

    // Spread the stretches evenly through the main work rather than clumping
    // them, and never lead with one — the first thing after the warm-up should
    // be the actual training.
    const gap = main.length / mobile.length
    const woven = []
    let placed = 0
    main.forEach((id, i) => {
      woven.push(id)
      while (placed < mobile.length && (i + 1) >= (placed + 1) * gap) {
        woven.push(mobile[placed])
        placed += 1
      }
    })
    while (placed < mobile.length) woven.push(mobile[placed++])

    return { ...d, order: [...warm, ...woven, ...unknown] }
  }), [update, exMap])

  /** True when any stretch currently sits between two non-stretch items. */
  const isInterleaved = useMemo(() => {
    const cats = draft.order.map(id => exMap[id]?.category)
    const lastMain = cats.lastIndexOf('strength') >= 0 || cats.lastIndexOf('stability') >= 0
      ? Math.max(cats.lastIndexOf('strength'), cats.lastIndexOf('stability'))
      : -1
    return lastMain > -1 && cats.slice(0, lastMain).includes('flexibility')
  }, [draft.order, exMap])

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
    suggested, isCustomised, isInterleaved,
    toggleDone, move, swap, remove, add, resetToSuggested, interleaveMobility,
  }
}
