// Anatomical muscle map — front + back figures with primary/secondary shading.
// ---------------------------------------------------------------------------
// Stylised rather than photorealistic: simplified muscle-group blocks that match
// the Kinetic geometric look. Both views are shown side by side (no flip toggle)
// so nothing needs tapping mid-workout.
//
//   <MuscleMap primary={['chest','triceps']} secondary={['front-delts']} />
// ---------------------------------------------------------------------------

import { REGIONS } from '../data/muscleGroups'

const BASE   = '#1c2740'   // unworked muscle
const STROKE = '#0a0e1a'   // separation between blocks — matches page bg
const PRIMARY   = '#ec4899'
const SECONDARY = 'rgba(236,72,153,0.30)'

// Optional graded mode, used by the coverage mirror: level 0 = untouched,
// 1–4 = how much it has actually been trained. Level 1 is deliberately visible
// — "barely" and "never" must not look the same.
const LEVEL_FILLS = [
  BASE,
  'rgba(236,72,153,0.18)',
  'rgba(236,72,153,0.38)',
  'rgba(236,72,153,0.64)',
  PRIMARY,
]

// ── Path data ──────────────────────────────────────────────────────────────
// viewBox 0 0 100 220 per figure. Regions keyed by canonical muscle key;
// value is an array of paths (left/right sides).

const FRONT = {
  neck:          ['M44,24 L56,24 L56,31 Q50,34.5 44,31 Z'],
  'front-delts': [
    'M34,38 Q26,37 22,45 Q21,52 25,57 Q32,55 35,46 Z',
    'M66,38 Q74,37 78,45 Q79,52 75,57 Q68,55 65,46 Z',
  ],
  'side-delts': [
    'M22,45 Q17,47 16,55 Q17,61 22,62 Q27,59 25,57 Q21,52 22,45 Z',
    'M78,45 Q83,47 84,55 Q83,61 78,62 Q73,59 75,57 Q79,52 78,45 Z',
  ],
  chest: [
    'M35,39 Q44,36 49,39 L49,58 Q42,61 36,56 Q33,47 35,39 Z',
    'M65,39 Q56,36 51,39 L51,58 Q58,61 64,56 Q67,47 65,39 Z',
  ],
  abs:      ['M41,60 L59,60 Q60,80 58,104 Q50,109 42,104 Q40,80 41,60 Z'],
  obliques: [
    'M35,58 Q32,72 34,90 Q37,100 40,103 Q39,80 40,60 Q37,57 35,58 Z',
    'M65,58 Q68,72 66,90 Q63,100 60,103 Q61,80 60,60 Q63,57 65,58 Z',
  ],
  biceps: [
    'M19,61 Q15,72 17,84 Q24,86 27,75 Q28,64 25,59 Z',
    'M81,61 Q85,72 83,84 Q76,86 73,75 Q72,64 75,59 Z',
  ],
  forearms: [
    'M17,86 Q13,98 15,111 Q22,112 24,99 Q25,89 23,85 Z',
    'M83,86 Q87,98 85,111 Q78,112 76,99 Q75,89 77,85 Z',
  ],
  'hip-flexors': [
    'M42,105 Q38,112 40,121 Q45,120 46,112 L45,105 Z',
    'M58,105 Q62,112 60,121 Q55,120 54,112 L55,105 Z',
  ],
  abductors: [
    'M34,103 Q30,110 32,120 Q36,122 38,116 Q39,108 38,103 Z',
    'M66,103 Q70,110 68,120 Q64,122 62,116 Q61,108 62,103 Z',
  ],
  quads: [
    'M34,121 Q30,142 34,164 Q43,168 47,160 Q48,140 47,119 Q40,117 34,121 Z',
    'M66,121 Q70,142 66,164 Q57,168 53,160 Q52,140 53,119 Q60,117 66,121 Z',
  ],
  adductors: [
    'M46,121 Q44,136 45,153 Q48,154 49,142 L49,121 Z',
    'M54,121 Q56,136 55,153 Q52,154 51,142 L51,121 Z',
  ],
  calves: [
    'M37,172 Q34,188 36,205 Q42,206 43,196 Q44,182 43,171 Z',
    'M63,172 Q66,188 64,205 Q58,206 57,196 Q56,182 57,171 Z',
  ],
}

const BACK = {
  neck:  ['M44,24 L56,24 L56,31 Q50,34.5 44,31 Z'],
  // Trapezius: narrow at the skull, wings out to both shoulders, tapers to a
  // point mid-thoracic. Drawn first so lats/rhomboids layer over its edges.
  traps: ['M50,26 Q42,28 36,35 Q33,39 34,42 Q42,44 46,49 L50,60 L54,49 Q58,44 66,42 Q67,39 64,35 Q58,28 50,26 Z'],
  'rear-delts': [
    'M34,38 Q26,37 22,45 Q21,53 25,58 Q32,56 35,47 Z',
    'M66,38 Q74,37 78,45 Q79,53 75,58 Q68,56 65,47 Z',
  ],
  'side-delts': [
    'M22,45 Q17,47 16,56 Q17,62 22,63 Q27,60 25,58 Q21,53 22,45 Z',
    'M78,45 Q83,47 84,56 Q83,62 78,63 Q73,60 75,58 Q79,53 78,45 Z',
  ],
  // Rhomboids sit medial, just below the trap wings and beside the spine.
  'mid-back': [
    'M40,50 Q37,58 39,68 Q44,67 46,59 Q45,52 43,50 Z',
    'M60,50 Q63,58 61,68 Q56,67 54,59 Q55,52 57,50 Z',
  ],
  // Lats: wide under the armpit, tapering in to the waist — the V.
  lats: [
    'M33,50 Q29,63 31,76 Q34,87 42,94 Q46,90 46,82 Q45,66 44,52 Q38,47 33,50 Z',
    'M67,50 Q71,63 69,76 Q66,87 58,94 Q54,90 54,82 Q55,66 56,52 Q62,47 67,50 Z',
  ],
  'lower-back': ['M44,88 L56,88 Q57,98 55,107 Q50,110 45,107 Q43,98 44,88 Z'],
  triceps: [
    'M19,61 Q15,72 17,85 Q24,87 27,76 Q28,65 25,59 Z',
    'M81,61 Q85,72 83,85 Q76,87 73,76 Q72,65 75,59 Z',
  ],
  forearms: [
    'M17,87 Q13,99 15,112 Q22,113 24,100 Q25,90 23,86 Z',
    'M83,87 Q87,99 85,112 Q78,113 76,100 Q75,90 77,86 Z',
  ],
  abductors: [
    'M33,104 Q29,112 31,122 Q35,124 37,117 Q38,109 37,104 Z',
    'M67,104 Q71,112 69,122 Q65,124 63,117 Q62,109 63,104 Z',
  ],
  glutes: [
    'M36,107 Q32,116 35,128 Q42,132 48,128 Q49,116 48,107 Q42,104 36,107 Z',
    'M64,107 Q68,116 65,128 Q58,132 52,128 Q51,116 52,107 Q58,104 64,107 Z',
  ],
  hamstrings: [
    'M35,130 Q32,148 35,166 Q43,169 47,161 Q48,144 47,128 Q41,126 35,130 Z',
    'M65,130 Q68,148 65,166 Q57,169 53,161 Q52,144 53,128 Q59,126 65,130 Z',
  ],
  calves: [
    'M36,172 Q32,186 35,203 Q42,205 44,194 Q45,181 43,171 Z',
    'M64,172 Q68,186 65,203 Q58,205 56,194 Q55,181 57,171 Z',
  ],
}

// Non-muscle base shapes (head, hands, feet) — never shaded.
const BASE_SHAPES = [
  { type: 'ellipse', cx: 50, cy: 15,  rx: 9.5, ry: 11 },
  { type: 'ellipse', cx: 19, cy: 117, rx: 4.4, ry: 6.2 },
  { type: 'ellipse', cx: 81, cy: 117, rx: 4.4, ry: 6.2 },
  { type: 'path', d: 'M35,206 Q33.5,213 38,214.5 L44,214.5 Q45.5,208 43.5,205.5 Z' },
  { type: 'path', d: 'M65,206 Q66.5,213 62,214.5 L56,214.5 Q54.5,208 56.5,205.5 Z' },
]

function Figure({ paths, primary, secondary, levels, maxWidth = 132, label }) {
  const prim = new Set(primary)
  const sec  = new Set(secondary)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg viewBox="0 0 100 220" style={{ width: '100%', maxWidth, height: 'auto', display: 'block' }}>
        {BASE_SHAPES.map((s, i) =>
          s.type === 'ellipse'
            ? <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={BASE} stroke={STROKE} strokeWidth="0.8" />
            : <path    key={i} d={s.d} fill={BASE} stroke={STROKE} strokeWidth="0.8" />
        )}
        {Object.entries(paths).map(([key, ds]) => {
          const fill = levels
            ? LEVEL_FILLS[Math.max(0, Math.min(4, levels[key] ?? 0))]
            : prim.has(key) ? PRIMARY : sec.has(key) ? SECONDARY : BASE
          return ds.map((d, i) => (
            <path key={`${key}-${i}`} d={d} fill={fill} stroke={STROKE} strokeWidth="0.8" strokeLinejoin="round" />
          ))
        })}
      </svg>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 8, fontWeight: 700,
        letterSpacing: '0.16em', color: '#475569', textTransform: 'uppercase',
      }}>{label}</span>
    </div>
  )
}

/**
 * Two modes. Pass `primary`/`secondary` (region keys) for the per-exercise view,
 * or `levels` ({ region: 0..4 }) for the graded coverage view. `levels` wins
 * when present; the per-exercise call sites are untouched.
 */
export default function MuscleMap({ primary = [], secondary = [], levels, maxWidth, style }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', ...style }}>
      <Figure paths={FRONT} primary={primary} secondary={secondary} levels={levels} maxWidth={maxWidth} label="Front" />
      <Figure paths={BACK}  primary={primary} secondary={secondary} levels={levels} maxWidth={maxWidth} label="Back" />
    </div>
  )
}

export { LEVEL_FILLS }

export { REGIONS }
