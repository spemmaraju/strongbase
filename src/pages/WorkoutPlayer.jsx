import { useState, useEffect, useRef } from 'react'
import { computeBadges } from '../hooks/useBadges'
import { useParams, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { supabase } from '../lib/supabase'
import { C } from '../styles/tokens'
import useWorkoutPlayer from '../hooks/useWorkoutPlayer'
import useStreak from '../hooks/useStreak'
import useWorkoutLogs from '../hooks/useWorkoutLogs'
import useAuth from '../hooks/useAuth'
import useWakeLock from '../hooks/useWakeLock'
import useMediaQuery from '../hooks/useMediaQuery'
import { useSound } from '../hooks/useSound'
import CircularTimer from '../components/CircularTimer'
import ExerciseModal from '../components/ExerciseModal'
import { Icon } from '../components/Icons'
import quotesData from '../data/quotes.json'
import { randomQuote } from '../utils/workoutStats'
import { getLastReps, compareToLastSession } from '../utils/perfHistory'

// ── Kinetic design constants ──────────────────────────────────────────────────
const K = {
  bg:       '#0a0e1a',
  card:     '#101828',
  inset:    '#16233a',
  border:   'rgba(255,255,255,0.06)',
  borderSt: 'rgba(255,255,255,0.10)',
  pink:     '#ec4899',
  purple:   '#8b5cf6',
  violet:   '#c084fc',
  grad:     'linear-gradient(90deg, #ec4899, #8b5cf6)',
  gradD:    'linear-gradient(135deg, #ec4899, #8b5cf6)',
  hero:     'linear-gradient(130deg, #fb923c 0%, #ec4899 48%, #8b5cf6 100%)',
  amber:    '#f59e0b',
  teal:     '#2dd4bf',
  green:    '#22c55e',
  text:     '#f8fafc',
  muted:    '#94a3b8',
  subtle:   '#64748b',
  dim:      '#475569',
}

const FONT  = "'Plus Jakarta Sans', sans-serif"
const MONO  = "'JetBrains Mono', 'Courier New', monospace"

// Category → color mapping for Kinetic
const CAT_COLOR = {
  'warm-up':    K.amber,
  strength:     K.pink,
  stability:    K.purple,
  flexibility:  K.teal,
  cardio:       '#3b82f6',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Animation keyframes (injected once) ──────────────────────────────────────
const ANIM_STYLES = `
@keyframes slideInRight { from { transform: translateX(32px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes scaleIn      { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes bouncePop    { 0%{transform:scale(0)} 60%{transform:scale(1.22)} 100%{transform:scale(1)} }
@keyframes greenFlash   { 0%{opacity:1} 100%{opacity:0} }
@keyframes xpPop        { 0%{transform:scale(1) translateY(0);opacity:1} 60%{transform:scale(1.5) translateY(-10px);opacity:1} 100%{transform:scale(1) translateY(-14px);opacity:0} }
@keyframes glowPulse    { 0%,100%{box-shadow:0 16px 30px -10px rgba(236,72,153,.65)} 50%{box-shadow:0 20px 50px -8px rgba(236,72,153,.9)} }
@keyframes flamePulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
@keyframes dotPulse     { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }
@keyframes formDemoPulse{ 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes spin         { to { transform: rotate(360deg); } }
`

// ── VideoPane — left pane with autoplay muted loop + FORM DEMO badge ─────────
function VideoPane({ youtubeId, title }) {
  if (!youtubeId) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px 12px 20px 24px',
    }}>
      <div style={{
        width: '100%', position: 'relative', paddingTop: '56.25%',
        borderRadius: 18, overflow: 'hidden',
        border: `1px solid ${K.borderSt}`,
        backgroundColor: '#000',
        boxShadow: '0 40px 80px -24px rgba(0,0,0,.6)',
      }}>
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&rel=0&modestbranding=1&playsinline=1`}
          title={title || 'Exercise demo'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        />
        {/* FORM DEMO badge */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          display: 'flex', alignItems: 'center', gap: 6,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)',
          borderRadius: 6, padding: '4px 10px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            backgroundColor: K.pink,
            animation: 'formDemoPulse 2s ease-in-out infinite',
          }} />
          <span style={{
            fontFamily: MONO, fontSize: 9, fontWeight: 700,
            letterSpacing: '0.14em', color: K.text, textTransform: 'uppercase',
          }}>Form Demo</span>
        </div>
      </div>
    </div>
  )
}

// ── ProgressSegments — one slim bar per exercise ──────────────────────────────
function ProgressSegments({ exercises, exerciseIndex, completedIds, phase }) {
  return (
    <div style={{ display: 'flex', gap: 2, height: 3, backgroundColor: 'transparent', flexShrink: 0 }}>
      {exercises.map((ex, i) => {
        const isPast = i < exerciseIndex || completedIds.includes(ex.id)
        const isCurrent = i === exerciseIndex
        let bg = '#1e293b'
        if (isPast) bg = K.purple
        else if (isCurrent) bg = phase === 'rest' ? 'rgba(139,92,246,0.5)' : K.pink
        return (
          <div key={ex.id + i} style={{
            flex: 1, height: '100%', backgroundColor: bg,
            borderRadius: 2, transition: 'background-color 0.3s ease',
          }} />
        )
      })}
    </div>
  )
}

// ── TopBar (Kinetic) ──────────────────────────────────────────────────────────
function TopBar({ day, exerciseIndex, totalExercises, xpEarned, xpPop, onExit, audioMode, onCycleAudio }) {
  const mode = localStorage.getItem('strongbase_workout_mode') || 'home'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px',
      backgroundColor: K.bg,
      borderBottom: `1px solid ${K.border}`,
      flexShrink: 0,
    }}>
      {/* X close button */}
      <button
        onClick={onExit}
        style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          backgroundColor: K.inset, border: `1px solid ${K.border}`,
          color: K.subtle, fontSize: 16, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Exit workout"
      >✕</button>

      {/* Center labels */}
      <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
        <p style={{
          fontFamily: MONO, fontSize: 10, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: K.violet, lineHeight: 1.2, margin: 0,
        }}>
          {day.theme} · {mode === 'gym' ? 'GYM' : 'HOME'}
        </p>
        <p style={{
          fontFamily: MONO, fontSize: 10, fontWeight: 500,
          color: K.subtle, margin: 0, marginTop: 1,
        }}>
          Exercise {exerciseIndex + 1} of {totalExercises}
        </p>
      </div>

      {/* XP pill with pop animation */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          backgroundColor: 'rgba(139,92,246,0.15)',
          borderRadius: 99, padding: '5px 10px',
          border: '1px solid rgba(139,92,246,0.3)',
        }}>
          <Icon name="xp" size={13} style={{ color: K.violet }} />
          <span style={{
            fontFamily: MONO, fontSize: 12, fontWeight: 700, color: K.violet,
            fontVariantNumeric: 'tabular-nums',
          }}>{xpEarned} XP</span>
        </div>
        {xpPop && (
          <div style={{
            position: 'absolute', top: -4, right: 0,
            fontFamily: MONO, fontSize: 11, fontWeight: 700, color: K.pink,
            animation: 'xpPop 700ms ease-out forwards',
            pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>+{xpPop} XP</div>
        )}
      </div>

      {/* Audio toggle */}
      <button
        onClick={onCycleAudio}
        style={{
          minHeight: 36, paddingLeft: 10, paddingRight: 10,
          backgroundColor: K.inset, borderRadius: 10, flexShrink: 0,
          border: `1px solid ${audioMode === 'voice' ? 'rgba(236,72,153,0.4)' : K.border}`,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}
        aria-label={`Audio: ${audioMode}. Tap to cycle.`}
      >
        {audioMode === 'mute' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={K.subtle} strokeWidth="2" strokeLinecap="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={audioMode === 'voice' ? K.pink : K.muted} strokeWidth="2" strokeLinecap="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
          </svg>
        )}
        {audioMode === 'voice' && (
          <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.pink, letterSpacing: '0.1em' }}>
            VOICE
          </span>
        )}
      </button>
    </div>
  )
}

// ── ReadyScreen ───────────────────────────────────────────────────────────────
function ReadyScreen({ day, onStart }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100svh',
      padding: '32px 24px', textAlign: 'center',
      backgroundColor: K.bg,
    }}>
      {/* Day identity chip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24,
        backgroundColor: 'rgba(139,92,246,0.12)', borderRadius: 99,
        padding: '6px 16px', border: `1px solid rgba(139,92,246,0.25)`,
      }}>
        <Icon name="target" size={14} style={{ color: K.violet }} />
        <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.violet, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Day {day.day} of 7
        </span>
      </div>

      <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 42, color: K.text, lineHeight: 1.05, marginBottom: 12 }}>
        {day.theme}
      </h1>
      <p style={{ fontSize: 15, color: K.muted, maxWidth: 320, lineHeight: 1.5, marginBottom: 36 }}>
        {day.focusArea}
      </p>

      <button
        onClick={onStart}
        style={{
          width: '100%', maxWidth: 340, minHeight: 60,
          background: K.grad, border: 'none', borderRadius: 16,
          fontFamily: FONT, fontWeight: 800, fontSize: 17, color: '#fff',
          cursor: 'pointer', animation: 'glowPulse 2.6s ease-in-out infinite',
        }}
      >
        Let's go →
      </button>
    </div>
  )
}

// ── TransitionCard ────────────────────────────────────────────────────────────
function TransitionCard({ exercise }) {
  if (!exercise) return null
  const [quote] = useState(() => randomQuote(quotesData, 'during'))
  const catColor = CAT_COLOR[exercise.category] || K.purple

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100svh',
      padding: 24, textAlign: 'center', backgroundColor: K.bg,
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        backgroundColor: `${catColor}18`, borderRadius: 99,
        padding: '6px 16px', marginBottom: 28, border: `1px solid ${catColor}30`,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: catColor }} />
        <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: catColor, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Get Ready
        </span>
      </div>

      <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 34, color: K.text, lineHeight: 1.1, marginBottom: 10 }}>
        {exercise.name}
      </h2>
      <p style={{ fontSize: 14, color: K.subtle, marginBottom: 28 }}>
        {exercise.targetMuscles.join(' · ')}
      </p>

      {quote && (
        <p style={{ fontSize: 13, color: K.muted, fontStyle: 'italic', maxWidth: 280, lineHeight: 1.6 }}>
          "{quote.text}"
          {quote.author !== 'StrongBase' && (
            <span style={{ color: K.subtle }}> — {quote.author}</span>
          )}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%', backgroundColor: K.pink,
            animation: `dotPulse 1.2s ease-in-out ${i * 0.22}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

// ── Coaching cues panel ───────────────────────────────────────────────────────
function CuesPanel({ cues }) {
  if (!cues || cues.length === 0) return null
  return (
    <div style={{
      width: '100%', maxWidth: 380,
      backgroundColor: 'rgba(139,92,246,0.07)',
      borderRadius: 12, padding: '12px 16px',
      borderLeft: `3px solid ${K.purple}`,
      textAlign: 'left',
    }}>
      {cues.map((cue, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginTop: i > 0 ? 8 : 0, alignItems: 'flex-start' }}>
          <span style={{
            fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.violet,
            flexShrink: 0, marginTop: 2, minWidth: 14,
          }}>{i + 1}</span>
          <p style={{ fontSize: 12, color: K.muted, lineHeight: 1.5, margin: 0 }}>{cue}</p>
        </div>
      ))}
    </div>
  )
}

// ── ExerciseScreen ────────────────────────────────────────────────────────────
function ExerciseScreen({ workout, xpEarned, xpPop, onOpenModal, onBack, onSkipToRest, onCompleteSet, onPause, onResume }) {
  const {
    currentExercise: ex,
    dayExercises,
    exerciseIndex,
    currentSet,
    completedExerciseIds,
    secondsRemaining,
    totalSeconds,
    isPaused,
  } = workout

  const [actualReps, setActualReps] = useState(() => ex?.reps ?? 0)
  const isWide = useMediaQuery('(min-width: 768px)')
  if (!ex) return null

  const isTimed      = !!ex.durationSeconds
  const catColor     = CAT_COLOR[ex.category] || K.purple
  const canGoBack    = !(exerciseIndex === 0 && currentSet === 1)
  const showVideo    = isWide && !!ex.youtubeId
  const todayStr     = new Date().toISOString().slice(0, 10)
  const lastTime     = !isTimed ? getLastReps(ex.id, currentSet, todayStr) : null
  const atTarget     = actualReps >= (ex.reps ?? 0)
  const ringColor    = isTimed
    ? (isPaused ? K.subtle : K.teal)
    : (atTarget ? K.pink : K.amber)

  // Controls column — used in both wide and narrow layouts
  const ControlsCol = (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center',
      padding: isWide ? '24px 32px' : '24px 20px 140px',
      flex: 1, gap: 0, position: 'relative',
    }}>
      {/* ⓘ info button */}
      <button
        onClick={() => onOpenModal(ex)}
        style={{
          position: 'absolute', top: 12, right: isWide ? 20 : 16,
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: 'rgba(139,92,246,0.15)',
          border: `1px solid rgba(139,92,246,0.3)`,
          color: K.violet, fontSize: 18, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label="Exercise info"
      >ⓘ</button>

      {/* SET label */}
      <p style={{
        fontFamily: MONO, fontSize: 11, fontWeight: 700,
        color: K.violet, letterSpacing: '0.14em', textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        Set {currentSet} of {ex.sets}
      </p>

      {/* Last time hint */}
      {lastTime ? (
        <p style={{ fontSize: 13, fontWeight: 600, color: K.teal, marginBottom: 8 }}>
          Last time: {lastTime.reps} reps
        </p>
      ) : (
        <div style={{ marginBottom: 8, height: 20 }} />
      )}

      {/* Exercise name */}
      <h2
        key={exerciseIndex}
        style={{
          fontFamily: FONT, fontWeight: 800,
          fontSize: isWide ? 38 : 28,
          color: K.text, lineHeight: 1.1,
          marginBottom: 6,
          animation: 'slideInRight 300ms ease-out',
          maxWidth: isWide ? 400 : 300,
        }}
      >{ex.name}</h2>

      {/* Target muscles */}
      <p style={{ fontSize: 13, color: K.subtle, marginBottom: 24 }}>
        {ex.targetMuscles.join(' · ')}
      </p>

      {/* Timer or rep counter */}
      {isTimed ? (
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <CircularTimer
            secondsRemaining={secondsRemaining}
            totalSeconds={totalSeconds}
            ringColor={ringColor}
            size={isWide ? 240 : 200}
          />
          {isPaused && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: K.subtle, letterSpacing: '0.1em' }}>
                PAUSED
              </p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          {/* − button */}
          <button
            onClick={() => setActualReps(r => Math.max(0, r - 1))}
            style={{
              width: 48, height: 48, borderRadius: 24, flexShrink: 0,
              backgroundColor: K.inset, border: `1px solid ${K.borderSt}`,
              color: K.muted, fontSize: 22, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >−</button>

          {/* Tap circle */}
          <button
            onClick={() => onCompleteSet(actualReps)}
            style={{
              width: isWide ? 200 : 170, height: isWide ? 200 : 170,
              borderRadius: '50%',
              border: `7px solid ${atTarget ? K.pink : K.amber}`,
              backgroundColor: atTarget ? 'rgba(236,72,153,0.08)' : 'rgba(245,158,11,0.06)',
              transition: 'border-color 0.2s, background-color 0.2s',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Finish this set"
          >
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: FONT, fontWeight: 800,
                fontSize: isWide ? 84 : 68,
                color: K.text, lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>{actualReps}</p>
              <p style={{
                fontFamily: MONO, fontSize: 11, fontWeight: 700,
                color: atTarget ? K.violet : K.amber,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                marginTop: 2,
              }}>
                {atTarget ? 'reps' : `of ${ex.reps}`}
              </p>
            </div>
          </button>

          {/* + button */}
          <button
            onClick={() => setActualReps(r => r + 1)}
            style={{
              width: 48, height: 48, borderRadius: 24, flexShrink: 0,
              backgroundColor: K.inset, border: `1px solid ${K.borderSt}`,
              color: K.muted, fontSize: 22, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >+</button>
        </div>
      )}

      {/* Coaching cues */}
      <CuesPanel cues={ex.cues} />

      {/* CTA button (inside pane on wide; footer handles narrow) */}
      {isWide && (
        <div style={{ width: '100%', maxWidth: 380, marginTop: 20 }}>
          {isTimed ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={isPaused ? onResume : onPause}
                style={{
                  flex: 1, height: 52, borderRadius: 14,
                  background: isPaused ? K.grad : K.inset,
                  border: isPaused ? 'none' : `1px solid ${K.borderSt}`,
                  color: isPaused ? '#fff' : K.muted,
                  fontFamily: FONT, fontWeight: 700, fontSize: 15,
                  cursor: 'pointer',
                }}
              >{isPaused ? 'Resume' : 'Pause'}</button>
              <button
                onClick={onSkipToRest}
                style={{
                  width: 80, height: 52, borderRadius: 14,
                  backgroundColor: 'transparent', border: `1px solid ${K.borderSt}`,
                  color: K.subtle, fontFamily: FONT, fontWeight: 600, fontSize: 13,
                  cursor: 'pointer',
                }}
              >Skip</button>
            </div>
          ) : (
            <button
              onClick={() => onCompleteSet(actualReps)}
              style={{
                width: '100%', height: 56, borderRadius: 14,
                background: K.grad, border: 'none',
                fontFamily: FONT, fontWeight: 700, fontSize: 15, color: '#fff',
                cursor: 'pointer', animation: 'glowPulse 2.6s ease-in-out infinite',
              }}
            >
              Complete set · +25 XP
            </button>
          )}
          {canGoBack && (
            <button
              onClick={onBack}
              style={{
                width: '100%', height: 36, background: 'none', border: 'none',
                color: K.dim, fontFamily: FONT, fontWeight: 500, fontSize: 13,
                cursor: 'pointer', marginTop: 8,
              }}
            >← Previous</button>
          )}
        </div>
      )}
    </div>
  )

  // ── Wide (iPad): grid — video left | controls right ──────────────────────
  if (isWide) {
    return (
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr',
        minHeight: 'calc(100svh - 56px)',
      }}>
        {showVideo
          ? <VideoPane youtubeId={ex.youtubeId} title={ex.name} />
          : <div />
        }
        {ControlsCol}
      </div>
    )
  }

  // ── Narrow: single column with fixed footer ──────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {ControlsCol}

      {/* Fixed footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20 }}>
        <div style={{ height: 28, background: `linear-gradient(to bottom, transparent, ${K.bg})`, pointerEvents: 'none' }} />
        <div style={{ backgroundColor: K.bg, padding: '0 16px', paddingBottom: 'max(env(safe-area-inset-bottom), 20px)', paddingTop: 4 }}>
          {isTimed ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={isPaused ? onResume : onPause}
                style={{
                  flex: 1, height: 56, borderRadius: 14,
                  background: isPaused ? K.grad : K.inset,
                  border: isPaused ? 'none' : `1px solid ${K.borderSt}`,
                  color: isPaused ? '#fff' : K.muted,
                  fontFamily: FONT, fontWeight: 700, fontSize: 15,
                  cursor: 'pointer',
                }}
              >{isPaused ? 'Resume' : 'Pause'}</button>
              <button
                onClick={onSkipToRest}
                style={{
                  width: 80, height: 56, borderRadius: 14,
                  backgroundColor: 'transparent', border: `1px solid ${K.borderSt}`,
                  color: K.subtle, fontFamily: FONT, fontWeight: 600, fontSize: 13,
                  cursor: 'pointer',
                }}
              >Skip</button>
            </div>
          ) : (
            <button
              onClick={() => onCompleteSet(actualReps)}
              style={{
                width: '100%', height: 60, borderRadius: 14,
                background: K.grad, border: 'none',
                fontFamily: FONT, fontWeight: 700, fontSize: 16, color: '#fff',
                cursor: 'pointer',
              }}
            >
              Complete set · +25 XP
            </button>
          )}
          {canGoBack && (
            <button
              onClick={onBack}
              style={{
                width: '100%', height: 36, background: 'none', border: 'none',
                color: K.dim, fontFamily: FONT, fontWeight: 500, fontSize: 13,
                cursor: 'pointer', marginTop: 6,
              }}
            >← Previous</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── RestScreen ────────────────────────────────────────────────────────────────
function RestScreen({ workout }) {
  const {
    isBetweenExercises, nextExercise, currentExercise,
    secondsRemaining, totalSeconds, skipRest, adjustRest,
  } = workout

  const isWide   = useMediaQuery('(min-width: 768px)')
  const videoEx  = isBetweenExercises ? nextExercise : currentExercise
  const showVideo = isWide && !!videoEx?.youtubeId
  const heading  = isBetweenExercises ? 'Up Next' : 'Rest · Same exercise'

  const RestContent = (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', flex: 1,
      padding: isWide ? '24px 40px' : '24px 20px 120px',
    }}>
      {/* Heading chip — always amber */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        backgroundColor: 'rgba(245,158,11,0.12)',
        borderRadius: 99, padding: '5px 14px', marginBottom: 16,
        border: '1px solid rgba(245,158,11,0.25)',
      }}>
        <span style={{
          fontFamily: MONO, fontSize: 10, fontWeight: 700,
          color: K.amber,
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>{heading}</span>
      </div>

      {isBetweenExercises && nextExercise && (
        <>
          <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: K.text, marginBottom: 4, lineHeight: 1.1 }}>
            {nextExercise.name}
          </p>
          <p style={{ fontSize: 13, color: K.subtle, marginBottom: 20 }}>
            {nextExercise.targetMuscles.join(' · ')}
          </p>
        </>
      )}

      <div style={{ animation: 'scaleIn 200ms ease-out' }}>
        <CircularTimer
          secondsRemaining={secondsRemaining}
          totalSeconds={totalSeconds}
          ringColor={K.subtle}
          size={isWide ? 240 : 200}
        />
      </div>

      {/* Adjust rest buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button
          onClick={() => adjustRest(-15)}
          style={{
            height: 36, paddingLeft: 18, paddingRight: 18,
            backgroundColor: 'transparent', border: `1px solid ${K.borderSt}`,
            borderRadius: 99, color: K.subtle,
            fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
            cursor: 'pointer',
          }}
        >−15s</button>
        <button
          onClick={() => adjustRest(30)}
          style={{
            height: 36, paddingLeft: 18, paddingRight: 18,
            backgroundColor: K.inset, border: `1px solid ${K.borderSt}`,
            borderRadius: 99, color: K.muted,
            fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
            cursor: 'pointer',
          }}
        >+30s</button>
      </div>

      {/* Skip button (inline for wide) */}
      {isWide && (
        <button
          onClick={skipRest}
          style={{
            marginTop: 20, width: '100%', maxWidth: 340, height: 52,
            backgroundColor: 'transparent', border: `1px solid ${K.borderSt}`,
            borderRadius: 14, color: K.teal,
            fontFamily: FONT, fontWeight: 600, fontSize: 15,
            cursor: 'pointer',
          }}
        >Skip Rest →</button>
      )}
    </div>
  )

  if (isWide) {
    return (
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr',
        minHeight: 'calc(100svh - 56px)',
      }}>
        {showVideo
          ? <VideoPane youtubeId={videoEx.youtubeId} title={videoEx.name} />
          : <div />
        }
        {RestContent}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {RestContent}
      {/* Fixed footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20 }}>
        <div style={{ height: 28, background: `linear-gradient(to bottom, transparent, ${K.bg})`, pointerEvents: 'none' }} />
        <div style={{ backgroundColor: K.bg, padding: '0 16px', paddingBottom: 'max(env(safe-area-inset-bottom), 20px)', paddingTop: 4 }}>
          <button
            onClick={skipRest}
            style={{
              width: '100%', height: 56, borderRadius: 14,
              backgroundColor: 'transparent', border: `1px solid ${K.borderSt}`,
              color: K.teal, fontFamily: FONT, fontWeight: 600, fontSize: 15,
              cursor: 'pointer',
            }}
          >Skip Rest →</button>
        </div>
      </div>
    </div>
  )
}

// ── SavingScreen ──────────────────────────────────────────────────────────────
function SavingScreen() {
  return (
    <div style={{
      minHeight: '100svh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      backgroundColor: K.bg,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        border: '4px solid rgba(255,255,255,0.07)',
        borderTopColor: K.pink,
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, color: K.text }}>Saving your workout…</p>
      <p style={{ fontSize: 13, color: K.subtle }}>Just a moment</p>
    </div>
  )
}

// ── CompletionScreen ──────────────────────────────────────────────────────────
function CompletionScreen({ workout, navigate, logs, prevLogs, xpEarned }) {
  const { day, completedExerciseIds, totalSetsCompleted, elapsedSeconds, logSaveStatus, setPerformance } = workout
  const isWeekComplete = day.day === 7

  const [quote] = useState(() => randomQuote(quotesData, 'complete'))
  const { currentStreak, totalWorkouts } = useStreak(logs)

  const [progress] = useState(() => {
    const today = new Date().toISOString().slice(0, 10)
    return compareToLastSession(setPerformance || [], today)
      .filter(p => p.delta !== 0)
      .sort((a, b) => b.delta - a.delta)
  })

  const [rpe, setRpe] = useState(null)
  function handleRpe(value) {
    setRpe(value)
    try {
      const today = new Date().toISOString().slice(0, 10)
      localStorage.setItem(`strongbase_rpe_${today}_d${day.day}`, String(value))
    } catch {}
  }

  const [restarting, setRestarting] = useState(false)
  async function handleRestartWeek() {
    setRestarting(true)
    const today = new Date().toISOString().slice(0, 10)
    try { await supabase.auth.updateUser({ data: { programStartDate: today } }) } catch {}
    setRestarting(false)
    navigate('/', { replace: true })
  }

  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [newBadges, setNewBadges] = useState([])
  const [badgeIdx, setBadgeIdx] = useState(0)
  const [showBadgeModal, setShowBadgeModal] = useState(false)

  useEffect(() => {
    confetti({
      particleCount: 140, spread: 80, origin: { y: 0.3 },
      colors: [K.pink, K.purple, K.amber, '#fff'],
    })
  }, [])

  const badgeDiffFiredRef = useRef(false)
  useEffect(() => {
    if (badgeDiffFiredRef.current || logs.length < 1) return
    const prev = prevLogs ?? []
    const prevBadges = computeBadges(prev)
    const currBadges = computeBadges(logs)
    const earned = currBadges.filter(b => b.earned && !prevBadges.find(p => p.id === b.id)?.earned)
    if (earned.length > 0) {
      badgeDiffFiredRef.current = true
      setNewBadges(earned)
      setTimeout(() => setShowBadgeModal(true), 2200)
    } else if (logs.length > prev.length) {
      badgeDiffFiredRef.current = true
    }
  }, [logs]) // eslint-disable-line react-hooks/exhaustive-deps

  function dismissBadge() {
    if (badgeIdx < newBadges.length - 1) setBadgeIdx(i => i + 1)
    else setShowBadgeModal(false)
  }

  useEffect(() => {
    let toastText
    if (logSaveStatus === 'done') toastText = '✓ Saved!'
    else if (logSaveStatus === 'error') toastText = '⚠ Saved offline — will sync later'
    else if (totalWorkouts <= 1) toastText = 'First workout complete!'
    else if (currentStreak === 7) toastText = 'Full week crushed!'
    else if (currentStreak >= 1) toastText = `${currentStreak} day streak!`
    else toastText = 'Great workout!'
    setToastMsg(toastText)
    const t1 = setTimeout(() => setShowToast(true), 1000)
    const t2 = setTimeout(() => setShowToast(false), 4000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const statCards = [
    { label: 'TIME', value: formatTime(elapsedSeconds) },
    { label: 'EXERCISES', value: completedExerciseIds.length },
    { label: 'SETS', value: totalSetsCompleted },
    { label: 'STREAK', value: `${currentStreak}d`, amber: true },
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', minHeight: '100svh',
      padding: '48px 20px 60px', textAlign: 'center',
      backgroundColor: K.bg,
      backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 70%)',
    }}>

      {/* Toast */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '14px 20px',
        background: K.grad,
        color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 16, textAlign: 'center',
        transform: showToast ? 'translateY(0)' : 'translateY(-110%)',
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>{toastMsg}</div>

      {/* Medallion */}
      {isWeekComplete ? (
        <>
          <div style={{
            width: 92, height: 92, borderRadius: '50%',
            background: K.hero,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'bouncePop 500ms ease-out', marginBottom: 18,
            boxShadow: `0 0 40px rgba(236,72,153,0.4)`,
          }}>
            <Icon name="trophy" size={44} style={{ color: '#fff' }} />
          </div>
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: K.text, marginBottom: 8 }}>
            Week 1 Complete!
          </h1>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 17, color: K.amber, marginBottom: 6 }}>
            You finished the full 7-day program.
          </p>
          <p style={{ fontSize: 13, color: K.subtle, marginBottom: 0 }}>That's a real foundation. Build on it.</p>
        </>
      ) : (
        <>
          <div style={{
            width: 92, height: 92, borderRadius: '50%',
            background: K.gradD,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'bouncePop 500ms ease-out', marginBottom: 18,
            boxShadow: `0 0 40px rgba(236,72,153,0.4)`,
          }}>
            <Icon name="check" size={40} strokeWidth={2.5} style={{ color: '#fff' }} />
          </div>
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 36, color: K.text, marginBottom: 8 }}>
            Workout complete!
          </h1>
          <p style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: K.violet, letterSpacing: '0.08em', marginBottom: 0 }}>
            Day {day.day} — {day.theme} · +{xpEarned} XP earned
          </p>
        </>
      )}

      {/* Stat row — 4 cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: 8, width: '100%', maxWidth: 460, marginTop: 28,
      }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            backgroundColor: s.amber ? 'rgba(245,158,11,0.1)' : K.card,
            borderRadius: 14, padding: '14px 8px',
            border: `1px solid ${s.amber ? 'rgba(245,158,11,0.2)' : K.border}`,
          }}>
            <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: s.amber ? K.amber : K.text, lineHeight: 1 }}>
              {s.value}
            </p>
            <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: K.dim, marginTop: 5 }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* vs last session card */}
      {progress.length > 0 && (
        <div style={{
          backgroundColor: K.card, borderRadius: 16, padding: 16,
          width: '100%', maxWidth: 460, marginTop: 12, textAlign: 'left',
          border: `1px solid ${K.border}`,
        }}>
          <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: K.dim, marginBottom: 12 }}>
            vs last session
          </p>
          {progress.slice(0, 4).map((p, i) => (
            <div key={p.exerciseId} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: i > 0 ? 8 : 0,
            }}>
              <p style={{ fontSize: 13, color: K.muted, margin: 0 }}>
                {p.exerciseId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: p.delta > 0 ? K.green : K.amber, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                {p.prevTotal} → {p.total} {p.delta > 0 ? '▲' : '▼'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* RPE */}
      <div style={{
        backgroundColor: K.card, borderRadius: 16, padding: 16,
        width: '100%', maxWidth: 460, marginTop: 12, textAlign: 'left',
        border: `1px solid ${K.border}`,
      }}>
        <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: K.dim, marginBottom: 12 }}>
          {rpe ? 'Effort logged ✓' : 'How hard was that? (1–10)'}
        </p>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button
              key={n}
              onClick={() => handleRpe(n)}
              style={{
                flex: 1, minHeight: 36, borderRadius: 8, cursor: 'pointer',
                fontFamily: MONO, fontSize: 11, fontWeight: 700,
                backgroundColor: n <= (rpe ?? 0) ? 'rgba(139,92,246,0.2)' : K.inset,
                color: n <= (rpe ?? 0) ? K.violet : K.dim,
                border: `1px solid ${n === rpe ? K.purple : K.border}`,
                transition: 'all 0.15s',
              }}
            >{n}</button>
          ))}
        </div>
      </div>

      {/* Quote */}
      {quote && (
        <div style={{
          backgroundColor: K.card, borderRadius: 16, padding: 16,
          width: '100%', maxWidth: 460, marginTop: 12, textAlign: 'left',
          border: `1px solid ${K.border}`,
        }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: K.text, lineHeight: 1.6, fontStyle: 'italic' }}>
            "{quote.text}"
          </p>
          {quote.author !== 'StrongBase' && (
            <p style={{ fontSize: 12, color: K.subtle, marginTop: 6 }}>— {quote.author}</p>
          )}
        </div>
      )}

      {/* Buttons */}
      <div style={{ width: '100%', maxWidth: 460, marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isWeekComplete ? (
          <>
            <div style={{
              backgroundColor: K.card, borderRadius: 14, padding: '12px 16px',
              border: '1px solid rgba(245,158,11,0.2)',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="strength" size={20} style={{ color: K.amber }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: K.text, margin: 0 }}>Week 2 — Progressive Load</p>
                <p style={{ fontSize: 12, color: K.subtle, margin: 0, marginTop: 2 }}>Coming soon — same movements, +1 set</p>
              </div>
            </div>
            <button
              onClick={handleRestartWeek}
              disabled={restarting}
              style={{
                width: '100%', minHeight: 56, borderRadius: 14, border: 'none',
                backgroundColor: restarting ? K.inset : K.amber,
                color: restarting ? K.subtle : '#0F172A',
                fontFamily: FONT, fontWeight: 700, fontSize: 16, cursor: restarting ? 'default' : 'pointer',
              }}
            >{restarting ? 'Saving…' : 'Restart Week 1 →'}</button>
            <button
              onClick={() => navigate('/')}
              style={{
                width: '100%', minHeight: 52, borderRadius: 14,
                backgroundColor: K.inset, border: `1px solid ${K.borderSt}`,
                color: K.text, fontFamily: FONT, fontWeight: 600, fontSize: 15, cursor: 'pointer',
              }}
            >Back to Home</button>
          </>
        ) : (
          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%', minHeight: 56, borderRadius: 14, border: 'none',
              background: K.grad,
              fontFamily: FONT, fontWeight: 700, fontSize: 16, color: '#fff',
              cursor: 'pointer', animation: 'glowPulse 2.6s ease-in-out infinite',
            }}
          >Back to Home</button>
        )}
        <button
          onClick={() => navigate(`/day/${day.day}`)}
          style={{
            width: '100%', minHeight: 52, borderRadius: 14,
            backgroundColor: K.inset, border: `1px solid ${K.borderSt}`,
            color: K.muted, fontFamily: FONT, fontWeight: 600, fontSize: 15, cursor: 'pointer',
          }}
        >View Summary</button>
      </div>

      {/* Badge unlock modal */}
      {showBadgeModal && newBadges[badgeIdx] && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          backgroundColor: 'rgba(0,0,0,0.75)',
        }}>
          <div style={{
            width: '100%', maxWidth: 320, borderRadius: 22, padding: 28, textAlign: 'center',
            background: K.gradD, boxShadow: '0 0 50px rgba(236,72,153,0.4)',
            animation: 'bouncePop 400ms ease-out',
          }}>
            <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: 16 }}>
              Badge Unlocked
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, animation: 'bouncePop 500ms ease-out', color: '#fff' }}>
              <Icon name={newBadges[badgeIdx].iconName || 'badge'} size={64} strokeWidth={1.2} />
            </div>
            <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: '#fff', marginBottom: 6 }}>
              {newBadges[badgeIdx].name}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 24, lineHeight: 1.5 }}>
              {newBadges[badgeIdx].condition}
            </p>
            <button
              onClick={dismissBadge}
              style={{
                width: '100%', height: 48, borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff', fontFamily: FONT, fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}
            >{badgeIdx < newBadges.length - 1 ? 'Next →' : 'Awesome!'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ExitConfirmDialog ─────────────────────────────────────────────────────────
function ExitConfirmDialog({ onCancel, onExit }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      backgroundColor: 'rgba(0,0,0,0.7)',
    }}>
      <div style={{
        width: '100%', maxWidth: 400, borderRadius: 22, padding: 24,
        backgroundColor: K.card, border: `1px solid ${K.borderSt}`,
      }}>
        <h3 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: K.text, marginBottom: 8 }}>
          Exit workout?
        </h3>
        <p style={{ fontSize: 14, color: K.muted, marginBottom: 24 }}>
          Your progress will be lost and not saved.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onExit}
            style={{
              width: '100%', minHeight: 52, borderRadius: 12,
              backgroundColor: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5', fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}
          >Exit workout</button>
          <button
            onClick={onCancel}
            style={{
              width: '100%', minHeight: 52, borderRadius: 12,
              background: K.grad, border: 'none',
              color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}
          >Keep going</button>
        </div>
      </div>
    </div>
  )
}

// ── PreviousConfirmDialog ─────────────────────────────────────────────────────
function PreviousConfirmDialog({ exerciseName, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      backgroundColor: 'rgba(0,0,0,0.7)',
    }}>
      <div style={{
        width: '100%', maxWidth: 400, borderRadius: 22, padding: 24,
        backgroundColor: K.card, border: `1px solid ${K.borderSt}`,
      }}>
        <h3 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: K.text, marginBottom: 8 }}>
          Go back?
        </h3>
        <p style={{ fontSize: 14, color: K.muted, marginBottom: 24 }}>
          This will restart <span style={{ color: K.text, fontWeight: 600 }}>{exerciseName}</span> from Set 1.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onConfirm}
            style={{
              width: '100%', minHeight: 52, borderRadius: 12,
              backgroundColor: K.inset, border: `1px solid ${K.borderSt}`,
              color: K.text, fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}
          >Yes, go back</button>
          <button
            onClick={onCancel}
            style={{
              width: '100%', minHeight: 52, borderRadius: 12,
              background: K.grad, border: 'none',
              color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}
          >Keep going</button>
        </div>
      </div>
    </div>
  )
}

// ── Main WorkoutPlayer ────────────────────────────────────────────────────────
export default function WorkoutPlayer() {
  const { dayNumber } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const mode          = localStorage.getItem('strongbase_workout_mode') || 'home'
  const sessionLength = localStorage.getItem('strongbase_session_length') || 'full'
  const fitnessLevel  = user?.user_metadata?.fitnessLevel || 'intermediate'
  const userEquipment = user?.user_metadata?.equipment || ['bodyweight']

  const workout = useWorkoutPlayer(dayNumber, { mode, fitnessLevel, sessionLength, userEquipment })
  const { logs, refetch: refetchLogs } = useWorkoutLogs()
  const { playSound, speak, audioMode, cycleAudioMode } = useSound()

  useWakeLock(workout.phase !== 'idle' && workout.phase !== 'complete')

  const prevLogsRef = useRef(null)
  useEffect(() => {
    if (workout.phase === 'exercise' && prevLogsRef.current === null) {
      prevLogsRef.current = logs
    }
  }, [workout.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (workout.logSaveStatus === 'done') refetchLogs()
  }, [workout.logSaveStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── XP tracking ──────────────────────────────────────────────────────────
  const [xpEarned, setXpEarned] = useState(0)
  const [xpPop, setXpPop] = useState(null)

  // ── Overlay state ─────────────────────────────────────────────────────────
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showPrevConfirm, setShowPrevConfirm] = useState(false)
  const [flashComplete, setFlashComplete] = useState(false)

  // ── Sound effects ─────────────────────────────────────────────────────────
  const prevExIdxRef  = useRef(-1)
  const prevPhaseRef  = useRef('idle')
  const halfwayFiredRef = useRef(false)

  useEffect(() => {
    const { phase, exerciseIndex, currentSet, currentExercise, nextExercise, isBetweenExercises } = workout
    const prevPhase = prevPhaseRef.current

    if (phase === 'exercise' && exerciseIndex !== prevExIdxRef.current) {
      prevExIdxRef.current = exerciseIndex
      playSound('start')
      if (currentExercise) {
        const what = currentExercise.durationSeconds
          ? `${currentExercise.durationSeconds} seconds`
          : `${currentExercise.reps} reps`
        speak(`${currentExercise.name}. Set 1 of ${currentExercise.sets}. ${what}.`)
      }
    } else if (phase === 'exercise' && prevPhase !== 'exercise' && currentSet > 1 && currentExercise) {
      speak(`Set ${currentSet} of ${currentExercise.sets}. Go.`)
    }
    if (phase === 'rest' && prevPhase !== 'rest') {
      playSound('rest')
      if (isBetweenExercises && nextExercise) speak(`Rest. Next up: ${nextExercise.name}.`)
      else speak('Rest.')
    }
    if (phase === 'complete' && prevPhase !== 'complete') {
      playSound('complete')
      speak('Workout complete. Great work today.')
      navigator.vibrate?.([50, 30, 50, 30, 100])
    }
    if (phase === 'idle') halfwayFiredRef.current = false
    prevPhaseRef.current = phase
  }, [workout.phase, workout.exerciseIndex, workout.currentSet]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const { phase, secondsRemaining } = workout
    if ((phase === 'exercise' || phase === 'rest') && secondsRemaining > 0 && secondsRemaining <= 3) {
      playSound('tick')
      navigator.vibrate?.(10)
    }
  }, [workout.secondsRemaining]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const total = workout.dayExercises.length
    const done  = workout.completedExerciseIds.length
    if (total > 0 && done >= Math.ceil(total / 2) && !halfwayFiredRef.current && workout.phase !== 'idle') {
      halfwayFiredRef.current = true
      playSound('halfway')
    }
  }, [workout.completedExerciseIds.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Set completion ────────────────────────────────────────────────────────
  function handleCompleteSet(actualReps) {
    navigator.vibrate?.([10, 50, 10])
    setFlashComplete(true)
    setTimeout(() => setFlashComplete(false), 200)

    // XP gain: timed holds = 15, rep-based = 25
    const isTimed = !!workout.currentExercise?.durationSeconds
    const gain = isTimed ? 15 : 25
    setXpEarned(x => x + gain)
    setXpPop(gain)
    setTimeout(() => setXpPop(null), 750)

    if (actualReps !== undefined && workout.currentExercise && !isTimed) {
      workout.logSetPerformance(
        workout.currentExercise.id,
        workout.currentSet,
        workout.currentExercise.reps,
        actualReps,
      )
    }
    workout.completeSet()
  }

  const { day, phase, currentExercise, nextExercise } = workout

  if (!day) {
    return (
      <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: K.bg }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, color: K.text, marginBottom: 16 }}>Day not found.</p>
          <button
            onClick={() => navigate('/')}
            style={{ background: K.grad, border: 'none', borderRadius: 12, color: '#fff', padding: '12px 24px', fontFamily: FONT, fontWeight: 700, cursor: 'pointer' }}
          >Go Home</button>
        </div>
      </div>
    )
  }

  const handleOpenModal  = (ex) => { setSelectedExercise(ex); workout.pauseTimer() }
  const handleCloseModal = () => { setSelectedExercise(null); workout.resumeTimer() }
  const handleBack       = () => setShowPrevConfirm(true)
  const handleConfirmBack = () => { setShowPrevConfirm(false); workout.goBack() }
  const handleSkipToRest = () => workout.skipRest()

  const showTopBar = phase !== 'idle' && phase !== 'complete'

  return (
    <div style={{ minHeight: '100svh', backgroundColor: K.bg, display: 'flex', flexDirection: 'column' }}>
      <style>{ANIM_STYLES}</style>

      {/* Green flash on set complete */}
      {flashComplete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 40,
          backgroundColor: 'rgba(34,197,94,0.15)',
          animation: 'greenFlash 200ms ease-out forwards',
          pointerEvents: 'none',
        }} />
      )}

      {showTopBar && (
        <>
          <TopBar
            day={day}
            exerciseIndex={workout.exerciseIndex}
            totalExercises={workout.dayExercises.length}
            xpEarned={xpEarned}
            xpPop={xpPop}
            onExit={() => setShowExitConfirm(true)}
            audioMode={audioMode}
            onCycleAudio={cycleAudioMode}
          />
          <ProgressSegments
            exercises={workout.dayExercises}
            exerciseIndex={workout.exerciseIndex}
            completedIds={workout.completedExerciseIds}
            phase={phase}
          />
        </>
      )}

      {/* Phase screens */}
      {phase === 'idle' && <ReadyScreen day={day} onStart={workout.startWorkout} />}
      {phase === 'transition' && <TransitionCard exercise={nextExercise} />}
      {phase === 'exercise' && (
        <ExerciseScreen
          key={`${workout.exerciseIndex}-${workout.currentSet}`}
          workout={workout}
          xpEarned={xpEarned}
          xpPop={xpPop}
          onOpenModal={handleOpenModal}
          onBack={handleBack}
          onSkipToRest={handleSkipToRest}
          onCompleteSet={handleCompleteSet}
          onPause={workout.pauseWorkout}
          onResume={workout.resumeWorkout}
        />
      )}
      {phase === 'rest' && <RestScreen workout={workout} />}
      {phase === 'complete' && workout.logSaveStatus === 'saving' && <SavingScreen />}
      {phase === 'complete' && workout.logSaveStatus !== 'saving' && (
        <CompletionScreen
          workout={workout}
          navigate={navigate}
          logs={logs}
          prevLogs={prevLogsRef.current ?? []}
          xpEarned={xpEarned}
        />
      )}

      {/* Overlays */}
      {showExitConfirm && (
        <ExitConfirmDialog onCancel={() => setShowExitConfirm(false)} onExit={() => navigate('/')} />
      )}
      {showPrevConfirm && currentExercise && (
        <PreviousConfirmDialog
          exerciseName={currentExercise.name}
          onConfirm={handleConfirmBack}
          onCancel={() => setShowPrevConfirm(false)}
        />
      )}
      {selectedExercise && (
        <ExerciseModal exercise={selectedExercise} onClose={handleCloseModal} />
      )}
    </div>
  )
}
