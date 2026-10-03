// Exercise ratings + day-focus matching.
// ---------------------------------------------------------------------------
// The exercise data itself carries no difficulty or effectiveness rating, so
// both are derived here: a sensible heuristic from category/movement pattern,
// with explicit overrides for exercises the heuristic gets wrong. Ratings are
// deliberately coarse — their whole job is "can I do this?" and "is it worth
// my time?" at a glance while browsing.
//
//   difficulty     1 easy · 2 moderate · 3 challenging
//   effectiveness  1–5, judged against the exercise's own purpose
//     (a stretch is rated as a stretch, not as a strength move)
// ---------------------------------------------------------------------------

import { toRegions } from '../data/muscleGroups'

// ── Difficulty ─────────────────────────────────────────────────────────────

const CAT_DIFFICULTY = {
  'warm-up': 1, flexibility: 1, cardio: 2, stability: 2, strength: 2, power: 3,
}

const DIFFICULTY_OVERRIDES = {
  // Genuinely gentle strength / stability work
  'glute-bridge': 1, 'banded-glute-bridge': 1, 'glute-bridge-hold': 1,
  clamshell: 1, 'fire-hydrant': 1, 'glute-kickback': 1,
  'bodyweight-calf-raise': 1, 'incline-push-up': 1, 'scapular-push-up': 1,
  'banded-pull-apart': 1, 'band-bicep-curl': 1, 'band-bicep-curl-single': 1,
  'band-lateral-raise': 1, 'band-reverse-fly-standing': 1, 'band-seated-row': 1,
  'superman-hold': 1, 'dead-bug': 1, 'bird-dog': 1, 'heel-taps': 1,
  'mcgill-curlup': 1, 'single-leg-balance-hold': 1,
  'crocodile-breathing': 1, 'ninety-ninety-breathing': 1,
  'march-in-place': 1, 'treadmill-walk': 1,
  // Machines guide the path for you
  'machine-chest-press': 1, 'machine-shoulder-press': 1, 'lat-pulldown-machine': 1,
  'machine-leg-curl': 1, 'leg-press': 1, 'seated-calf-raise': 1,
  'tricep-pushdown': 1, 'leg-extension-machine': 1, 'hip-abduction-machine': 1,
  'chest-fly-machine': 1, 'assisted-pull-up-machine': 1, 'cable-seated-row': 1,
  // Power that is really just "move fast, low load"
  'fast-glute-bridge': 2, 'band-fast-press': 2, 'band-fast-row': 2,
  'speed-bodyweight-squat': 2, 'quiet-landing-drill': 2, 'pogo-hops': 2,
  'sled-push': 2, 'bike-sprint': 2,
  // Harder than their category suggests
  'bulgarian-split-squat': 3, 'single-leg-rdl': 3, 'trx-hamstring-curl': 3,
  'decline-push-up': 3, 'diamond-push-up': 3, 'pike-push-up': 3,
  'plank-up-down': 3, 'db-renegade-row': 3, 'db-thruster': 3,
  'copenhagen-plank-short': 3, 'hollow-hold': 3, 'boat-hold': 3,
  'bear-crawl': 3, 'side-plank-rotation': 3, 'trx-plank': 3,
  // Library expansion: gentle, guided or supported
  'chin-tuck': 1, 'neck-isometric-rotation': 1, 'neck-isometric-flexion': 1, 'neck-isometric-extension': 1,
  'wall-slide': 1, 'band-face-pull': 1, 'prone-trap-raise': 1, 'adduction-machine': 1, 'band-sumo-walk': 1,
  'prone-alternating-leg-lift': 1, 'supine-psoas-march': 1, 'band-standing-march': 1, 'side-lying-leg-raise': 1,
  'band-monster-walk': 1, 'cable-hip-abduction': 1, 'cable-bicep-curl': 1, 'band-hammer-curl': 1,
  'cable-overhead-tricep-extension': 1, 'band-tricep-pushdown': 1, 'standing-calf-raise-machine': 1,
  'db-calf-raise': 1, 'tibialis-raise': 1, 'cable-reverse-fly': 1, 'reverse-pec-deck': 1,
  'db-chest-supported-reverse-fly': 1, 'chest-supported-db-row': 1, 'straight-arm-pulldown': 1,
  'band-lat-pulldown': 1, 'pallof-press': 1, 'banded-hip-thrust': 1, 'cable-pull-through': 1,
  'lying-leg-curl': 1, 'band-chest-press': 1, 'cable-lateral-raise': 1, 'pallof-press-hold': 1,
  'db-reverse-curl': 1, 'db-wrist-curl': 1, 'band-shrug': 1,
  // Library expansion: harder than their category suggests
  'cossack-squat': 3, 'side-plank-leg-lift': 3, 'close-grip-push-up': 3, 'inverted-row': 3,
  'single-leg-hip-thrust': 3, 'front-foot-elevated-split-squat': 3, 'trx-fallout': 3,
  'bear-plank-shoulder-tap': 3, 'side-plank-hip-dip': 3, 'pallof-overhead-reach': 3, 'bridge-walkout': 3,
}

export function getDifficulty(ex) {
  return DIFFICULTY_OVERRIDES[ex.id] ?? CAT_DIFFICULTY[ex.category] ?? 2
}

export const DIFFICULTY_LABELS = { 1: 'Easy', 2: 'Moderate', 3: 'Hard' }
export const DIFFICULTY_COLORS = { 1: '#22c55e', 2: '#f59e0b', 3: '#ec4899' }

// ── Effectiveness ──────────────────────────────────────────────────────────

// Big multi-joint patterns give the most training per rep.
const COMPOUND = /(squat|lunge|deadlift|rdl|swing|thruster|step-up|push-up|pulldown|pull-up|row|press|carry|good-morning|hike-pass|hip-thrust|split)/
// Single-joint accessories — useful, but a smaller slice of progress.
const ISOLATION = /(curl|raise|fly|kickback|extension|shrug|pushdown|calf|halo|shoulder-tap)/

const EFFECTIVENESS_OVERRIDES = {
  // The proven core staples (McGill big-three and friends)
  'dead-bug': 5, 'bird-dog': 5, 'mcgill-curlup': 5, 'side-plank': 5,
  'standing-band-anti-rotation': 5, 'kb-suitcase-carry': 5, 'db-farmers-carry': 5,
  'forearm-plank': 5,
  // Stretch-world standouts
  'worlds-greatest-stretch': 5,
  // Fine moves, modest payoff
  'wall-sit': 3, 'fire-hydrant': 3, 'glute-kickback': 3, 'heel-taps': 3,
  'russian-twist': 3, 'bicycle-crunch': 3, 'reverse-crunch': 3,
  'single-leg-balance-hold': 3, 'single-leg-stand-eyes-closed': 3,
  // Library expansion: core staples and accessories
  'dead-bug-band': 5, 'pallof-press-hold': 5, 'bear-plank-shoulder-tap': 4, 'trx-fallout': 4,
  'straight-arm-pulldown': 4, 'cable-crossover': 3, 'db-calf-raise': 3, 'neck-flexion-stretch': 3,
}

export function getEffectiveness(ex) {
  const o = EFFECTIVENESS_OVERRIDES[ex.id]
  if (o) return o
  const { category, id } = ex
  if (category === 'warm-up') return 4
  if (category === 'flexibility') return ex.backCare ? 5 : 4
  if (category === 'power' || category === 'cardio' || category === 'stability') return 4
  if (COMPOUND.test(id) && !ISOLATION.test(id)) return 5
  if (ISOLATION.test(id)) return 3
  return 4
}

// ── Day focus ──────────────────────────────────────────────────────────────
// Which slice of the library belongs to each programmed day, so "leg day"
// can surface every leg exercise in the database. Warm-ups and stretches are
// left out of the focused view on training days — the day is already seeded
// with its usual warm-up and back-care block.

export const DAY_FOCUS = {
  1: { label: 'full body',        kind: 'all' },
  2: { label: 'push',             regions: ['chest', 'front-delts', 'side-delts', 'triceps'] },
  3: { label: 'legs & glutes',    regions: ['glutes', 'hamstrings', 'quads', 'adductors', 'abductors', 'calves', 'hip-flexors'] },
  4: { label: 'mobility',         kind: 'mobility' },
  5: { label: 'pull',             regions: ['lats', 'mid-back', 'traps', 'rear-delts', 'biceps', 'forearms'] },
  6: { label: 'core & stability', regions: ['abs', 'obliques', 'lower-back'], includeCategory: 'stability' },
  7: { label: 'full body',        kind: 'all' },
}

const AUX_CATEGORIES = new Set(['warm-up', 'flexibility'])

const UPPER = ['chest', 'front-delts', 'side-delts', 'rear-delts', 'triceps', 'biceps', 'forearms', 'lats', 'mid-back', 'traps']
const LOWER = ['glutes', 'hamstrings', 'quads', 'adductors', 'abductors', 'calves', 'hip-flexors']

// What the workout builder offers as a starting point. Same shape as a
// DAY_FOCUS entry, so one matcher serves plan days and custom workouts.
export const FOCUS_PRESETS = [
  { id: 'full',      label: 'Full body',        kind: 'all' },
  { id: 'upper',     label: 'Upper body',       regions: UPPER },
  { id: 'lower',     label: 'Legs & glutes',    regions: LOWER },
  { id: 'push',      label: 'Push',             regions: DAY_FOCUS[2].regions },
  { id: 'pull',      label: 'Pull',             regions: DAY_FOCUS[5].regions },
  { id: 'core',      label: 'Core & stability', regions: DAY_FOCUS[6].regions, includeCategory: 'stability' },
  { id: 'back-care', label: 'Back care',        kind: 'back-care' },
  { id: 'mobility',  label: 'Mobility',         kind: 'mobility' },
]

/** True when an exercise belongs to a focus ({ kind?, regions?, includeCategory? }). */
export function matchesFocus(ex, focus) {
  if (!focus) return true
  if (focus.kind === 'mobility') return AUX_CATEGORIES.has(ex.category)
  if (focus.kind === 'back-care') return !!ex.backCare || (ex.backSafe && ['flexibility', 'stability'].includes(ex.category))
  if (AUX_CATEGORIES.has(ex.category)) return false
  if (focus.kind === 'all') return true
  if (focus.includeCategory && ex.category === focus.includeCategory) return true
  const regions = toRegions(ex.primaryMuscles || [])
  return regions.some(r => (focus.regions || []).includes(r))
}

/** A day's focus: its own (plans, custom workouts) or the original plan's. */
export function getDayFocus(day) {
  if (!day) return null
  return day.focus || DAY_FOCUS[day.day] || null
}

export function matchesDayFocus(ex, dayNumber) {
  return matchesFocus(ex, DAY_FOCUS[dayNumber])
}

/** Sort for browsing: most effective first, easiest breaking ties. */
export function byBangForBuck(a, b) {
  return getEffectiveness(b) - getEffectiveness(a) || getDifficulty(a) - getDifficulty(b)
}
