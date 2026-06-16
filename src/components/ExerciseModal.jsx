import { useEffect } from 'react'
import useMediaQuery from '../hooks/useMediaQuery'
import { Icon } from './Icons'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const K = {
  bg:      '#0a0e1a',
  panel:   '#0a111e',
  card:    '#101828',
  inset:   '#16233a',
  border:  'rgba(255,255,255,0.06)',
  borderSt:'rgba(255,255,255,0.10)',
  pink:    '#ec4899',
  purple:  '#8b5cf6',
  violet:  '#c084fc',
  grad:    'linear-gradient(90deg, #ec4899, #8b5cf6)',
  amber:   '#f59e0b',
  teal:    '#2dd4bf',
  text:    '#f8fafc',
  muted:   '#94a3b8',
  subtle:  '#64748b',
  dim:     '#475569',
}

const CAT_COLORS = {
  'warm-up':   K.amber,
  strength:    K.pink,
  stability:   K.purple,
  flexibility: K.teal,
  cardio:      '#3b82f6',
}

export default function ExerciseModal({ exercise, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const isWide = useMediaQuery('(min-width: 768px)')

  if (!exercise) return null

  const catColor = CAT_COLORS[exercise.category] || K.purple
  const catLabel = exercise.category.replace('-', ' ')
  const setsRepsLabel = exercise.durationSeconds
    ? `${exercise.sets} × ${exercise.durationSeconds}s hold`
    : `${exercise.sets} × ${exercise.reps} reps`

  // ── Left column: category chip, name, sets/reps, video, targets ──────────
  const LeftCol = (
    <div style={{
      width: isWide ? 380 : '100%',
      flexShrink: 0,
      backgroundColor: K.panel,
      padding: isWide ? '28px 24px 28px 28px' : '20px 20px 0',
      overflowY: isWide ? 'auto' : 'visible',
    }}>
      {/* Category chip */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        backgroundColor: `${catColor}18`, borderRadius: 99,
        padding: '5px 12px', marginBottom: 14,
        border: `1px solid ${catColor}30`,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: catColor }} />
        <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: catColor, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {catLabel}
        </span>
      </div>

      {/* Exercise name */}
      <h2 style={{
        fontFamily: FONT, fontWeight: 800, fontSize: 28,
        color: K.text, lineHeight: 1.1, marginBottom: 8, paddingRight: 40,
      }}>
        {exercise.name}
      </h2>

      {/* Sets / reps */}
      <p style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: K.teal, marginBottom: 18 }}>
        {setsRepsLabel}
      </p>

      {/* Demo video — controls enabled (study view) */}
      {exercise.youtubeId ? (
        <div style={{
          position: 'relative', paddingTop: '56.25%',
          borderRadius: 12, overflow: 'hidden',
          border: `1px solid ${K.borderSt}`,
          backgroundColor: '#000', marginBottom: 22,
        }}>
          <iframe
            src={`https://www.youtube.com/embed/${exercise.youtubeId}?rel=0&modestbranding=1&playsinline=1`}
            title={exercise.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      ) : (
        <div style={{
          position: 'relative', paddingTop: '56.25%',
          borderRadius: 12, overflow: 'hidden',
          backgroundColor: K.inset, marginBottom: 22,
          border: `1px solid ${K.border}`,
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', border: `2px solid ${K.borderSt}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={K.dim} strokeWidth="1.5" strokeLinecap="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
            <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              Video guide coming soon
            </p>
          </div>
        </div>
      )}

      {/* TARGETS */}
      <p style={{
        fontFamily: MONO, fontSize: 9, fontWeight: 700,
        color: K.dim, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10,
      }}>Targets</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {exercise.targetMuscles.map(m => (
          <span key={m} style={{
            backgroundColor: K.inset, borderRadius: 99,
            padding: '4px 10px', fontSize: 12, color: K.muted,
            border: `1px solid ${K.border}`,
          }}>{m}</span>
        ))}
        {exercise.equipment.map(eq => (
          <span key={eq} style={{
            backgroundColor: 'rgba(45,212,191,0.08)', borderRadius: 99,
            padding: '4px 10px', fontSize: 12, color: K.teal,
            border: '1px solid rgba(45,212,191,0.18)',
          }}>{eq.replace(/-/g, ' ')}</span>
        ))}
      </div>
    </div>
  )

  // ── Right column: instructions, cues, modification ────────────────────────
  const RightCol = (
    <div style={{
      flex: 1,
      overflowY: isWide ? 'auto' : 'visible',
      padding: isWide ? '28px 28px 28px 24px' : '20px 20px 40px',
    }}>
      {/* HOW TO DO IT */}
      <p style={{
        fontFamily: MONO, fontSize: 9, fontWeight: 700,
        color: K.dim, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16,
      }}>How to do it</p>
      <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 28px' }}>
        {exercise.instructions.map((step, i) => (
          <li key={i} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
            <span style={{
              flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
              background: K.grad,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: MONO, fontWeight: 700, fontSize: 11, color: '#fff', marginTop: 1,
            }}>{i + 1}</span>
            <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>{step}</p>
          </li>
        ))}
      </ol>

      {/* COACHING CUES */}
      <p style={{
        fontFamily: MONO, fontSize: 9, fontWeight: 700,
        color: K.dim, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12,
      }}>Coaching cues</p>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
        {exercise.cues.map((cue, i) => (
          <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
            <Icon name="check" size={15} strokeWidth={2.5} style={{ color: K.violet, flexShrink: 0, marginTop: 3 }} />
            <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>{cue}</p>
          </li>
        ))}
      </ul>

      {/* EASIER MODIFICATION */}
      {exercise.modification && (
        <div style={{
          backgroundColor: 'rgba(245,158,11,0.07)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 14, padding: 16,
        }}>
          <p style={{
            fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.amber,
            letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8,
          }}>Easier modification</p>
          <p style={{ fontSize: 14, color: 'rgba(253,230,138,0.85)', lineHeight: 1.6, margin: 0 }}>
            {exercise.modification}
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isWide ? 20 : 0,
        backgroundColor: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        width: '100%', maxWidth: isWide ? 960 : '100%',
        height: isWide ? 'auto' : '100%',
        maxHeight: isWide ? '88vh' : '100%',
        backgroundColor: K.card,
        borderRadius: isWide ? 26 : 0,
        border: `1px solid ${K.borderSt}`,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'kModalIn 320ms ease-out',
        position: 'relative',
      }}>
        {/* X close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 10,
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: K.inset, border: `1px solid ${K.border}`,
            color: K.subtle, fontSize: 16, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Close"
        >✕</button>

        {/* Layout */}
        {isWide ? (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {LeftCol}
            <div style={{ width: 1, backgroundColor: K.border, flexShrink: 0 }} />
            {RightCol}
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {LeftCol}
            <div style={{ height: 1, backgroundColor: K.border, margin: '0 20px' }} />
            {RightCol}
          </div>
        )}
      </div>
      <style>{`@keyframes kModalIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  )
}
