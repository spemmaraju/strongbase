// Quick Burn — pick a body part, get 5–6 simple safe moves, tick them off, go.
// ---------------------------------------------------------------------------
// For the days when the programmed session is too much. Each session is
// curated in data/quickSessions.js (back-safe, easy, effective, home gear
// only) and is bracketed by a short warm-up and the usual back-care
// stretches. Completing it writes a normal workout log, so streaks, XP and
// history all still count.
// ---------------------------------------------------------------------------

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useExerciseLibrary from '../hooks/useExerciseLibrary'
import useSaveWorkoutLog from '../hooks/useSaveWorkoutLog'
import ExerciseModal from '../components/ExerciseModal'
import { Icon } from '../components/Icons'
import { QUICK_SESSIONS } from '../data/quickSessions'
import { canShowExercise, estimateMinutes } from '../utils/sessionPlan'
import { getProgramDayNumber } from '../utils/workoutStats'
import {
  getDifficulty, getEffectiveness, DIFFICULTY_LABELS, DIFFICULTY_COLORS,
} from '../utils/exerciseMeta'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const K = {
  bg: '#0a0e1a', card: '#101828', inset: '#16233a',
  border: 'rgba(255,255,255,0.06)', borderSt: 'rgba(255,255,255,0.10)',
  pink: '#ec4899', purple: '#8b5cf6', violet: '#c084fc',
  grad: 'linear-gradient(90deg,#ec4899,#8b5cf6)',
  gradD: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
  gradH: 'linear-gradient(130deg, #fb923c 0%, #ec4899 48%, #8b5cf6 100%)',
  amber: '#f59e0b', teal: '#2dd4bf', green: '#22c55e',
  text: '#f8fafc', muted: '#94a3b8', subtle: '#64748b', dim: '#475569',
}

const SECTION_LABELS = { warm: 'Warm up', main: 'The work', cool: 'Wind down · back care' }

function formatSetsReps(ex) {
  if (ex.durationSeconds) {
    const t = ex.durationSeconds >= 60
      ? `${Math.floor(ex.durationSeconds / 60)} min`
      : `${ex.durationSeconds}s`
    return `${ex.sets} × ${t}`
  }
  return `${ex.sets} × ${ex.reps}`
}

export default function QuickSession() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { exMap } = useExerciseLibrary()
  const { save, status: saveStatus } = useSaveWorkoutLog()

  const [picked, setPicked]     = useState(null)   // a QUICK_SESSIONS entry
  const [done, setDone]         = useState(() => new Set())
  const [detail, setDetail]     = useState(null)
  const [finished, setFinished] = useState(null)

  // Depend on the contents, not the identity — the metadata array is a fresh
  // object every render (same trick useSessionDraft uses).
  const equipKey = (user?.user_metadata?.equipment || ['bodyweight']).join(',')
  const userEquipment  = useMemo(() => equipKey.split(','), [equipKey])
  const todayDayNumber = getProgramDayNumber(user)

  // Resolve the curated ids into exercises, dropping anything the user has no
  // equipment for. The curation is bodyweight/band-heavy so the session
  // survives that filter with plenty left.
  const rows = useMemo(() => {
    if (!picked) return []
    const resolve = (ids, section) => ids
      .map(id => exMap[id])
      .filter(Boolean)
      .filter(ex => canShowExercise(ex, 'home', userEquipment))
      .map(ex => ({ ex, section }))
    return [
      ...resolve(picked.warmupIds, 'warm'),
      ...resolve(picked.mainIds, 'main'),
      ...resolve(picked.cooldownIds, 'cool'),
    ]
  }, [picked, exMap, userEquipment])

  const mainCount = rows.filter(r => r.section === 'main').length
  const estMin    = estimateMinutes(rows.map(r => r.ex))
  // Rough moderate-effort figure (~5 kcal/min) — a motivator, not a measurement.
  const estKcal   = Math.round(estMin * 5 / 10) * 10

  function toggle(id) {
    setDone(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  async function handleComplete() {
    const doneIds   = rows.filter(r => done.has(r.ex.id)).map(r => r.ex.id)
    const totalSets = rows.reduce((s, r) => s + (done.has(r.ex.id) ? (r.ex.sets || 0) : 0), 0)
    await save({
      day: { day: todayDayNumber, theme: `Quick Burn · ${picked.label}` },
      completedExerciseIds: doneIds,
      totalSets,
      totalTimeSeconds: 0,
    })
    setFinished({ count: doneIds.length, totalSets })
  }

  const backBtn = (onClick, label) => (
    <button onClick={onClick} style={{
      background: K.inset, border: `1px solid ${K.borderSt}`,
      borderRadius: 10, color: K.muted,
      fontFamily: MONO, fontWeight: 700, fontSize: 11, letterSpacing: '0.1em',
      cursor: 'pointer', padding: '7px 13px', marginBottom: 20,
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>← {label}</button>
  )

  // ── Picker ────────────────────────────────────────────────────────────────
  if (!picked) {
    return (
      <div style={{ backgroundColor: K.bg, minHeight: '100svh' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 16px 48px' }}>
          {backBtn(() => navigate('/'), 'HOME')}

          <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.violet, letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 6px' }}>
            Quick Burn
          </p>
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: K.text, margin: '0 0 8px', lineHeight: 1.1 }}>
            No-energy day? No problem.
          </h1>
          <p style={{ fontSize: 14, color: K.muted, margin: '0 0 24px', lineHeight: 1.55, maxWidth: '52ch' }}>
            Pick a body part and get 5–6 simple, back-safe moves with exact counts —
            warm-up and stretches included. Do them, log it, go home without a care.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {QUICK_SESSIONS.map(qs => (
              <button
                key={qs.key}
                onClick={() => { setPicked(qs); setDone(new Set()) }}
                style={{
                  textAlign: 'left', cursor: 'pointer',
                  backgroundColor: K.card, border: `1px solid ${K.borderSt}`,
                  borderRadius: 18, padding: '18px 18px 16px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(192,132,252,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = K.borderSt }}
              >
                <span aria-hidden="true" style={{ fontSize: 28 }}>{qs.emoji}</span>
                <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 17, color: K.text, margin: 0 }}>
                  {qs.label}
                </p>
                <p style={{ fontSize: 12.5, color: K.muted, margin: 0, lineHeight: 1.5 }}>
                  {qs.blurb}
                </p>
                <p style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: K.violet, letterSpacing: '0.1em', margin: '4px 0 0' }}>
                  {qs.mainIds.length} MOVES + STRETCHES →
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Session ───────────────────────────────────────────────────────────────
  const doneCount   = rows.filter(r => done.has(r.ex.id)).length
  const canComplete = doneCount > 0
  let lastSection   = null

  return (
    <div style={{ backgroundColor: K.bg, minHeight: '100svh' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 16px 140px' }}>
        {backBtn(() => setPicked(null), 'PICK ANOTHER')}

        {/* Hero */}
        <div style={{
          background: K.gradH, borderRadius: 20, padding: '20px 20px 18px',
          position: 'relative', overflow: 'hidden', marginBottom: 20,
        }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 8px)',
          }} />
          <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 6px' }}>
            Quick Burn {picked.emoji}
          </p>
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: '#fff', margin: 0, lineHeight: 1.1 }}>
            {picked.label}
          </h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)', margin: '6px 0 0', lineHeight: 1.45 }}>
            {mainCount} simple moves, safe for your back. Do the counts, tick them off, done.
          </p>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {[[`~${estMin} min`, 'clock'], [`~${estKcal} kcal`, 'streak'], [`${doneCount}/${rows.length} done`, 'check']].map(([txt, icon]) => (
              <span key={txt} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icon name={icon} size={13} style={{ color: 'rgba(255,255,255,0.6)' }} />
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>{txt}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Exercise list, grouped warm-up → work → back care */}
        {rows.map(({ ex, section }) => {
          const header = section !== lastSection
          lastSection = section
          const isDone = done.has(ex.id)
          const diff   = getDifficulty(ex)
          const eff    = getEffectiveness(ex)
          return (
            <div key={ex.id}>
              {header && (
                <p style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: K.dim, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '20px 0 8px' }}>
                  {SECTION_LABELS[section]}
                </p>
              )}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                backgroundColor: K.card, border: `1px solid ${isDone ? 'rgba(34,197,94,0.3)' : K.border}`,
                borderRadius: 14, padding: '12px 14px', marginBottom: 8,
                opacity: isDone ? 0.65 : 1, transition: 'opacity 0.15s',
              }}>
                <button
                  onClick={() => toggle(ex.id)}
                  aria-label={isDone ? `Mark ${ex.name} not done` : `Mark ${ex.name} done`}
                  style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                    background: isDone ? K.green : 'transparent',
                    border: isDone ? 'none' : `2px solid ${K.dim}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {isDone && <Icon name="check" size={16} strokeWidth={3} style={{ color: '#0a0e1a' }} />}
                </button>

                <button
                  onClick={() => setDetail(ex)}
                  style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <p style={{
                    fontFamily: FONT, fontSize: 15, fontWeight: 700, color: K.text, margin: 0,
                    textDecoration: isDone ? 'line-through' : 'none',
                  }}>{ex.name}</p>
                  <p style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, margin: '4px 0 0', letterSpacing: '0.06em' }}>
                    <span style={{ color: DIFFICULTY_COLORS[diff] }}>{DIFFICULTY_LABELS[diff].toUpperCase()}</span>
                    <span style={{ color: K.dim }}> · </span>
                    <span style={{ color: K.violet }}>{'★'.repeat(eff)}<span style={{ opacity: 0.3 }}>{'★'.repeat(5 - eff)}</span></span>
                    <span style={{ color: K.dim }}> · tap for how-to + video</span>
                  </p>
                </button>

                {/* The count you actually do — big and unmissable */}
                <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 14, fontWeight: 700, color: K.violet }}>
                  {formatSetsReps(ex)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Fixed complete bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10 }}>
        <div style={{ height: 32, background: `linear-gradient(to bottom, transparent, ${K.bg})`, pointerEvents: 'none' }} />
        <div style={{
          backgroundColor: K.bg, padding: '0 16px',
          paddingBottom: 'max(env(safe-area-inset-bottom), 20px)', paddingTop: 4,
        }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <button
              onClick={handleComplete}
              disabled={!canComplete || saveStatus === 'saving'}
              style={{
                width: '100%', minHeight: 54,
                background: canComplete ? K.gradD : K.inset,
                color: canComplete ? '#fff' : K.dim,
                borderRadius: 16, border: 'none',
                fontFamily: FONT, fontWeight: 800, fontSize: 16,
                cursor: canComplete ? 'pointer' : 'not-allowed',
              }}
            >
              {saveStatus === 'saving'
                ? 'Saving…'
                : canComplete ? `Finish & log it (${doneCount})` : 'Tick something off first'}
            </button>
          </div>
        </div>
      </div>

      {detail && <ExerciseModal exercise={detail} onClose={() => setDetail(null)} />}

      {finished && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 90,
          backgroundColor: 'rgba(3,6,14,0.9)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            width: '100%', maxWidth: 380, textAlign: 'center',
            backgroundColor: K.card, border: `1px solid ${K.borderSt}`,
            borderRadius: 22, padding: 30,
          }}>
            <div style={{
              width: 66, height: 66, borderRadius: '50%', background: K.gradD,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px', color: '#fff',
            }}>
              <Icon name="check" size={32} strokeWidth={2.5} />
            </div>
            <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: K.text, margin: '0 0 6px' }}>
              That counts.
            </h2>
            <p style={{ fontSize: 14, color: K.muted, margin: '0 0 22px', lineHeight: 1.5 }}>
              {finished.count} {finished.count === 1 ? 'move' : 'moves'}, {finished.totalSets} {finished.totalSets === 1 ? 'set' : 'sets'}, +{finished.totalSets * 25} XP.
              {saveStatus === 'error'
                ? ' Saved on this device — it will sync when you are back online.'
                : ' Logged like any other workout. Go home without a care.'}
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                width: '100%', minHeight: 50, background: K.gradD, color: '#fff',
                border: 'none', borderRadius: 14,
                fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: 'pointer',
              }}
            >Done</button>
          </div>
        </div>
      )}
    </div>
  )
}
