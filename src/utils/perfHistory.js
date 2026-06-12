// Reads per-set rep performance saved by useWorkoutPlayer.saveWorkoutLog under
// localStorage keys `strongbase_perf_<YYYY-MM-DD>_d<day>`. Powers the
// "Last time: N reps" hint and the post-workout progress comparison.

const KEY_RE = /^strongbase_perf_(\d{4}-\d{2}-\d{2})_d\d+$/

// All past sessions containing this exercise, newest first
export function getPerfHistory(exerciseId) {
  const sessions = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const m = key?.match(KEY_RE)
      if (!m) continue
      const entries = JSON.parse(localStorage.getItem(key) || '[]')
        .filter(e => e.exerciseId === exerciseId)
      if (entries.length) sessions.push({ date: m[1], entries })
    }
  } catch { /* storage unavailable */ }
  return sessions.sort((a, b) => b.date.localeCompare(a.date))
}

// Reps from the most recent session before `excludeDate` (same set number if
// recorded, otherwise the session's best set)
export function getLastReps(exerciseId, setNumber, excludeDate) {
  const sessions = getPerfHistory(exerciseId).filter(s => s.date !== excludeDate)
  if (!sessions.length) return null
  const s = sessions[0]
  const exact = s.entries.find(e => e.setNumber === setNumber)
  const reps = exact ? exact.actualReps : Math.max(...s.entries.map(e => e.actualReps))
  return { date: s.date, reps }
}

// Per-exercise total reps this session vs the previous session.
// Returns [{ exerciseId, prevTotal, total, delta }] for exercises with history.
export function compareToLastSession(setPerformance, today) {
  const byEx = {}
  for (const s of setPerformance) {
    if (typeof s.actualReps !== 'number') continue
    byEx[s.exerciseId] = (byEx[s.exerciseId] || 0) + s.actualReps
  }
  return Object.entries(byEx)
    .map(([exerciseId, total]) => {
      const prev = getPerfHistory(exerciseId).filter(s => s.date !== today)[0]
      if (!prev) return null
      const prevTotal = prev.entries.reduce((t, e) => t + (e.actualReps || 0), 0)
      return { exerciseId, prevTotal, total, delta: total - prevTotal }
    })
    .filter(Boolean)
}
