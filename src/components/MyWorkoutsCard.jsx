// "My workouts" — saved custom workouts with a prominent Build button.

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useCustomWorkouts from '../hooks/useCustomWorkouts'
import useExerciseLibrary from '../hooks/useExerciseLibrary'
import { FOCUS_PRESETS } from '../utils/exerciseMeta'
import { estimateMinutes } from '../utils/sessionPlan'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const K = {
  card: '#101828', inset: '#16233a',
  border: 'rgba(255,255,255,0.06)', borderSt: 'rgba(255,255,255,0.10)',
  violet: '#c084fc', grad: 'linear-gradient(90deg,#ec4899,#8b5cf6)',
  text: '#f8fafc', muted: '#94a3b8', subtle: '#64748b',
}

export default function MyWorkoutsCard({ compact = false }) {
  const navigate = useNavigate()
  const { workouts } = useCustomWorkouts()
  const { exMap } = useExerciseLibrary()

  const items = useMemo(() => workouts.map(w => {
    const rows = (w.exerciseIds || []).map(id => exMap[id]).filter(Boolean)
    return {
      w,
      focus: FOCUS_PRESETS.find(f => f.id === w.focusId)?.label || 'Custom',
      count: rows.length,
      minutes: rows.length ? estimateMinutes(rows) : 0,
    }
  }), [workouts, exMap])

  const shown = compact ? items.slice(0, 3) : items

  return (
    <section style={{
      backgroundColor: K.card, border: `1px solid ${K.border}`, borderRadius: 18,
      padding: compact ? 14 : 18, fontFamily: FONT,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: items.length ? 10 : 6 }}>
        <h2 style={{ fontSize: compact ? 16 : 18, fontWeight: 800, color: K.text, margin: 0 }}>My workouts</h2>
        {items.length > 0 && (
          <button onClick={() => navigate('/build')} style={buildBtn}>＋ Build a workout</button>
        )}
      </div>

      {items.length === 0 ? (
        <div>
          <p style={{ fontSize: 14, color: K.muted, lineHeight: 1.5, margin: '0 0 14px' }}>
            Make your own session: pick a focus, get a suggested list, add what you like, and save it to reuse.
          </p>
          <button onClick={() => navigate('/build')} style={{ ...buildBtn, width: '100%', height: 48, fontSize: 15 }}>
            ＋ Build your first workout
          </button>
        </div>
      ) : (
        <div>
          {shown.map(({ w, focus, count, minutes }) => (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: `1px solid ${K.border}` }}>
              <button
                onClick={() => navigate(`/day/c-${w.id}`)}
                style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0' }}
              >
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: K.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</span>
                <span style={{ display: 'block', fontFamily: MONO, fontSize: 11, fontWeight: 700, color: K.muted, marginTop: 3, letterSpacing: '0.04em' }}>
                  {focus} · {count} exercise{count === 1 ? '' : 's'}{minutes ? ` · ~${minutes} min` : ''}
                </span>
              </button>
              <button
                onClick={() => navigate(`/build/${w.id}`)}
                aria-label={`Edit ${w.name}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: K.violet, fontFamily: FONT, fontSize: 13, fontWeight: 700, padding: '12px 6px' }}
              >Edit</button>
            </div>
          ))}
          {compact && items.length > shown.length && (
            <p style={{ fontFamily: MONO, fontSize: 11, color: K.subtle, margin: '6px 0 0' }}>+{items.length - shown.length} more</p>
          )}
        </div>
      )}
    </section>
  )
}

const buildBtn = {
  height: 40, padding: '0 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
  background: K.grad, color: '#fff', fontFamily: FONT, fontSize: 14, fontWeight: 800,
}
