// Canonical muscle taxonomy for the anatomical body map.
// ---------------------------------------------------------------------------
// The exercise data uses 65 different freeform muscle strings ("upper traps",
// "upper trapezius", "gastrocnemius", "soleus", "calves"…). The body map can
// only shade a fixed set of regions, so every freeform string is normalised
// into one or more canonical region keys via ALIASES below.
//
// Some entries in targetMuscles aren't muscles at all ("cardiovascular system",
// "proprioception", "full body"). Those map to null — they still render as a
// text chip, they just don't shade a region on the figure.
// ---------------------------------------------------------------------------

// Region key → display label, and which view it's visible from.
export const REGIONS = {
  neck:        { label: 'Neck',            view: 'both'  },
  traps:       { label: 'Traps',           view: 'back'  },
  chest:       { label: 'Chest',           view: 'front' },
  'front-delts': { label: 'Front Delts',   view: 'front' },
  'side-delts':  { label: 'Side Delts',    view: 'both'  },
  'rear-delts':  { label: 'Rear Delts',    view: 'back'  },
  lats:        { label: 'Lats',            view: 'back'  },
  'mid-back':  { label: 'Mid Back',        view: 'back'  },
  'lower-back':{ label: 'Lower Back',      view: 'back'  },
  biceps:      { label: 'Biceps',          view: 'front' },
  triceps:     { label: 'Triceps',         view: 'back'  },
  forearms:    { label: 'Forearms',        view: 'both'  },
  abs:         { label: 'Abs',             view: 'front' },
  obliques:    { label: 'Obliques',        view: 'front' },
  'lower-back-x': { label: 'Spinal Erectors', view: 'back' },
  glutes:      { label: 'Glutes',          view: 'back'  },
  abductors:   { label: 'Outer Hip',       view: 'both'  },
  'hip-flexors': { label: 'Hip Flexors',   view: 'front' },
  quads:       { label: 'Quads',           view: 'front' },
  adductors:   { label: 'Inner Thigh',     view: 'front' },
  hamstrings:  { label: 'Hamstrings',      view: 'back'  },
  calves:      { label: 'Calves',          view: 'both'  },
}

// Every freeform string used in exercises.json → canonical region key(s).
// null = real training target but no region to shade on the figure.
export const ALIASES = {
  // Chest / shoulders / arms
  'chest':                 ['chest'],
  'pectorals':             ['chest'],
  'front deltoids':        ['front-delts'],
  'lateral deltoids':      ['side-delts'],
  'rear deltoids':         ['rear-delts'],
  'shoulders':             ['front-delts', 'side-delts'],
  'shoulder stabilizers':  ['rear-delts'],
  'rotator cuff':          ['rear-delts'],
  'biceps':                ['biceps'],
  'triceps':               ['triceps'],
  'forearms':              ['forearms'],

  // Back
  'lats':                  ['lats'],
  'rhomboids':             ['mid-back'],
  'upper back':            ['mid-back'],
  'thoracic spine':        ['mid-back'],
  'thoracic extensors':    ['mid-back'],
  'spine':                 ['mid-back'],
  'upper traps':           ['traps'],
  'upper trapezius':       ['traps'],
  'middle trapezius':      ['traps'],
  'lower trapezius':       ['traps'],
  'lower back':            ['lower-back'],
  'lower back (gentle)':   ['lower-back'],
  'lower back stabilizers':['lower-back'],
  'lower back mobility':   ['lower-back'],
  'lumbar extensors':      ['lower-back'],
  'lumbar mobility':       ['lower-back'],
  'spinal stabilizers':    ['lower-back'],
  'neck':                  ['neck'],

  // Core
  'core':                  ['abs'],
  'deep core':             ['abs'],
  'transverse abdominis':  ['abs'],
  'rectus abdominis':      ['abs'],
  'abdominals (stretch)':  ['abs'],
  'pelvic control':        ['abs'],
  'obliques':              ['obliques'],
  'serratus anterior':     ['obliques'],

  // Hips / glutes
  'glutes':                ['glutes'],
  'hips':                  ['glutes'],
  'hip rotators':          ['glutes'],
  'hip external rotators': ['glutes'],
  'hip internal rotators': ['glutes'],
  'piriformis':            ['glutes'],
  'glute medius':          ['abductors'],
  'glute minimus':         ['abductors'],
  'hip abductors':         ['abductors'],
  'hip stabilizers':       ['abductors'],
  'IT band':               ['abductors'],
  'hip flexors':           ['hip-flexors'],
  'iliopsoas':             ['hip-flexors'],
  'hip capsule':           ['hip-flexors'],

  // Legs
  'quadriceps':            ['quads'],
  'rectus femoris':        ['quads'],
  'hamstrings':            ['hamstrings'],
  'adductors':             ['adductors'],
  'legs':                  ['quads', 'hamstrings'],
  'calves':                ['calves'],
  'gastrocnemius':         ['calves'],
  'soleus':                ['calves'],
  'Achilles tendon':       ['calves'],
  'ankle stabilizers':     ['calves'],

  // Non-anatomical training targets — chip only, no region shaded
  'cardiovascular system': null,
  'proprioception':        null,
  'full body':             null,
  'knee joint':            null,
}

/**
 * Resolve a list of freeform muscle strings into canonical region keys.
 * Unknown strings are ignored for shading but kept for the chip list.
 */
export function toRegions(muscleStrings = []) {
  const out = new Set()
  muscleStrings.forEach(m => {
    const mapped = ALIASES[m]
    if (mapped) mapped.forEach(r => out.add(r))
  })
  return [...out]
}

/**
 * Split an exercise's targetMuscles into primary + secondary region sets.
 * Exercises may declare `primaryMuscles` / `secondaryMuscles` explicitly.
 * Falls back to: first two entries of targetMuscles are primary, rest secondary.
 */
export function resolveMuscles(exercise) {
  const hasExplicit = exercise.primaryMuscles || exercise.secondaryMuscles
  const primaryNames   = hasExplicit
    ? (exercise.primaryMuscles   || [])
    : (exercise.targetMuscles || []).slice(0, 2)
  const secondaryNames = hasExplicit
    ? (exercise.secondaryMuscles || [])
    : (exercise.targetMuscles || []).slice(2)

  const primary   = toRegions(primaryNames)
  const primarySet = new Set(primary)
  // A region shaded primary is never also shaded secondary.
  const secondary = toRegions(secondaryNames).filter(r => !primarySet.has(r))

  return { primary, secondary, primaryNames, secondaryNames }
}
