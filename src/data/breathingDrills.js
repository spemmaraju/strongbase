// The Brace & Breathe practice ladder.
// ---------------------------------------------------------------------------
// Bracing and breathing are trainable skills, and the hard part for a beginner
// is *feedback* — knowing whether what you're doing is the real thing. Every
// drill here pairs the practice with a physical self-check (something you can
// feel with your own hands) so you never have to guess.
//
// The ladder is deliberate: learn the breath lying down (gravity helps), feel
// it expand sideways, then breathe behind a brace, then keep the brace while
// limbs move. Same progression a physio would run.
// ---------------------------------------------------------------------------

export const BREATHING_LADDER = [
  {
    id: 'crocodile',
    name: 'Crocodile breathing',
    subtitle: 'Find the belly breath',
    minutes: 2,
    exerciseId: 'crocodile-breathing',
    // The pacer cycles these phases for `cycles` rounds.
    phases: [
      { label: 'Inhale through the nose', short: 'Inhale', seconds: 4, grow: true },
      { label: 'Slow exhale through the mouth', short: 'Exhale', seconds: 6, grow: false },
    ],
    cycles: 12,
    setup: [
      'Lie face down, forehead on your stacked hands, legs relaxed.',
      'Let your whole body go heavy — the floor is doing the holding.',
      'Breathe in through your nose and send the air toward your belly, not your chest.',
    ],
    rightWhen: [
      'You feel your belly press into the floor on every inhale.',
      'Your lower back rises and falls gently with each breath.',
      'Your chest and shoulders stay almost still.',
    ],
    wrongSigns: [
      { felt: 'Shoulders hiking toward your ears on the inhale', fix: 'You are chest-breathing. Slow down, breathe less deep, and aim the air at your waistband.' },
      { felt: 'Nothing moving at all', fix: 'Push your belly into the floor on purpose for a few breaths — exaggerate it, then let it become natural.' },
    ],
  },
  {
    id: 'ninety-ninety',
    name: '90/90 wall breathing',
    subtitle: 'Feel the ribs expand sideways',
    minutes: 2,
    exerciseId: 'ninety-ninety-breathing',
    phases: [
      { label: 'Inhale — ribs widen into your hands', short: 'Inhale', seconds: 4, grow: true },
      { label: 'Long exhale — ribs melt down', short: 'Exhale', seconds: 8, grow: false },
    ],
    cycles: 10,
    setup: [
      'Lie on your back, feet flat on a wall (or on the floor), knees and hips at right angles.',
      'Place your hands on the sides of your lower ribs, fingers pointing toward each other.',
      'Breathe in through the nose and try to push your hands apart — sideways, not up.',
    ],
    rightWhen: [
      'Your hands are pushed apart on each inhale — expansion is 360°, sideways and into your back.',
      'The long exhale ends with your ribs feeling "stacked" over your pelvis, low back gently flat.',
      'Neck and jaw stay relaxed the whole time.',
    ],
    wrongSigns: [
      { felt: 'Only your chest rises, hands barely move', fix: 'Exhale ALL the air out first — a full, long exhale — then let the next inhale go wide on its own.' },
      { felt: 'Low back arching off the floor on the inhale', fix: 'You are over-breathing. Take in less air and keep the exhale twice as long as the inhale.' },
    ],
  },
  {
    id: 'brace-hiss',
    name: 'Standing brace + hiss',
    subtitle: 'Breathe behind the brace',
    minutes: 2,
    exerciseId: null,
    phases: [
      { label: 'Inhale wide into your waist', short: 'Inhale', seconds: 3, grow: true },
      { label: 'Brace ~30% and HISS the air out', short: 'Hiss', seconds: 8, grow: false },
      { label: 'Relax and reset', short: 'Reset', seconds: 3, grow: false },
    ],
    cycles: 8,
    setup: [
      'Stand tall, hands on the sides of your waist, thumbs toward your back.',
      'Inhale wide (like the last drill), then tense your midsection to about 30% — as if someone friendly might poke your stomach.',
      'Keeping that tension, force the air out in a long "ssss" hiss. The hiss is the proof you can brace AND breathe.',
    ],
    rightWhen: [
      'Your waist pushes out slightly into your hands when you brace — 360°, sides and back too, not sucked in.',
      'The hiss is strong and steady for the full count — brace on, air still moving.',
      'You could hold a conversation at this brace level. That is the point.',
    ],
    wrongSigns: [
      { felt: 'Belly sucking IN when you brace', fix: 'That is hollowing, the opposite skill. Think "get thick", not "get thin" — push gently out into your hands.' },
      { felt: 'Face reddening, breath completely stopped', fix: 'You jumped to a 100% brace. Everyday sets need 20–40%. Save max bracing for years from now.' },
    ],
  },
  {
    id: 'braced-deadbug',
    name: 'Braced dead bug',
    subtitle: 'Keep it while you move',
    minutes: 3,
    exerciseId: 'dead-bug',
    phases: [
      { label: 'Inhale at the top, arms and knees up', short: 'Inhale', seconds: 3, grow: true },
      { label: 'Exhale slowly as arm + leg lower away', short: 'Exhale + reach', seconds: 6, grow: false },
      { label: 'Return to the start', short: 'Return', seconds: 3, grow: false },
    ],
    cycles: 10,
    setup: [
      'Lie on your back, arms to the ceiling, knees stacked over hips.',
      'Exhale to set your ribs down and press your low back gently into the floor. That light pressure is your brace gauge.',
      'Lower one arm and the opposite leg away while exhaling — only as far as the low back stays quietly on the floor.',
    ],
    rightWhen: [
      'Your low back keeps gentle contact with the floor for every rep.',
      'The exhale lasts the entire lowering — you arrive at the bottom empty.',
      'It feels like effort in the deep belly, not the neck or lower back.',
    ],
    wrongSigns: [
      { felt: 'Low back popping off the floor as the leg lowers', fix: 'The limbs beat the brace. Shrink the range — lower the leg halfway — and win there first.' },
      { felt: 'Holding your breath to stay stable', fix: 'That is the old habit this drill exists to replace. Slower exhale, smaller reach.' },
    ],
  },
]

// The rules that transfer to every exercise in the app. Shown once on the
// trainer and echoed per-exercise via each exercise's `breathing` field.
export const BREATHING_RULES = [
  { rule: 'Exhale on the effort', detail: 'Push, pull, lift, stand — the hard part of any rep happens while air is leaving through pursed lips or a hiss.' },
  { rule: 'Inhale on the easy part', detail: 'Lowering, returning, resetting. Nose in, unhurried.' },
  { rule: 'Brace to the job, not to the max', detail: 'Everyday sets need a 20–40% brace — enough that a friendly poke wouldn\'t sink in. A 100% brace with held breath is an advanced tool you don\'t need yet.' },
  { rule: 'If the breath stops, something is wrong', detail: 'Held breath during planks, carries or holds means the brace took over. Ease the brace until air moves again.' },
]

export const SAFETY_FLAGS = [
  'Dizzy, light-headed, or tingling lips/fingers — stop, breathe normally, and shorten the exhales next round. This is over-breathing, common and harmless if you stop.',
  'If you have high blood pressure, a hernia, are pregnant, or are recovering from surgery: skip full breath-holds entirely (you never need them here) and keep every brace gentle. Ask your clinician before adding load.',
  'Sharp pain anywhere during a drill is a stop, not a "push through".',
  'These drills are skill practice, not a workout — calm, fresh, and short beats heroic. Twice a day for two minutes wins.',
]

export const SELF_TESTS = [
  {
    name: 'The talk test',
    how: 'Mid-plank or mid-carry, say your address out loud.',
    pass: 'Words come out steady — your brace and breath are coexisting.',
    fail: 'You can\'t speak, or the words burst out — you are breath-holding. Ease the brace.',
  },
  {
    name: 'The hands-on-waist test',
    how: 'Hands on the sides of your waist during any inhale.',
    pass: 'Hands pushed apart — sideways, and into your back too.',
    fail: 'Shoulders rise, hands don\'t move — the breath is living in your chest.',
  },
  {
    name: 'The poke test',
    how: 'Braced at ~30%, press two fingers into the side of your stomach.',
    pass: 'Fingers meet springy resistance all around — front, sides, back.',
    fail: 'Fingers sink in, or your belly is sucked in hard — no brace, or hollowing.',
  },
]
