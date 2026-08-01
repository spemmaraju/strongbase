#!/usr/bin/env node
// Schema guard for src/data/exercises.json.
// ---------------------------------------------------------------------------
//   node scripts/validateExercises.mjs
//
// The library is about to roughly double, and two failure modes here are silent
// rather than loud:
//
//   * A muscle name that isn't in ALIASES still renders as a text chip but
//     shades nothing on the body map. It looks fine until you notice the
//     figure is blank. This has already bitten us once (cobra-pose used
//     "abdominals", which wasn't mapped).
//   * A missing instructions/cues/equipment array used to take the exercise
//     modal down entirely. Those are guarded now, but an exercise without them
//     is still broken content.
//
// Exits non-zero on any error so this can gate a commit.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const exercises = JSON.parse(readFileSync(join(root, 'src/data/exercises.json'), 'utf8'))
const muscleSrc = readFileSync(join(root, 'src/data/muscleGroups.js'), 'utf8')

// Pull the ALIASES keys straight out of the source so this can never drift.
const aliasBlock = muscleSrc.split('export const ALIASES')[1] ?? ''
const ALIASES = new Set(
  [...aliasBlock.matchAll(/^\s*'([^']+)':\s*(?:\[|null)/gm)].map(m => m[1]),
)

const CATEGORIES = new Set(['strength', 'stability', 'warm-up', 'flexibility', 'cardio'])
const EQUIPMENT = new Set([
  'bodyweight', 'yoga-mat', 'resistance-band', 'trx',
  '10lb-dumbbells', '15lb-dumbbells',
  'gym-machine', 'gym-dumbbells', 'gym-bench', 'kettlebell',
])

const REQUIRED_ARRAYS = ['equipment', 'targetMuscles', 'primaryMuscles', 'secondaryMuscles', 'instructions', 'cues']

const errors = []
const warnings = []
const seen = new Set()

for (const [i, ex] of exercises.entries()) {
  const at = `[${i}] ${ex?.id ?? '(no id)'}`

  if (!ex.id || typeof ex.id !== 'string') errors.push(`${at}: missing id`)
  else if (seen.has(ex.id)) errors.push(`${at}: duplicate id`)
  else seen.add(ex.id)

  if (!ex.name) errors.push(`${at}: missing name`)
  if (!CATEGORIES.has(ex.category)) errors.push(`${at}: bad category "${ex.category}"`)

  for (const key of REQUIRED_ARRAYS) {
    if (!Array.isArray(ex[key]) || ex[key].length === 0) {
      errors.push(`${at}: ${key} missing or empty`)
    }
  }

  for (const eq of ex.equipment ?? []) {
    if (!EQUIPMENT.has(eq)) errors.push(`${at}: unknown equipment "${eq}"`)
  }

  // The silent one: unmapped muscle names shade nothing on the figure.
  for (const key of ['targetMuscles', 'primaryMuscles', 'secondaryMuscles']) {
    for (const m of ex[key] ?? []) {
      if (!ALIASES.has(m)) errors.push(`${at}: ${key} "${m}" is not in ALIASES — would shade nothing`)
    }
  }

  if (typeof ex.sets !== 'number' || ex.sets < 1) errors.push(`${at}: sets must be a positive number`)

  const hasReps = typeof ex.reps === 'number' && ex.reps > 0
  const hasDur  = typeof ex.durationSeconds === 'number' && ex.durationSeconds > 0
  if (hasReps === hasDur) {
    errors.push(`${at}: needs exactly one of reps or durationSeconds (got reps=${ex.reps}, durationSeconds=${ex.durationSeconds})`)
  }
  if (!('reps' in ex) || !('durationSeconds' in ex)) {
    errors.push(`${at}: both reps and durationSeconds keys must be present (use null for the unused one)`)
  }

  if (typeof ex.restSeconds !== 'number') errors.push(`${at}: restSeconds must be a number`)
  if (!ex.modification) warnings.push(`${at}: no modification`)

  // youtubeId may be null — that is how new exercises ship.
  if (ex.youtubeId != null && !/^[A-Za-z0-9_-]{11}$/.test(ex.youtubeId)) {
    errors.push(`${at}: youtubeId "${ex.youtubeId}" is not an 11-character video id`)
  }

  const s = ex.sensation
  if (!s) warnings.push(`${at}: no sensation guide`)
  else {
    if (!s.feelHere) errors.push(`${at}: sensation.feelHere missing`)
    if (!s.notHere)  errors.push(`${at}: sensation.notHere missing`)
    for (const w of s.wrongSpot ?? []) {
      if (!w.felt || !w.fix) errors.push(`${at}: wrongSpot entry needs both felt and fix`)
    }
  }

  for (const m of ex.mistakes ?? []) {
    if (!m.wrong || !m.right) errors.push(`${at}: mistakes entry needs both wrong and right`)
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
const byCat = {}
const byEquip = {}
const primaryCount = {}
for (const ex of exercises) {
  byCat[ex.category] = (byCat[ex.category] ?? 0) + 1
  for (const eq of ex.equipment ?? []) byEquip[eq] = (byEquip[eq] ?? 0) + 1
  for (const m of ex.primaryMuscles ?? []) primaryCount[m] = (primaryCount[m] ?? 0) + 1
}

console.log(`\n${exercises.length} exercises`)
console.log('  by category :', Object.entries(byCat).map(([k, v]) => `${k} ${v}`).join('  '))
console.log('  by equipment:', Object.entries(byEquip).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join('  '))
console.log(`  needing video: ${exercises.filter(e => !e.youtubeId).length}`)

const thin = Object.entries(primaryCount).filter(([, n]) => n < 3).map(([m]) => m)
if (thin.length) console.log(`  thin coverage (<3 as primary): ${thin.join(', ')}`)

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`)
  for (const w of warnings.slice(0, 20)) console.log('  ⚠ ' + w)
  if (warnings.length > 20) console.log(`  … and ${warnings.length - 20} more`)
}

if (errors.length) {
  console.error(`\n✗ ${errors.length} error(s):`)
  for (const e of errors.slice(0, 40)) console.error('  ' + e)
  if (errors.length > 40) console.error(`  … and ${errors.length - 40} more`)
  process.exit(1)
}

console.log('\n✓ all exercises valid\n')
