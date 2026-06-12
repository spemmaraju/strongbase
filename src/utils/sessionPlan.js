// Shared session-building logic used by DayOverview (preview list) and
// useWorkoutPlayer (actual playback) so what you see is exactly what you play.

// Equipment that is always available (no user ownership required)
export const ALWAYS_AVAILABLE = new Set(['bodyweight', 'yoga-mat'])

export function canShowExercise(ex, mode, userEquipment) {
  if (mode === 'gym') return true
  return ex.equipment.every(e => ALWAYS_AVAILABLE.has(e) || userEquipment.includes(e))
}

// Session length presets. The cooldown (flexibility/back-care block) is never
// dropped entirely — back safety is non-negotiable for this program.
export const SESSION_PRESETS = {
  quick:    { warmups: 1, mainCount: 4, setsCap: 2, cooldowns: 2 },
  standard: { warmups: 2, mainCount: 6, setsCap: 2, cooldowns: 3 },
  full:     null, // as programmed
}

export function applySessionLength(exercises, sessionLength) {
  const preset = SESSION_PRESETS[sessionLength]
  if (!preset) return exercises

  const isWarm = e => e.category === 'warm-up'
  const isCool = e => e.category === 'flexibility'

  const warm = exercises.filter(isWarm).slice(0, preset.warmups)
  const main = exercises
    .filter(e => !isWarm(e) && !isCool(e))
    .slice(0, preset.mainCount)
    .map(e => ({ ...e, sets: Math.min(e.sets, preset.setsCap) }))

  // Back-care moves are ALWAYS kept; other cooldowns fill the remaining slots
  const cools = exercises.filter(isCool)
  const backCare = cools.filter(e => e.backCare)
  const otherCool = cools.filter(e => !e.backCare)
  const cool = [
    ...otherCool.slice(0, Math.max(0, preset.cooldowns - backCare.length)),
    ...backCare,
  ]

  return [...warm, ...main, ...cool]
}

// Rough session duration: work time (or ~40s per rep-based set) + rest between
// sets + ~10s transition per exercise.
export function estimateMinutes(exercises) {
  const seconds = exercises.reduce((sum, ex) => {
    const work = ex.durationSeconds || 40
    const rest = ex.restSeconds || 30
    return sum + ex.sets * (work + rest) + 10
  }, 0)
  return Math.max(5, Math.round(seconds / 60 / 5) * 5)
}

// Builds the final exercise list for a day: pick home/gym list, drop exercises
// the user lacks equipment for (home only), then trim to the session length.
export function buildSessionExercises(day, exMap, { mode, userEquipment, sessionLength }) {
  if (!day) return []
  const ids = mode === 'gym'
    ? (day.gymExerciseIds || day.exerciseIds || [])
    : (day.homeExerciseIds || day.exerciseIds || [])
  const all = ids.map(id => exMap[id]).filter(Boolean)
  const owned = all.filter(ex => canShowExercise(ex, mode, userEquipment))
  return applySessionLength(owned, sessionLength)
}
