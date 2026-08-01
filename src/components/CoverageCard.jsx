// The coverage mirror — what you've actually trained in the last 28 days.
// ---------------------------------------------------------------------------
// A mirror, not a scoreboard. Every line is a statement of fact from your logs;
// there's no target, no score and nothing to keep up. The one action it offers
// is composing a draft session aimed at whatever has gone cold — which you then
// edit like any other session.
// ---------------------------------------------------------------------------

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import MuscleMap, { LEVEL_FILLS } from './MuscleMap'
import useExerciseLibrary from '../hooks/useExerciseLibrary'
import useAuth from '../hooks/useAuth'
import { buildCoverage, pickForGaps } from '../utils/coverage'
import { canShowExercise } from '../utils/sessionPlan'
import { draftKey } from '../hooks/useSessionDraft'
import { getProgramDayNumber } from '../utils/workoutStats'
import weeklyPlan from '../data/weeklyPlan.json'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const K = {
  card: '#101828', inset: '#16233a',
  border: 'rgba(255,255,255,0.06)', borderSt: 'rgba(255,255,255,0.10)',
  violet: '#c084fc', text: '#f8fafc', muted: '#94a3b8', dim: '#475569',
}

const WINDOWS = [
  { days: 7,  label: '7D'  },
  { days: 28, label: '28D' },
  { days: 90, label: '90D' },
]

export default function CoverageCard({ logs = [], style }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { exercises, exMap } = useExerciseLibrary()
  const [days, setDays] = useState(28)
  const [building, setBuilding] = useState(false)

  const coverage = useMemo(
    () => buildCoverage(logs, exMap, { days }),
    [logs, exMap, days],
  )

  const mode = (() => {
    try { return localStorage.getItem('strongbase_workout_mode') || 'home' } catch { return 'home' }
  })()
  const userEquipment = user?.user_metadata?.equipment || ['bodyweight']

  function buildFromGaps() {
    setBuilding(true)
    const dayNumber = getProgramDayNumber(user)
    const day = weeklyPlan.days.find(d => d.day === dayNumber) || weeklyPlan.days[0]

    const canUse = ex => canShowExercise(ex, mode, userEquipment)
    const mains = pickForGaps(coverage, exercises, { canUse, count: 6 })

    const pick = (cat, n) => exercises
      .filter(e => e.category === cat && canUse(e))
      .slice(0, n)
      .map(e => e.id)

    const order = [
      ...pick('warm-up', 2),
      ...mains.map(e => e.id),
      ...pick('flexibility', 3),
    ]
    // Dedupe — an id appearing twice would render twice and tick twice.
    const unique = [...new Set(order)]

    try {
      localStorage.setItem(draftKey(day.day), JSON.stringify({ order: unique, done: [] }))
    } catch {}
    navigate(`/day/${day.day}`)
  }

  const hasData = coverage.sessionCount > 0

  return (
    <div style={{
      backgroundColor: K.card, border: `1px solid ${K.borderSt}`,
      borderRadius: 18, padding: 18, ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
        <p style={{
          fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim,
          letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0,
        }}>What you've trained</p>
        <div style={{ display: 'flex', gap: 3 }}>
          {WINDOWS.map(w => (
            <button
              key={w.days}
              onClick={() => setDays(w.days)}
              style={{
                padding: '3px 7px', borderRadius: 7, cursor: 'pointer',
                fontFamily: MONO, fontSize: 9, fontWeight: 700,
                backgroundColor: days === w.days ? 'rgba(192,132,252,0.16)' : 'transparent',
                color: days === w.days ? K.violet : K.dim,
                border: `1px solid ${days === w.days ? 'rgba(192,132,252,0.35)' : 'transparent'}`,
              }}
            >{w.label}</button>
          ))}
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: K.muted, margin: '0 0 14px' }}>
        {coverage.sessionCount} session{coverage.sessionCount === 1 ? '' : 's'} in {days} days
      </p>

      <MuscleMap levels={coverage.levels} maxWidth={118} style={{ marginBottom: 12 }} />

      {/* Legend — without it the shading is just decoration */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 14 }}>
        <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: K.dim }}>LESS</span>
        {LEVEL_FILLS.map((f, i) => (
          <div key={i} style={{
            width: 15, height: 8, borderRadius: 2, backgroundColor: f,
            border: i === 0 ? `1px solid ${K.border}` : 'none',
          }} />
        ))}
        <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: K.dim }}>MORE</span>
      </div>

      {hasData && coverage.observations.map((o, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: K.violet, flexShrink: 0, marginTop: 7 }} />
          <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>{o}</p>
        </div>
      ))}

      {!hasData && (
        <p style={{ fontSize: 13, color: K.dim, lineHeight: 1.5, margin: '0 0 8px' }}>
          Nothing logged in this window yet.
        </p>
      )}

      {hasData && (
        <button
          onClick={buildFromGaps}
          disabled={building}
          style={{
            width: '100%', minHeight: 40, marginTop: 8, borderRadius: 11,
            cursor: building ? 'wait' : 'pointer',
            backgroundColor: K.inset, border: `1px solid ${K.borderSt}`,
            color: K.text, fontFamily: FONT, fontWeight: 700, fontSize: 13,
          }}
        >Build a session from the gaps →</button>
      )}
    </div>
  )
}
