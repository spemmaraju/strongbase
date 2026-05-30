import { useState, useEffect, useRef } from 'react'
import { computeBadges } from '../hooks/useBadges'
import { useParams, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import useWorkoutPlayer from '../hooks/useWorkoutPlayer'
import useStreak from '../hooks/useStreak'
import useWorkoutLogs from '../hooks/useWorkoutLogs'
import { useSound } from '../hooks/useSound'
import CircularTimer from '../components/CircularTimer'
import ExerciseModal from '../components/ExerciseModal'
import quotesData from '../data/quotes.json'
import { randomQuote } from '../utils/workoutStats'

// ── Helpers ────────────────────────────────────────────────────────────────
function formatTime(seconds) {
  if (seconds < 60) return `${seconds} sec`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

const CATEGORY_EMOJI = {
  'warm-up': '🌡️',
  strength: '💪',
  stability: '🎯',
  flexibility: '🧘',
  cardio: '🏃',
}

// Shared CSS animation keyframes injected once at module level via a style tag in App
const ANIM_STYLES = `
@keyframes slideInRight { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes scaleIn      { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes bouncePop    { 0%{transform:scale(0)} 60%{transform:scale(1.22)} 100%{transform:scale(1)} }
@keyframes greenFlash   { 0%{opacity:1} 100%{opacity:0} }
`

// ── Sub-components ─────────────────────────────────────────────────────────

function TopBar({ day, onExit, soundEnabled, onToggleSound }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: '1px solid #1E293B', paddingLeft: 20, paddingRight: 20 }}
    >
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
          Day {day.day}
        </p>
        <p className="text-sm font-semibold text-white leading-tight truncate">{day.theme}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          className="flex items-center justify-center rounded-lg transition-all active:scale-90"
          style={{
            minHeight: 44, width: 44,
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            cursor: 'pointer',
          }}
          aria-label={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
        >
          {soundEnabled ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          )}
        </button>
        <button
          onClick={onExit}
          className="flex items-center gap-1 rounded-lg font-semibold text-sm transition-all active:scale-95"
          style={{
            minHeight: 44,
            paddingLeft: 12,
            paddingRight: 12,
            backgroundColor: '#1E293B',
            color: '#94A3B8',
            border: '1px solid #334155',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Exit
        </button>
      </div>
    </div>
  )
}

function ProgressBar({ completed, total }) {
  const pct = total > 0 ? (completed / total) * 100 : 0
  return (
    <div style={{ height: 6, backgroundColor: '#1E293B', width: '100%' }}>
      <div
        style={{
          height: '100%',
          backgroundColor: '#14B8A6',
          width: `${pct}%`,
          transition: 'width 0.4s ease',
          borderRadius: '0 3px 3px 0',
        }}
      />
    </div>
  )
}

function ReadyScreen({ day, onStart }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
      style={{ backgroundColor: '#0F172A' }}>
      <div className="text-6xl mb-6">{day.emoji}</div>
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#14B8A6' }}>
        Day {day.day}
      </p>
      <h1 className="text-3xl font-extrabold text-white mb-2">{day.theme}</h1>
      <p className="text-sm mb-1" style={{ color: '#94A3B8' }}>{day.focusArea}</p>
      <p className="text-sm mb-10" style={{ color: '#94A3B8' }}>⏱ {day.durationMinutes} min</p>
      <button
        onClick={onStart}
        className="w-full rounded-xl font-bold text-lg text-white transition-all active:scale-95"
        style={{
          backgroundColor: '#14B8A6',
          minHeight: 64,
          maxWidth: 360,
          border: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0D9488'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#14B8A6'}
      >
        Begin Workout
      </button>
    </div>
  )
}

function TransitionCard({ exercise }) {
  if (!exercise) return null
  const emoji = CATEGORY_EMOJI[exercise.category] || '💪'
  // New random "during" quote each time this card mounts
  const [quote] = useState(() => randomQuote(quotesData, 'during'))

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center"
      style={{ backgroundColor: '#0F172A' }}
    >
      <p
        className="text-xs font-bold uppercase tracking-widest mb-6 px-4 py-2 rounded-full"
        style={{ backgroundColor: '#14B8A620', color: '#14B8A6' }}
      >
        Get Ready
      </p>
      <div className="text-6xl mb-5">{emoji}</div>
      <h2 className="text-3xl font-extrabold text-white mb-3 leading-tight">
        {exercise.name}
      </h2>
      <p className="text-sm" style={{ color: '#94A3B8' }}>
        {exercise.targetMuscles.join(' · ')}
      </p>
      {/* Motivational quote */}
      {quote && (
        <p className="text-xs font-medium italic mt-6 px-4 leading-relaxed" style={{ color: '#94A3B8', maxWidth: 280 }}>
          "{quote.text}"
          {quote.author !== 'StrongBase' && (
            <span style={{ color: '#64748B' }}> — {quote.author}</span>
          )}
        </p>
      )}
      {/* Pulsing indicator */}
      <div className="mt-8 flex gap-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: '#14B8A6',
              opacity: 0.4 + i * 0.3,
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.4); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function ExerciseScreen({ workout, onOpenModal, onBack, onSkipToRest, onCompleteSet, onPause, onResume }) {
  const {
    currentExercise: ex,
    dayExercises,
    currentSet,
    completedExerciseIds,
    secondsRemaining,
    totalSeconds,
    isPaused,
  } = workout

  // Actual reps counter for rep-based exercises — initialised from target
  const [actualReps, setActualReps] = useState(() => ex?.reps ?? 0)

  if (!ex) return null
  const isTimed = !!ex.durationSeconds
  const setsLabel = `Set ${currentSet} of ${ex.sets}`
  const emoji = CATEGORY_EMOJI[ex.category] || '💪'
  const canGoBack = !(workout.exerciseIndex === 0 && currentSet === 1)

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#0F172A' }}>
      <ProgressBar completed={completedExerciseIds.length} total={dayExercises.length} />

      {/* Centered content block — everything in one vertically-centered container */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 text-center" style={{ position: 'relative', paddingBottom: 120 }}>

        {/* ⓘ button — absolute top-right so it doesn't affect centering */}
        <button
          onClick={() => onOpenModal(ex)}
          className="flex items-center justify-center transition-all active:scale-90"
          style={{
            position: 'absolute', top: 12, right: 20,
            width: 44, height: 44,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          aria-label="Exercise info"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </button>

        {/* Set label */}
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>
          {setsLabel}
        </p>

        {/* Exercise name — centered, large */}
        <h2
          key={workout.exerciseIndex}
          className="text-white leading-tight mb-2"
          style={{
            animation: 'slideInRight 300ms ease-out',
            fontSize: 30,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            maxWidth: 300,
          }}
        >{ex.name}</h2>

        {/* Target muscles */}
        <p className="text-sm mb-8" style={{ color: '#64748B' }}>
          {ex.targetMuscles.join(' · ')}
        </p>

        {/* Timer or rep display */}
        {isTimed ? (
          <>
            <div style={{ position: 'relative' }}>
              <CircularTimer
                secondsRemaining={secondsRemaining}
                totalSeconds={totalSeconds}
                ringColor={isPaused ? '#475569' : '#14B8A6'}
              />
              {isPaused && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em' }}>PAUSED</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Interactive rep counter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                onClick={() => setActualReps(r => Math.max(0, r - 1))}
                className="flex items-center justify-center rounded-full transition-all active:scale-90"
                style={{
                  width: 48, height: 48, flexShrink: 0,
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  color: '#94A3B8', fontSize: 24, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >−</button>

              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 180, height: 180,
                  border: `8px solid ${actualReps < ex.reps ? '#F59E0B' : '#14B8A6'}`,
                  backgroundColor: actualReps < ex.reps ? '#F59E0B08' : '#14B8A610',
                  transition: 'border-color 0.2s, background-color 0.2s',
                }}
              >
                <div className="text-center">
                  <p style={{ fontSize: 72, fontWeight: 800, color: '#F8FAFC', lineHeight: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {actualReps}
                  </p>
                  <p style={{ fontSize: 12, color: actualReps < ex.reps ? '#F59E0B' : '#94A3B8', fontWeight: 600, marginTop: 4 }}>
                    {actualReps < ex.reps ? `of ${ex.reps}` : 'reps'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActualReps(r => r + 1)}
                className="flex items-center justify-center rounded-full transition-all active:scale-90"
                style={{
                  width: 48, height: 48, flexShrink: 0,
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155',
                  color: '#94A3B8', fontSize: 24, fontWeight: 700,
                  cursor: 'pointer',
                }}
              >+</button>
            </div>
            <p className="mt-4 text-sm font-medium" style={{ color: '#64748B' }}>
              Adjust if needed, then tap Done
            </p>
          </>
        )}

        {/* Inline coaching cues — always visible, no tap needed */}
        {ex.cues && ex.cues.length > 0 && (
          <div style={{
            marginTop: 20,
            width: '100%',
            maxWidth: 340,
            backgroundColor: '#1E293B',
            borderRadius: 12,
            padding: '10px 14px',
            borderLeft: '3px solid #0D9488',
          }}>
            {ex.cues.map((cue, i) => (
              <p key={i} style={{
                fontSize: 12,
                color: '#64748B',
                lineHeight: 1.5,
                marginTop: i > 0 ? 6 : 0,
              }}>
                · {cue}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Fixed footer — Done / Skip button always fully visible */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
        }}
      >
        {/* Gradient fade — masks content scrolling under the footer */}
        <div style={{
          height: 32,
          background: 'linear-gradient(to bottom, transparent, #0F172A)',
          pointerEvents: 'none',
        }} />
        <div style={{
          backgroundColor: '#0F172A',
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 4,
          paddingBottom: 'env(safe-area-inset-bottom, 24px)',
        }}>
        {isTimed ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={isPaused ? onResume : onPause}
              className="flex-1 rounded-2xl font-bold text-base text-white transition-all active:scale-95"
              style={{
                height: 56,
                backgroundColor: isPaused ? '#14B8A6' : '#1E3A5F',
                border: isPaused ? 'none' : '1px solid #2563EB40',
                color: isPaused ? '#fff' : '#60A5FA',
                cursor: 'pointer',
              }}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={onSkipToRest}
              className="rounded-2xl font-semibold text-sm transition-all active:scale-95"
              style={{
                height: 56,
                width: 80,
                backgroundColor: 'transparent',
                border: '1px solid #334155',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              Skip
            </button>
          </div>
        ) : (
          <button
            onClick={() => onCompleteSet(actualReps)}
            className="w-full rounded-2xl font-bold text-lg text-white transition-all active:scale-95"
            style={{
              height: 64,
              backgroundColor: '#14B8A6',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0D9488'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#14B8A6'}
          >
            Done
          </button>
        )}

        {canGoBack && (
          <button
            onClick={onBack}
            className="w-full font-medium text-sm transition-all active:scale-95"
            style={{
              height: 40,
              background: 'none',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            ← Previous
          </button>
        )}
        </div>
      </div>
    </div>
  )
}

function RestScreen({ workout }) {
  const {
    isBetweenExercises,
    nextExercise,
    secondsRemaining,
    totalSeconds,
    skipRest,
    adjustRest,
  } = workout

  const heading = isBetweenExercises ? 'Next Up' : 'Rest'

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: '#0F172A' }}
    >
      {/* All content vertically centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 text-center" style={{ paddingBottom: 100 }}>
        <h2
          className="text-white mb-1 uppercase tracking-widest"
          style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#94A3B8' }}
        >{heading}</h2>
        {isBetweenExercises && nextExercise && (
          <p
            className="mb-1 leading-tight"
            style={{ fontSize: 26, fontWeight: 800, color: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {nextExercise.name}
          </p>
        )}
        {isBetweenExercises && nextExercise && (
          <p className="text-sm mb-6" style={{ color: '#64748B' }}>
            {nextExercise.targetMuscles.join(' · ')}
          </p>
        )}

        <div style={{ marginTop: isBetweenExercises ? 8 : 0, animation: 'scaleIn 200ms ease-out' }}>
          <CircularTimer
            secondsRemaining={secondsRemaining}
            totalSeconds={totalSeconds}
            ringColor="#64748B"
          />
        </div>

        {/* Rest time adjustment */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            onClick={() => adjustRest(-15)}
            style={{
              height: 36, paddingLeft: 16, paddingRight: 16,
              backgroundColor: 'transparent',
              border: '1px solid #334155',
              borderRadius: 99,
              color: '#64748B',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            −15s
          </button>
          <button
            onClick={() => adjustRest(30)}
            style={{
              height: 36, paddingLeft: 16, paddingRight: 16,
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              borderRadius: 99,
              color: '#94A3B8',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            +30s
          </button>
        </div>
      </div>

      {/* Fixed footer — same treatment as Done button */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
        }}
      >
        <div style={{
          height: 32,
          background: 'linear-gradient(to bottom, transparent, #0F172A)',
          pointerEvents: 'none',
        }} />
        <div style={{
          backgroundColor: '#0F172A',
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 4,
          paddingBottom: 'env(safe-area-inset-bottom, 24px)',
        }}>
          <button
            onClick={skipRest}
            style={{
              width: '100%', height: 56, backgroundColor: 'transparent',
              border: '1px solid #334155', borderRadius: 16,
              color: '#14B8A6', fontSize: 15, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Skip Rest →
          </button>
        </div>
      </div>
    </div>
  )
}

function SavingScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ backgroundColor: '#0F172A' }}
    >
      <div
        style={{
          width: 56, height: 56, borderRadius: '50%',
          border: '5px solid #334155',
          borderTopColor: '#14B8A6',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p className="text-lg font-bold text-white">Saving your workout…</p>
      <p className="text-sm" style={{ color: '#64748B' }}>Just a moment</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function CompletionScreen({ workout, navigate, logs, prevLogs }) {
  const { day, completedExerciseIds, totalSetsCompleted, elapsedSeconds, logSaveStatus, setPerformance } = workout
  // Pick a random "complete" category quote on mount
  const [quote] = useState(() => randomQuote(quotesData, 'complete'))

  // Compute live streak from the logs passed in from Home/parent
  const { currentStreak, totalWorkouts } = useStreak(logs)

  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  // Badge unlock ceremony
  const [newBadges, setNewBadges] = useState([])
  const [badgeIdx, setBadgeIdx] = useState(0)
  const [showBadgeModal, setShowBadgeModal] = useState(false)

  // Fire confetti on mount
  useEffect(() => {
    confetti({
      particleCount: 130,
      spread: 80,
      origin: { y: 0.35 },
      colors: ['#14B8A6', '#F8FAFC', '#F59E0B'],
    })
  }, [])

  // Detect newly earned badges.
  // prevLogs = snapshot captured before this workout started (passed from parent).
  // logs = refreshed after save completes. Re-run when logs changes so we catch
  // the update even if refetch finishes after this component mounts.
  const badgeDiffFiredRef = useRef(false)
  useEffect(() => {
    if (badgeDiffFiredRef.current) return   // only fire once
    if (logs.length < 1) return             // wait for refetch
    // If logs already includes this workout (length grew), run the diff
    const prev = prevLogs ?? []
    const prevBadges = computeBadges(prev)
    const currBadges = computeBadges(logs)
    const earned = currBadges.filter(b => b.earned && !prevBadges.find(p => p.id === b.id)?.earned)
    if (earned.length > 0) {
      badgeDiffFiredRef.current = true
      setNewBadges(earned)
      setTimeout(() => setShowBadgeModal(true), 2200)
    } else if (logs.length > prev.length) {
      // Logs refreshed and no new badges — mark as done so we stop checking
      badgeDiffFiredRef.current = true
    }
  }, [logs]) // eslint-disable-line react-hooks/exhaustive-deps

  function dismissBadge() {
    if (badgeIdx < newBadges.length - 1) {
      setBadgeIdx(i => i + 1)
    } else {
      setShowBadgeModal(false)
    }
  }

  // Show toast after 1 s — "Saved ✓" if just saved, else streak/milestone
  useEffect(() => {
    let toastText
    if (logSaveStatus === 'done') toastText = '✅ Saved!'
    else if (logSaveStatus === 'error') toastText = '⚠️ Saved offline — will sync later'
    else if (totalWorkouts <= 1) toastText = '🎉 First workout complete!'
    else if (currentStreak === 7) toastText = '🏆 Full week crushed!'
    else if (currentStreak >= 1) toastText = `🔥 ${currentStreak} day streak!`
    else toastText = '✅ Great workout!'
    setToastMsg(toastText)

    const t1 = setTimeout(() => setShowToast(true), 1000)
    const t2 = setTimeout(() => setShowToast(false), 4000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 text-center pb-12"
      style={{ backgroundColor: '#0F172A' }}
    >
      {/* Streak toast — slides in from top */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          padding: '16px 20px',
          backgroundColor: '#14B8A6',
          color: '#fff',
          fontWeight: 700,
          fontSize: 17,
          textAlign: 'center',
          transform: showToast ? 'translateY(0)' : 'translateY(-110%)',
          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          zIndex: 100,
        }}
      >
        {toastMsg}
      </div>

      <div style={{ width: 80, height: 80, backgroundColor: '#134E4A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'bouncePop 500ms ease-out', marginBottom: 16 }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h1 className="text-3xl font-extrabold text-white mb-2">Workout Complete!</h1>
      <p className="text-lg font-bold mb-6" style={{ color: '#14B8A6' }}>
        Day {day.day} — {day.theme}
      </p>

      {/* Stats — 2×2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 360, marginTop: 28 }}>
        {[
          { label: 'TIME', value: formatTime(elapsedSeconds) },
          { label: 'EXERCISES', value: completedExerciseIds.length },
          { label: 'SETS', value: totalSetsCompleted },
          { label: 'STREAK', value: `${currentStreak}d` },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: '#1E293B', borderRadius: 16, padding: 16, textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.value}</p>
            <p style={{ fontSize: 10, color: '#64748B', fontWeight: 600, letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Performance highlights — sets where user adjusted reps */}
      {setPerformance && setPerformance.length > 0 && (() => {
        const highlights = setPerformance.filter(s => s.actualReps !== s.targetReps)
        if (highlights.length === 0) return null
        return (
          <div style={{ width: '100%', maxWidth: 360, marginTop: 16, marginBottom: 4 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#64748B', textTransform: 'uppercase', marginBottom: 8, borderLeft: '2px solid #0D9488', paddingLeft: 8 }}>
              Your reps
            </p>
            {highlights.slice(0, 4).map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, paddingBottom: 6, borderBottom: i < highlights.length - 1 ? '1px solid #1E293B' : 'none' }}>
                <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
                  {s.exerciseId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} · Set {s.setNumber}
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: s.actualReps < s.targetReps ? '#F59E0B' : '#14B8A6', margin: 0 }}>
                  {s.actualReps} <span style={{ color: '#475569', fontWeight: 400 }}>/ {s.targetReps}</span>
                </p>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Motivational quote */}
      {quote && (
        <div
          className="w-full rounded-xl p-4 text-left"
          style={{ backgroundColor: '#1E293B', borderLeft: '3px solid #14B8A6', maxWidth: 360, marginTop: 16, marginBottom: 20 }}
        >
          <p className="text-sm font-medium text-white leading-relaxed italic">"{quote.text}"</p>
          {quote.author !== 'StrongBase' && (
            <p className="text-xs mt-1 font-semibold" style={{ color: '#64748B' }}>— {quote.author}</p>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="w-full space-y-3" style={{ maxWidth: 360 }}>
        <button
          onClick={() => navigate('/')}
          className="w-full rounded-xl font-bold text-base text-white transition-all active:scale-95"
          style={{ minHeight: 56, backgroundColor: '#14B8A6', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0D9488'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#14B8A6'}
        >
          Back to Home
        </button>
        <button
          onClick={() => navigate(`/day/${day.day}`)}
          className="w-full rounded-xl font-semibold text-base transition-all active:scale-95"
          style={{
            minHeight: 56,
            backgroundColor: '#1E293B',
            color: '#F8FAFC',
            border: '1px solid #334155',
            cursor: 'pointer',
          }}
        >
          View Summary
        </button>
      </div>

      {/* Badge unlock modal */}
      {showBadgeModal && newBadges[badgeIdx] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
        >
          <div
            className="w-full rounded-2xl p-7 text-center"
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid #14B8A650',
              maxWidth: 320,
              boxShadow: '0 0 40px 4px #14B8A630',
              animation: 'bouncePop 400ms ease-out',
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#14B8A6', textTransform: 'uppercase', marginBottom: 16 }}>
              Badge Unlocked!
            </p>
            <div style={{ fontSize: 64, marginBottom: 12, animation: 'bouncePop 500ms ease-out' }}>
              {newBadges[badgeIdx].emoji}
            </div>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#F8FAFC', marginBottom: 6 }}>
              {newBadges[badgeIdx].name}
            </p>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 24, lineHeight: 1.5 }}>
              {newBadges[badgeIdx].condition}
            </p>
            <button
              onClick={dismissBadge}
              style={{
                width: '100%', height: 48,
                backgroundColor: '#14B8A6',
                border: 'none', borderRadius: 12,
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {badgeIdx < newBadges.length - 1 ? 'Next →' : 'Awesome!'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ExitConfirmDialog({ onCancel, onExit }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
    >
      <div
        className="w-full rounded-2xl p-6"
        style={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', maxWidth: 420 }}
      >
        <h3 className="text-lg font-bold text-white mb-2">Exit Workout?</h3>
        <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>
          Your progress will be lost and not saved.
        </p>
        <div className="space-y-3">
          <button
            onClick={onExit}
            className="w-full rounded-xl font-bold text-base transition-all active:scale-95"
            style={{
              minHeight: 52,
              backgroundColor: '#EF444420',
              color: '#FCA5A5',
              border: '1px solid #EF444440',
              cursor: 'pointer',
            }}
          >
            Exit Workout
          </button>
          <button
            onClick={onCancel}
            className="w-full rounded-xl font-bold text-base text-white transition-all active:scale-95"
            style={{
              minHeight: 52,
              backgroundColor: '#14B8A6',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0D9488'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#14B8A6'}
          >
            Keep Going
          </button>
        </div>
      </div>
    </div>
  )
}

function PreviousConfirmDialog({ exerciseName, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
    >
      <div
        className="w-full rounded-2xl p-6"
        style={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', maxWidth: 420 }}
      >
        <h3 className="text-lg font-bold text-white mb-2">Go Back?</h3>
        <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>
          This will restart{' '}
          <span className="font-semibold text-white">{exerciseName}</span> from Set 1.
        </p>
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            className="w-full rounded-xl font-bold text-base text-white transition-all active:scale-95"
            style={{
              minHeight: 52,
              backgroundColor: '#334155',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Yes, Go Back
          </button>
          <button
            onClick={onCancel}
            className="w-full rounded-xl font-bold text-base text-white transition-all active:scale-95"
            style={{
              minHeight: 52,
              backgroundColor: '#14B8A6',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0D9488'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#14B8A6'}
          >
            Keep Going
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main WorkoutPlayer component ───────────────────────────────────────────
export default function WorkoutPlayer() {
  const { dayNumber } = useParams()
  const navigate = useNavigate()
  const workout = useWorkoutPlayer(dayNumber)
  const { logs, refetch: refetchLogs } = useWorkoutLogs()
  const { playSound, soundEnabled, toggleSound } = useSound()

  // Snapshot of logs captured the moment the workout begins (before it's saved).
  // Passed to CompletionScreen so the badge diff compares "before this session"
  // vs "after refetch" — avoids the race where logs.slice(1) is empty pre-refetch.
  const prevLogsRef = useRef(null)
  useEffect(() => {
    if (workout.phase === 'exercise' && prevLogsRef.current === null) {
      prevLogsRef.current = logs
    }
  }, [workout.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh logs once the workout is saved so CompletionScreen shows the updated streak
  useEffect(() => {
    if (workout.logSaveStatus === 'done') refetchLogs()
  }, [workout.logSaveStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedExercise, setSelectedExercise] = useState(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [showPrevConfirm, setShowPrevConfirm] = useState(false)
  const [flashComplete, setFlashComplete] = useState(false)

  // ── Sound & haptic effects ────────────────────────────────────────────────
  const prevExIdxRef = useRef(-1)
  const prevPhaseRef = useRef('idle')
  const halfwayFiredRef = useRef(false)

  useEffect(() => {
    const { phase, exerciseIndex } = workout
    const prevPhase = prevPhaseRef.current

    // New exercise started
    if (phase === 'exercise' && exerciseIndex !== prevExIdxRef.current) {
      prevExIdxRef.current = exerciseIndex
      playSound('start')
    }
    // Rest period began
    if (phase === 'rest' && prevPhase !== 'rest') {
      playSound('rest')
    }
    // Workout complete
    if (phase === 'complete' && prevPhase !== 'complete') {
      playSound('complete')
      navigator.vibrate?.([50, 30, 50, 30, 100])
    }
    // Reset halfway flag on new workout
    if (phase === 'idle') halfwayFiredRef.current = false

    prevPhaseRef.current = phase
  }, [workout.phase, workout.exerciseIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tick sound + haptic on last 3 seconds
  useEffect(() => {
    const { phase, secondsRemaining } = workout
    if ((phase === 'exercise' || phase === 'rest') && secondsRemaining > 0 && secondsRemaining <= 3) {
      playSound('tick')
      navigator.vibrate?.(10)
    }
  }, [workout.secondsRemaining]) // eslint-disable-line react-hooks/exhaustive-deps

  // Halfway chime
  useEffect(() => {
    const total = workout.dayExercises.length
    const done  = workout.completedExerciseIds.length
    if (total > 0 && done >= Math.ceil(total / 2) && !halfwayFiredRef.current && workout.phase !== 'idle') {
      halfwayFiredRef.current = true
      playSound('halfway')
    }
  }, [workout.completedExerciseIds.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Set completion handler (flash + haptic + advance) ────────────────────
  function handleCompleteSet(actualReps) {
    navigator.vibrate?.([10, 50, 10])
    setFlashComplete(true)
    setTimeout(() => setFlashComplete(false), 200)
    // Log actual reps performed (rep-based exercises only)
    if (actualReps !== undefined && workout.currentExercise && !workout.currentExercise.durationSeconds) {
      workout.logSetPerformance(
        workout.currentExercise.id,
        workout.currentSet,
        workout.currentExercise.reps,
        actualReps
      )
    }
    workout.completeSet()
  }

  const { day, phase, currentExercise, nextExercise } = workout

  if (!day) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F172A' }}>
        <div className="text-center px-6">
          <p className="text-xl font-bold text-white mb-4">Day not found.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl font-bold text-white"
            style={{ backgroundColor: '#14B8A6', border: 'none', cursor: 'pointer' }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const handleOpenModal = (ex) => {
    setSelectedExercise(ex)
    workout.pauseTimer()
  }
  const handleCloseModal = () => {
    setSelectedExercise(null)
    workout.resumeTimer()
  }

  const handleBack = () => {
    setShowPrevConfirm(true)
  }
  const handleConfirmBack = () => {
    setShowPrevConfirm(false)
    workout.goBack()
  }

  const handleSkipToRest = () => {
    // For timed exercises: cleanly clear the interval and fire the completion callback
    // (same as the timer running out naturally). Do NOT call completeSet() directly —
    // that leaves the countdown interval orphaned.
    workout.skipRest()
  }

  const showTopBar = phase !== 'idle' && phase !== 'complete'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F172A' }}>
      {/* Inject animation keyframes once */}
      <style>{ANIM_STYLES}</style>

      {/* Green flash overlay on set completion */}
      {flashComplete && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            backgroundColor: '#22C55E25',
            animation: 'greenFlash 200ms ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      )}

      {showTopBar && (
        <TopBar
          day={day}
          onExit={() => setShowExitConfirm(true)}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
        />
      )}

      {/* Phase screens */}
      {phase === 'idle' && (
        <ReadyScreen day={day} onStart={workout.startWorkout} />
      )}
      {phase === 'transition' && (
        <TransitionCard exercise={nextExercise} />
      )}
      {phase === 'exercise' && (
        <ExerciseScreen
          key={`${workout.exerciseIndex}-${workout.currentSet}`}
          workout={workout}
          onOpenModal={handleOpenModal}
          onBack={handleBack}
          onSkipToRest={handleSkipToRest}
          onCompleteSet={handleCompleteSet}
          onPause={workout.pauseWorkout}
          onResume={workout.resumeWorkout}
        />
      )}
      {phase === 'rest' && (
        <RestScreen workout={workout} />
      )}
      {phase === 'complete' && workout.logSaveStatus === 'saving' && (
        <SavingScreen />
      )}
      {phase === 'complete' && workout.logSaveStatus !== 'saving' && (
        <CompletionScreen workout={workout} navigate={navigate} logs={logs} prevLogs={prevLogsRef.current ?? []} />
      )}

      {/* Overlays */}
      {showExitConfirm && (
        <ExitConfirmDialog
          onCancel={() => setShowExitConfirm(false)}
          onExit={() => navigate('/')}
        />
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
