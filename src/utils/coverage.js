// What you've actually trained lately.
// ---------------------------------------------------------------------------
// Composing your own sessions has one predictable failure mode: you drift
// toward what you enjoy and quietly stop doing what you find awkward. Nobody
// notices that about themselves. The app can, because it knows every exercise
// you ticked.
//
// Deliberately a mirror, not a score. No target, no streak, no "you should".
// ---------------------------------------------------------------------------

import { resolveMuscles, REGIONS } from '../data/muscleGroups'

// A completed exercise counts more toward the muscles that did the work.
const PRIMARY_WEIGHT = 3
const SECONDARY_WEIGHT = 1

// Movement patterns, derived from an exercise's primaryMuscles set rather than
// stored on the exercise — 153 rows is a lot to migrate for something we can
// infer reliably. `glutes` appears in 31 exercises and is genuinely ambiguous
// between hinge and squat, so it's resolved by looking at the whole set.
const PATTERN_RULES = [
  ['push',      ['chest', 'pectorals', 'front deltoids', 'lateral deltoids', 'shoulders', 'triceps', 'serratus anterior']],
  ['pull',      ['lats', 'upper back', 'rhomboids', 'rear deltoids', 'biceps', 'lower trapezius', 'middle trapezius', 'upper traps']],
  ['hinge',     ['hamstrings']],
  ['squat',     ['quadriceps', 'rectus femoris', 'adductors']],
  ['core',      ['core', 'deep core', 'obliques', 'transverse abdominis', 'rectus abdominis', 'abdominals', 'pelvic control']],
  ['stability', ['glute medius', 'glute minimus', 'hip abductors', 'hip stabilizers', 'ankle stabilizers', 'proprioception']],
  ['calves',    ['gastrocnemius', 'soleus', 'calves']],
]

export const PATTERN_LABELS = {
  push: 'pushed', pull: 'pulled', hinge: 'hinged', squat: 'squatted',
  core: 'trained core', stability: 'trained stability', calves: 'trained calves',
}

/** Classify one exercise into a movement pattern, or null. */
export function patternOf(ex) {
  const primary = ex?.primaryMuscles ?? []
  if (!primary.length) return null

  const has = names => primary.some(m => names.includes(m))

  // Glutes alone is a hinge; glutes with quads is a squat. Check the leg
  // patterns explicitly before falling through to the generic rules.
  if (has(['hamstrings'])) return 'hinge'
  if (has(['quadriceps', 'rectus femoris'])) return 'squat'
  if (primary.includes('glutes')) return 'hinge'

  for (const [pattern, names] of PATTERN_RULES) {
    if (has(names)) return pattern
  }
  return null
}

const dayStr = d => d.toISOString().slice(0, 10)

/**
 * @param logs   from useWorkoutLogs — needs { date, completedExerciseIds }
 * @param exMap  id -> exercise
 * @returns { levels, regionCounts, patterns, observations, sessionCount, days,
 *            lastSeen, mobilityShare }
 */
export function buildCoverage(logs = [], exMap = {}, { days = 28 } = {}) {
  const cutoff = dayStr(new Date(Date.now() - (days - 1) * 86400000))
  const window = logs.filter(l => l.date >= cutoff)

  const regionCounts = {}          // region -> weighted score
  const patterns = {}              // pattern -> session-ish count
  const lastSeen = {}              // region -> most recent date it was trained
  let mobilityCount = 0
  let totalCompleted = 0

  window.forEach(log => {
    ;(log.completedExerciseIds || []).forEach(id => {
      const ex = exMap[id]
      if (!ex) return
      totalCompleted += 1

      if (ex.category === 'flexibility') mobilityCount += 1

      const p = patternOf(ex)
      if (p) patterns[p] = (patterns[p] || 0) + 1

      const { primary, secondary } = resolveMuscles(ex)
      primary.forEach(r => {
        regionCounts[r] = (regionCounts[r] || 0) + PRIMARY_WEIGHT
        if (!lastSeen[r] || log.date > lastSeen[r]) lastSeen[r] = log.date
      })
      secondary.forEach(r => {
        regionCounts[r] = (regionCounts[r] || 0) + SECONDARY_WEIGHT
        if (!lastSeen[r] || log.date > lastSeen[r]) lastSeen[r] = log.date
      })
    })
  })

  // Bucket into 5 levels relative to the busiest region, so the map reads the
  // same whether you trained 3 times or 30. Anything touched at all gets at
  // least level 1 — "barely" and "never" must not look identical.
  const peak = Math.max(1, ...Object.values(regionCounts))
  const levels = {}
  Object.keys(REGIONS).forEach(r => {
    const c = regionCounts[r] || 0
    levels[r] = c === 0 ? 0 : Math.max(1, Math.min(4, Math.ceil((c / peak) * 4)))
  })

  const mobilityShare = totalCompleted ? mobilityCount / totalCompleted : 0

  return {
    levels, regionCounts, patterns, lastSeen,
    sessionCount: window.length,
    days,
    mobilityShare,
    observations: buildObservations({ patterns, levels, lastSeen, days, mobilityShare, sessionCount: window.length }),
  }
}

/**
 * 2–4 plain sentences. Every one is a statement of fact from the data — no
 * targets, no advice, no "you should".
 */
function buildObservations({ patterns, levels, lastSeen, days, mobilityShare, sessionCount }) {
  const out = []
  if (!sessionCount) return ['Nothing logged in the last ' + days + ' days.']

  // Most vs least trained pattern, when the gap is actually worth remarking on.
  const ranked = Object.entries(patterns).sort((a, b) => b[1] - a[1])
  if (ranked.length >= 2) {
    const [topName, topN] = ranked[0]
    const [lowName, lowN] = ranked[ranked.length - 1]
    if (topN >= lowN * 2 && topN - lowN >= 3) {
      out.push(`You've ${PATTERN_LABELS[topName]} ${topN} times and ${PATTERN_LABELS[lowName]} ${lowN}.`)
    }
  }

  // Regions never touched in the window, named rather than counted.
  const cold = Object.keys(REGIONS).filter(r => (levels[r] ?? 0) === 0)
  if (cold.length) {
    const names = cold.slice(0, 3).map(r => REGIONS[r].label.toLowerCase())
    const more = cold.length - names.length
    out.push(
      `Nothing has hit your ${names.join(', ')}${more > 0 ? ` (and ${more} more)` : ''} in ${days} days.`,
    )
  }

  // The one you told me about.
  if (mobilityShare < 0.12) {
    out.push(
      mobilityShare === 0
        ? `No stretching or cool-down work logged at all.`
        : `Stretching was ${Math.round(mobilityShare * 100)}% of what you completed.`,
    )
  }

  // A region trained long ago but not recently reads differently from one never
  // trained — worth its own sentence.
  const stale = Object.entries(lastSeen)
    .filter(([r]) => (levels[r] ?? 0) === 1)
    .sort((a, b) => (a[1] < b[1] ? -1 : 1))[0]
  if (stale && out.length < 4) {
    const daysAgo = Math.round(
      (new Date(`${dayStr(new Date())}T12:00:00Z`) - new Date(`${stale[1]}T12:00:00Z`)) / 86400000,
    )
    if (daysAgo >= 10) {
      out.push(`Your ${REGIONS[stale[0]].label.toLowerCase()} last did anything ${daysAgo} days ago.`)
    }
  }

  return out.length ? out : [`${sessionCount} sessions in the last ${days} days, fairly evenly spread.`]
}

/**
 * Exercises that would warm up the coldest regions — the input to
 * "build me a session from the gaps".
 */
export function pickForGaps(coverage, exercises, { canUse, count = 6 }) {
  const coldest = Object.keys(REGIONS)
    .map(r => [r, coverage.levels[r] ?? 0])
    .sort((a, b) => a[1] - b[1])
    .map(([r]) => r)

  const rank = Object.fromEntries(coldest.map((r, i) => [r, i]))
  const candidates = exercises
    .filter(e => (e.category === 'strength' || e.category === 'stability') && canUse(e))
    .map(e => {
      const { primary } = resolveMuscles(e)
      if (!primary.length) return null
      const score = Math.min(...primary.map(r => rank[r] ?? 99))
      return { ex: e, score }
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score)

  // One exercise per primary region, so a gap session isn't six variations of
  // the same thing.
  const picked = []
  const usedRegions = new Set()
  for (const { ex } of candidates) {
    const { primary } = resolveMuscles(ex)
    if (primary.some(r => usedRegions.has(r))) continue
    picked.push(ex)
    primary.forEach(r => usedRegions.add(r))
    if (picked.length >= count) break
  }
  return picked
}
