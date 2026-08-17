// Brace & Breathe — guided practice for the two skills under every exercise.
// ---------------------------------------------------------------------------
// Bracing and timed breathing are trainable, but a beginner can't see their
// own diaphragm — so every drill here is paired with hands-on self-checks
// ("right when / wrong signs") and a paced timer that does the counting for
// you. The ladder goes: find the breath → feel it 360° → breathe behind a
// brace → keep it while limbs move. Finish the ladder and the same cues show
// up on every exercise in the app.
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useWakeLock from '../hooks/useWakeLock'
import useAuth from '../hooks/useAuth'
import useExerciseLibrary from '../hooks/useExerciseLibrary'
import useMediaQuery from '../hooks/useMediaQuery'
import { getProgramDayNumber } from '../utils/workoutStats'
import { addExerciseToDay } from '../hooks/useSessionDraft'
import {
  BREATHING_LADDER, BREATHING_RULES, SAFETY_FLAGS, SELF_TESTS,
} from '../data/breathingDrills'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const K = {
  bg: '#0a0e1a', card: '#101828', inset: '#16233a',
  border: 'rgba(255,255,255,0.06)', borderSt: 'rgba(255,255,255,0.10)',
  pink: '#ec4899', purple: '#8b5cf6', violet: '#c084fc',
  gradD: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
  gradT: 'linear-gradient(135deg,#2dd4bf,#8b5cf6)',
  amber: '#f59e0b', teal: '#2dd4bf', green: '#22c55e',
  text: '#f8fafc', muted: '#94a3b8', subtle: '#64748b', dim: '#475569',
}

const DONE_KEY = 'strongbase_breathe_done'   // { [drillId]: completions }

function readDone() {
  try { return JSON.parse(localStorage.getItem(DONE_KEY) || '{}') } catch { return {} }
}

// ── Guided pacer ─────────────────────────────────────────────────────────────
// A breathing circle that grows on inhale phases and shrinks otherwise, with
// the phase label and a per-phase countdown. Interval-driven, 1s resolution —
// plenty for breath pacing.
function Pacer({ drill, onClose, onComplete }) {
  // One state object advanced by a PURE updater — StrictMode double-invokes
  // updaters in dev, so any side effect in here would double-step the timer.
  const [s, setS] = useState(() => ({
    phaseIdx: 0, cycle: 1, left: drill.phases[0].seconds, finished: false,
  }))
  const [paused, setPaused] = useState(false)
  const completedRef = useRef(false)

  useWakeLock(!s.finished)

  useEffect(() => {
    if (paused || s.finished) return
    const t = setInterval(() => {
      setS(prev => {
        if (prev.finished) return prev
        if (prev.left > 1) return { ...prev, left: prev.left - 1 }
        const nextPhase = prev.phaseIdx + 1
        if (nextPhase < drill.phases.length) {
          return { ...prev, phaseIdx: nextPhase, left: drill.phases[nextPhase].seconds }
        }
        if (prev.cycle < drill.cycles) {
          return { phaseIdx: 0, cycle: prev.cycle + 1, left: drill.phases[0].seconds, finished: false }
        }
        return { ...prev, finished: true }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [paused, s.finished, drill])

  // Completion is a side effect of the state, not of the tick.
  useEffect(() => {
    if (s.finished && !completedRef.current) {
      completedRef.current = true
      onComplete()
    }
  }, [s.finished, onComplete])

  const { phaseIdx, cycle, left, finished } = s
  const phase = drill.phases[phaseIdx]
  const grow  = !finished && phase.grow

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 80,
      backgroundColor: 'rgba(3,6,14,0.96)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 24,
    }}>
      <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.teal, letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 6px' }}>
        {drill.name}
      </p>
      <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: K.dim, margin: '0 0 34px' }}>
        {finished ? 'DONE' : `ROUND ${cycle} / ${drill.cycles}`}
      </p>

      {/* The breathing circle */}
      <div style={{ width: 230, height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 36 }}>
        <div style={{
          width: 210, height: 210, borderRadius: '50%',
          background: finished ? K.gradD : K.gradT,
          opacity: 0.9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: grow ? 'scale(1)' : 'scale(0.55)',
          transition: `transform ${finished ? 0.4 : phase.seconds}s ease-in-out`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 40, color: '#fff', margin: 0, lineHeight: 1 }}>
              {finished ? '✓' : left}
            </p>
          </div>
        </div>
      </div>

      <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: K.text, margin: '0 0 8px', textAlign: 'center', maxWidth: 420 }}>
        {finished ? 'Nicely done.' : phase.label}
      </p>
      {!finished && (
        <p style={{ fontSize: 13.5, color: K.subtle, margin: 0, textAlign: 'center' }}>
          Follow the circle — grow with it, shrink with it.
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 40 }}>
        {!finished && (
          <button onClick={() => setPaused(p => !p)} style={{
            minHeight: 46, padding: '0 22px', borderRadius: 12, cursor: 'pointer',
            backgroundColor: K.inset, border: `1px solid ${K.borderSt}`,
            color: K.text, fontFamily: FONT, fontWeight: 700, fontSize: 14,
          }}>{paused ? '▶ Resume' : '⏸ Pause'}</button>
        )}
        <button onClick={onClose} style={{
          minHeight: 46, padding: '0 22px', borderRadius: 12, cursor: 'pointer',
          background: finished ? K.gradD : 'none',
          border: finished ? 'none' : `1px solid ${K.borderSt}`,
          color: finished ? '#fff' : K.muted, fontFamily: FONT, fontWeight: 700, fontSize: 14,
        }}>{finished ? 'Finish' : 'Stop'}</button>
      </div>
    </div>
  )
}

function Section({ eyebrow, color, children }) {
  return (
    <div style={{ marginTop: 30 }}>
      <p style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color, letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 12px' }}>
        {eyebrow}
      </p>
      {children}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function BreathingTrainer() {
  const navigate = useNavigate()
  const isWide = useMediaQuery('(min-width: 768px)')
  const { user } = useAuth()
  const { exMap } = useExerciseLibrary()

  const [active, setActive] = useState(null)     // drill being paced
  const [openDrill, setOpenDrill] = useState(BREATHING_LADDER[0].id)
  const [done, setDone] = useState(readDone)
  const [addedToday, setAddedToday] = useState(null)  // exerciseId just added

  const todayDayNumber = getProgramDayNumber(user)
  const totalRuns = Object.values(done).reduce((s, n) => s + n, 0)

  function completeDrill(drill) {
    setDone(prev => {
      const next = { ...prev, [drill.id]: (prev[drill.id] || 0) + 1 }
      try { localStorage.setItem(DONE_KEY, JSON.stringify(next)) } catch { /* quota */ }
      return next
    })
  }

  function addDrillToToday(exerciseId) {
    addExerciseToDay(todayDayNumber, exerciseId)
    setAddedToday(exerciseId)
  }

  return (
    <div style={{ backgroundColor: K.bg, minHeight: '100svh' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: isWide ? '30px 28px 70px' : '22px 16px 60px' }}>

        <button onClick={() => navigate(-1)} style={{
          background: K.inset, border: `1px solid ${K.borderSt}`, borderRadius: 10,
          color: K.muted, fontFamily: MONO, fontWeight: 700, fontSize: 11,
          letterSpacing: '0.1em', cursor: 'pointer', padding: '6px 12px', marginBottom: 22,
        }}>← BACK</button>

        <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.teal, letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 6px' }}>
          Trainable skill · ~9 min
        </p>
        <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 30, color: K.text, margin: '0 0 10px', lineHeight: 1.1 }}>
          Brace &amp; Breathe
        </h1>
        <p style={{ fontSize: 14.5, color: K.muted, lineHeight: 1.6, margin: 0, maxWidth: '60ch' }}>
          Two skills sit under every exercise in this app: a <strong style={{ color: K.text }}>360° brace</strong> that
          protects your back, and <strong style={{ color: K.text }}>breathing that never stops</strong> while you work.
          Both are learnable in days, not months — and every drill below comes with a hands-on check so you
          <em> know</em> you're doing it right instead of hoping.
        </p>

        {totalRuns > 0 && (
          <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: K.green, margin: '14px 0 0' }}>
            ✓ {totalRuns} guided {totalRuns === 1 ? 'run' : 'runs'} completed
          </p>
        )}

        {/* The four rules — what all of this compiles down to */}
        <Section eyebrow="The four rules" color={K.violet}>
          <div style={{ display: 'grid', gridTemplateColumns: isWide ? '1fr 1fr' : '1fr', gap: 8 }}>
            {BREATHING_RULES.map(r => (
              <div key={r.rule} style={{ backgroundColor: K.card, border: `1px solid ${K.border}`, borderRadius: 14, padding: '13px 15px' }}>
                <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 800, color: K.text, margin: '0 0 4px' }}>{r.rule}</p>
                <p style={{ fontSize: 12.5, color: K.muted, lineHeight: 1.55, margin: 0 }}>{r.detail}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* The ladder */}
        <Section eyebrow="The practice ladder — in order, a few minutes each" color={K.teal}>
          {BREATHING_LADDER.map((d, i) => {
            const open = openDrill === d.id
            const runs = done[d.id] || 0
            const libraryEx = d.exerciseId ? exMap[d.exerciseId] : null
            return (
              <div key={d.id} style={{
                backgroundColor: K.card, borderRadius: 16, marginBottom: 10,
                border: `1px solid ${open ? 'rgba(45,212,191,0.35)' : K.border}`,
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => setOpenDrill(open ? null : d.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 13, width: '100%',
                    padding: '14px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: runs > 0 ? 'rgba(34,197,94,0.16)' : K.inset,
                    border: runs > 0 ? '1px solid rgba(34,197,94,0.4)' : `1px solid ${K.borderSt}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: MONO, fontSize: 12, fontWeight: 700,
                    color: runs > 0 ? K.green : K.subtle,
                  }}>{runs > 0 ? '✓' : i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: FONT, fontSize: 15.5, fontWeight: 800, color: K.text, margin: 0 }}>{d.name}</p>
                    <p style={{ fontSize: 12, color: K.subtle, margin: '2px 0 0' }}>
                      {d.subtitle} · ~{d.minutes} min{runs > 0 ? ` · done ×${runs}` : ''}
                    </p>
                  </div>
                  <span style={{
                    color: K.dim, fontSize: 12, flexShrink: 0,
                    display: 'inline-block', transition: 'transform 0.18s',
                    transform: open ? 'rotate(90deg)' : 'none',
                  }}>▶</span>
                </button>

                {open && (
                  <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${K.border}` }}>
                    <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '14px 0 8px' }}>
                      Set up
                    </p>
                    {d.setup.map((s, j) => (
                      <div key={j} style={{ display: 'flex', gap: 10, marginBottom: 7 }}>
                        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: K.teal, flexShrink: 0, marginTop: 2 }}>{j + 1}</span>
                        <p style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.55, margin: 0 }}>{s}</p>
                      </div>
                    ))}

                    <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.green, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '14px 0 8px' }}>
                      You're doing it right if
                    </p>
                    {d.rightWhen.map((s, j) => (
                      <div key={j} style={{ display: 'flex', gap: 9, marginBottom: 6 }}>
                        <span style={{ color: K.green, fontSize: 12, flexShrink: 0, marginTop: 1 }}>✓</span>
                        <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>{s}</p>
                      </div>
                    ))}

                    <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.amber, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '14px 0 8px' }}>
                      Feels off?
                    </p>
                    {d.wrongSigns.map((w, j) => (
                      <div key={j} style={{ backgroundColor: K.inset, borderRadius: 10, padding: '9px 12px', marginBottom: 6 }}>
                        <p style={{ fontSize: 12.5, fontWeight: 700, color: K.amber, margin: '0 0 3px' }}>{w.felt}</p>
                        <p style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>{w.fix}</p>
                      </div>
                    ))}

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                      <button onClick={() => setActive(d)} style={{
                        flex: 1, minWidth: 170, minHeight: 46, borderRadius: 12, border: 'none',
                        background: K.gradT, color: '#062024',
                        fontFamily: FONT, fontWeight: 800, fontSize: 14.5, cursor: 'pointer',
                      }}>▶ Start guided timer</button>
                      {libraryEx && (
                        <button
                          onClick={() => addDrillToToday(d.exerciseId)}
                          disabled={addedToday === d.exerciseId}
                          style={{
                            minHeight: 46, padding: '0 16px', borderRadius: 12, cursor: 'pointer',
                            backgroundColor: K.inset, border: `1px solid ${K.borderSt}`,
                            color: addedToday === d.exerciseId ? K.green : K.muted,
                            fontFamily: FONT, fontWeight: 700, fontSize: 13,
                          }}
                        >{addedToday === d.exerciseId ? '✓ In today\'s workout' : '+ Add to today'}</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </Section>

        {/* Self-tests — the "am I doing it right?" answer, portable to any set */}
        <Section eyebrow="Test yourself, any time, mid-workout" color={K.violet}>
          <div style={{ display: 'grid', gridTemplateColumns: isWide ? '1fr 1fr 1fr' : '1fr', gap: 8 }}>
            {SELF_TESTS.map(t => (
              <div key={t.name} style={{ backgroundColor: K.card, border: `1px solid ${K.border}`, borderRadius: 14, padding: '13px 15px' }}>
                <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 800, color: K.text, margin: '0 0 5px' }}>{t.name}</p>
                <p style={{ fontSize: 12.5, color: K.muted, lineHeight: 1.5, margin: '0 0 8px' }}>{t.how}</p>
                <p style={{ fontSize: 12, color: K.green, lineHeight: 1.5, margin: '0 0 4px' }}>✓ {t.pass}</p>
                <p style={{ fontSize: 12, color: K.amber, lineHeight: 1.5, margin: 0 }}>✕ {t.fail}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Safety */}
        <Section eyebrow="Keep it safe" color="#f87171">
          <div style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 14, padding: '14px 16px' }}>
            {SAFETY_FLAGS.map((s, i) => (
              <p key={i} style={{ fontSize: 13, color: '#fecaca', lineHeight: 1.6, margin: i > 0 ? '10px 0 0' : 0 }}>
                {s}
              </p>
            ))}
          </div>
        </Section>

        <p style={{ fontSize: 13, color: K.subtle, lineHeight: 1.6, margin: '28px 0 0', maxWidth: '60ch' }}>
          Once the ladder feels easy, you're done "practicing" — every exercise in the app now shows its own
          🫁 brace &amp; breathe line, so the skill just rides along with your normal workouts.
        </p>
      </div>

      {active && (
        <Pacer
          drill={active}
          onClose={() => setActive(null)}
          onComplete={() => completeDrill(active)}
        />
      )}
    </div>
  )
}
