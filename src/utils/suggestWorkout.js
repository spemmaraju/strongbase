// Suggests a starting list for the Workout Builder: warm-ups, then the most
// worthwhile exercises for the focus (varied, not five near-identical moves),
// then a cooldown that always contains a back-care stretch.
// Deterministic; `seed` (a Shuffle press count) rotates among equal candidates.

import { matchesFocus, byBangForBuck, getEffectiveness, getDifficulty } from './exerciseMeta'
import { canShowExercise } from './sessionPlan'

const SIZES = {
  short:    { warm: 1, main: 4, cool: 2 },
  standard: { warm: 2, main: 6, cool: 2 },
  long:     { warm: 2, main: 8, cool: 3 },
}

const muscleKey = ex => [...(ex.primaryMuscles || [])].sort().join('+')

// Same sort as the browser, with a seeded rotation inside each tie group.
function rotateTies(list, seed) {
  if (!seed) return list
  const out = []
  let i = 0
  while (i < list.length) {
    let j = i
    const sameTier = (a, b) =>
      getEffectiveness(a) === getEffectiveness(b) && getDifficulty(a) === getDifficulty(b)
    while (j < list.length && sameTier(list[i], list[j])) j++
    const group = list.slice(i, j)
    const k = seed % group.length
    out.push(...group.slice(k), ...group.slice(0, k))
    i = j
  }
  return out
}

// Movement pattern from the id — first match wins, so order matters
// (single-leg-rdl is a hinge, mcgill-curlup is core not an arm curl).
const PATTERNS = [
  ['carry',  /carry/],
  ['calf',   /calf|tibialis/],
  ['hinge',  /rdl|deadlift|good-morning|swing|hinge|pull-through|leg-curl|hamstring-curl/],
  ['glute',  /bridge|hip-thrust|clamshell|kickback|fire-hydrant|abduct|frog/],
  ['lunge',  /lunge|split|step-up|single-leg|pistol/],
  ['squat',  /squat|leg-press|wall-sit|leg-extension/],
  ['core',   /plank|dead-bug|bird-dog|curlup|curl-up|pallof|anti-rotation|hollow|crunch|twist|superman|boat|heel-tap|v-up|bear/],
  ['pullV',  /pulldown|pull-up|chin-up|lat-pull|straight-arm/],
  ['pullH',  /row|pull-apart|reverse-fly|face-pull|y-t-w|swimmer/],
  ['pushV',  /pike|overhead|shoulder-press|lateral-raise|arnold|landmine-press|y-raise/],
  ['pushH',  /push-up|bench|chest|fly|dip|press/],
  ['arms',   /curl|tricep|pushdown|extension|skull/],
]
export function patternOf(ex) {
  for (const [name, re] of PATTERNS) if (re.test(ex.id)) return name
  return ex.category === 'stability' ? 'core' : 'other'
}

// What a balanced session looks like for each focus, slot by slot. Slots
// that the user's equipment can't fill are skipped and back-filled later.
const TEMPLATES = {
  full:  ['squat', 'hinge', 'pushH', 'pullH', 'core', 'lunge', 'pushV', 'pullV', 'glute', 'carry'],
  upper: ['pushH', 'pullH', 'pushV', 'pullV', 'pullH', 'pushH', 'arms', 'arms'],
  lower: ['squat', 'hinge', 'lunge', 'glute', 'calf', 'core', 'hinge', 'squat'],
  push:  ['pushH', 'pushV', 'pushH', 'arms', 'pushV', 'pushH'],
  pull:  ['pullH', 'pullV', 'pullH', 'arms', 'pullH', 'pullV'],
  core:  ['core', 'core', 'carry', 'core', 'glute', 'core'],
}

// Fill `n` from the template first, then back-fill by rating with at most 2
// per movement pattern and 2 per identical primary-muscle set.
function pickVaried(sorted, n, taken, template = []) {
  const chosen = []
  const patCount = new Map()
  const muscleCount = new Map()
  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1)
  const free = ex => !taken.has(ex.id) && !chosen.includes(ex)
  const add = ex => { chosen.push(ex); bump(patCount, patternOf(ex)); bump(muscleCount, muscleKey(ex)) }

  for (const slot of template) {
    if (chosen.length >= n) break
    const ex = sorted.find(e => free(e) && patternOf(e) === slot)
    if (ex) add(ex)
  }
  for (const cap of [2, Infinity]) {
    for (const ex of sorted) {
      if (chosen.length >= n) break
      if (!free(ex)) continue
      if ((patCount.get(patternOf(ex)) || 0) >= cap) continue
      if ((muscleCount.get(muscleKey(ex)) || 0) >= cap) continue
      add(ex)
    }
  }
  return chosen
}

export function suggestWorkout(focusPreset, exercises, { userEquipment = ['bodyweight'], size = 'standard', seed = 0 } = {}) {
  const cfg = SIZES[size] || SIZES.standard
  const usable = exercises.filter(e => canShowExercise(e, 'home', userEquipment))
  const sorted = list => rotateTies([...list].sort(byBangForBuck), seed)
  const taken = new Set()
  const take = list => { list.forEach(e => taken.add(e.id)); return list }

  const lightFocus = focusPreset?.kind === 'back-care' || focusPreset?.kind === 'mobility'

  // Warm-ups: prefer back-safe ones.
  const warmPool = sorted(usable.filter(e => e.category === 'warm-up'))
    .sort((a, b) => (b.backSafe === true) - (a.backSafe === true))
  const warm = take(warmPool.slice(0, cfg.warm))

  // Cooldown: back-care stretches first, then other back-safe flexibility.
  const coolPool = usable.filter(e => e.category === 'flexibility' && e.backSafe !== false)
  const coolSorted = sorted(coolPool)
  const backCare = coolSorted.filter(e => e.backCare)
  const coolPick = []
  if (backCare.length) coolPick.push(backCare[seed % backCare.length])
  coolSorted.forEach(e => { if (coolPick.length < cfg.cool && !coolPick.includes(e)) coolPick.push(e) })

  // Main block. Back-care/mobility focus draws from flexibility + stability.
  let mainPool = usable.filter(e => matchesFocus(e, focusPreset) && !taken.has(e.id) && e.backSafe !== false)
  if (lightFocus) mainPool = mainPool.filter(e => !coolPick.includes(e))
  const main = take(pickVaried(sorted(mainPool), cfg.main, taken, TEMPLATES[focusPreset?.id]))

  const cool = coolPick.slice(0, cfg.cool)
  // Guarantee a back-care stretch survived the slice.
  if (backCare.length && !cool.some(e => e.backCare)) cool[cool.length - 1] = backCare[0]

  return [...warm, ...main, ...cool].map(e => e.id)
}
