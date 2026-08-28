// Quick Burn — the "I can't do a real workout today" sessions.
// ---------------------------------------------------------------------------
// One tap picks a body part; out comes 5–6 simple, back-safe, genuinely
// effective moves with exact counts, bracketed by a short warm-up and the
// usual back-care stretch work. Every id here is curated by hand:
//   · backSafe only, nothing spicy for the spine
//   · easy-to-moderate difficulty — doable on a no-energy day
//   · compound or proven staples, so the few reps still count
//   · home equipment only (bodyweight / band / light dumbbells)
// ---------------------------------------------------------------------------

export const QUICK_SESSIONS = [
  {
    key: 'legs',
    label: 'Legs & Glutes',
    emoji: '🦵',
    blurb: 'Squat, hinge, and bridge — the big lower-body patterns, kept simple.',
    warmupIds: ['march-in-place', 'leg-swings'],
    mainIds: [
      'bodyweight-squat', 'step-back-lunge', 'glute-bridge',
      'band-rdl', 'wall-sit', 'bodyweight-calf-raise',
    ],
    cooldownIds: ['seated-hamstring-stretch', 'hip-flexor-stretch', 'childs-pose'],
  },
  {
    key: 'push',
    label: 'Chest & Shoulders',
    emoji: '🤜',
    blurb: 'Push in every direction without ever loading your lower back.',
    warmupIds: ['arm-circles', 'wall-angel'],
    mainIds: [
      'incline-push-up', 'push-up', 'band-overhead-press',
      'band-lateral-raise', 'scapular-push-up', 'dumbbell-overhead-tricep-extension',
    ],
    cooldownIds: ['doorway-chest-stretch', 'childs-pose', 'sphinx-pose'],
  },
  {
    key: 'pull',
    label: 'Back & Arms',
    emoji: '🦾',
    blurb: 'Rows, pull-aparts and posture work — a stronger back, gently.',
    warmupIds: ['arm-circles', 'thoracic-rotation'],
    mainIds: [
      'band-seated-row', 'banded-pull-apart', 'prone-y-t-w',
      'band-bicep-curl', 'superman-hold', 'prone-swimmer',
    ],
    cooldownIds: ['lat-stretch-kneeling', 'doorway-chest-stretch', 'childs-pose'],
  },
  {
    key: 'core',
    label: 'Core',
    emoji: '🎯',
    blurb: 'The proven back-safe staples — brace, hold, done.',
    warmupIds: ['cat-cow', 'pelvic-tilts'],
    mainIds: [
      'dead-bug', 'bird-dog', 'mcgill-curlup',
      'side-plank', 'glute-bridge-hold', 'heel-taps',
    ],
    cooldownIds: ['supine-twist', 'childs-pose', 'sphinx-pose'],
  },
  {
    key: 'full',
    label: 'Full Body',
    emoji: '⚡',
    blurb: 'One move per pattern. Burn some calories, cover everything, go home.',
    warmupIds: ['jumping-jacks', 'hip-circles'],
    mainIds: [
      'bodyweight-squat', 'incline-push-up', 'banded-pull-apart',
      'glute-bridge', 'dead-bug', 'march-in-place',
    ],
    cooldownIds: ['seated-hamstring-stretch', 'childs-pose', 'sphinx-pose'],
  },
]
