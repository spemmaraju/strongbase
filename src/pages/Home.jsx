import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import weeklyPlan from '../data/weeklyPlan.json'
import exercisesData from '../data/exercises.json'
import useStreak, { getMondayStr, dateAddDays } from '../hooks/useStreak'
import useBadges from '../hooks/useBadges'
import useWorkoutLogs from '../hooks/useWorkoutLogs'
import useAuth from '../hooks/useAuth'
import useMediaQuery from '../hooks/useMediaQuery'
import { getDayComposition, CAT_COLORS, getProgramDayNumber } from '../utils/workoutStats'
import { Icon } from '../components/Icons'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const K = {
  bg:      '#0a0e1a',
  rail:    '#0c1322',
  card:    '#101828',
  panel:   '#0a111e',
  inset:   '#16233a',
  border:  'rgba(255,255,255,0.06)',
  borderSt:'rgba(255,255,255,0.10)',
  pink:    '#ec4899',
  purple:  '#8b5cf6',
  violet:  '#c084fc',
  grad:    'linear-gradient(90deg, #ec4899, #8b5cf6)',
  gradD:   'linear-gradient(135deg, #ec4899, #8b5cf6)',
  gradH:   'linear-gradient(130deg, #fb923c 0%, #ec4899 48%, #8b5cf6 100%)',
  amber:   '#f59e0b',
  teal:    '#2dd4bf',
  text:    '#f8fafc',
  muted:   '#94a3b8',
  subtle:  '#64748b',
  dim:     '#475569',
}

// Per-category Kinetic colors (used in composition bar + dots)
const KCAT = {
  'warm-up':   K.amber,
  strength:    K.pink,
  stability:   K.purple,
  flexibility: K.teal,
  cardio:      '#3b82f6',
}

// Level system — each workout ≈ 12 sets × 25 XP = 300 XP
const LEVEL_THRESHOLDS = [0, 400, 900, 1800, 3200, 5000, 7500, 11000, 15500, 21000]
const LEVEL_NAMES      = ['Starter', 'Active', 'Regular', 'Consistent', 'Dedicated', 'Athlete', 'Beast', 'Warrior', 'Legend', 'Champion']

function getLevelInfo(totalXP) {
  let idx = 0
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) idx = i
    else break
  }
  const level      = idx + 1
  const floor      = LEVEL_THRESHOLDS[idx]
  const ceiling    = LEVEL_THRESHOLDS[Math.min(idx + 1, LEVEL_THRESHOLDS.length - 1)]
  const progress   = ceiling > floor ? (totalXP - floor) / (ceiling - floor) : 1
  const xpToNext   = Math.max(0, ceiling - totalXP)
  const name       = LEVEL_NAMES[idx] || 'Champion'
  return { level, name, progress: Math.min(progress, 1), totalXP, xpToNext }
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Up early'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getDayAccentColor(day) {
  if (!day) return K.pink
  const exMap = Object.fromEntries(exercisesData.map(e => [e.id, e]))
  const counts = {}
  day.exerciseIds.forEach(id => {
    const ex = exMap[id]
    if (ex && ex.category !== 'warm-up' && ex.category !== 'flexibility') {
      counts[ex.category] = (counts[ex.category] || 0) + 1
    }
  })
  if (!Object.keys(counts).length) return K.teal
  const primary = Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0]
  return KCAT[primary] || K.pink
}

// ── Sub-components ─────────────────────────────────────────────────────────────

// Kinetic hero card — gradHero bg, watermark icon, gradient CTA
function KineticHeroCard({
  day, dayNumber, accentColor, todayDone, isOverdue, daysSinceLast,
  isProgramComplete, onStart, onPreviewNext, nextDayNumber, onRestart, restarting,
}) {
  let ctaLabel
  if (isProgramComplete) ctaLabel = restarting ? 'Updating…' : 'Restart Week 1 →'
  else if (todayDone)    ctaLabel = `Preview Day ${nextDayNumber} →`
  else if (isOverdue)    ctaLabel = daysSinceLast > 1 ? `${daysSinceLast} days away — get back to it` : 'Back on track →'
  else                   ctaLabel = 'Start Workout →'

  const isDoneOutline     = todayDone && !isProgramComplete
  const isAmberCta        = isProgramComplete || isOverdue
  const isGradientCta     = !isDoneOutline && !isAmberCta

  const handleCta = () => {
    if (isProgramComplete) { onRestart(); return }
    if (todayDone)         { onPreviewNext(); return }
    onStart()
  }

  const comp = day ? getDayComposition(day) : null

  return (
    <div style={{
      borderRadius: 22, overflow: 'hidden', position: 'relative',
      background: K.gradH, border: `1px solid rgba(255,255,255,0.08)`,
      padding: '24px 22px 22px',
    }}>
      {/* Hatch overlay — adds texture without obscuring gradient */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 8px)',
      }} />

      {/* Watermark icon */}
      <div style={{
        position: 'absolute', right: -16, bottom: -16,
        color: '#fff', opacity: 0.07, pointerEvents: 'none',
      }}>
        <Icon name="strength" size={160} strokeWidth={1} />
      </div>

      {/* DAY N OF 7 chip */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(6px)',
        borderRadius: 99, padding: '5px 11px', marginBottom: 14,
        border: '1px solid rgba(255,255,255,0.14)',
      }}>
        <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.violet, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {isProgramComplete ? 'Program Complete' : `Day ${dayNumber} of 7`}
        </span>
      </div>

      {/* Workout name */}
      <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: '#fff', lineHeight: 1.1, margin: 0 }}>
        {isProgramComplete ? 'Week 1 — Done!' : day?.theme}
      </h2>

      {/* Focus area */}
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', marginTop: 6, lineHeight: 1.4 }}>
        {isProgramComplete ? 'You completed all 7 days. Build on it.' : day?.focusArea}
      </p>

      {/* Meta row */}
      {!isProgramComplete && day && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="clock" size={13} style={{ color: 'rgba(255,255,255,0.6)' }} />
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
              {day.durationMinutes} min
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="target" size={13} style={{ color: 'rgba(255,255,255,0.6)' }} />
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
              {day.exerciseIds?.length ?? 0} exercises
            </span>
          </div>
        </div>
      )}

      {/* Composition bar */}
      {!isProgramComplete && comp?.total > 0 && (
        <div style={{ height: 3, borderRadius: 999, overflow: 'hidden', display: 'flex', gap: 2, marginTop: 14 }}>
          {Object.entries(comp.counts).filter(([, n]) => n > 0).map(([cat, n]) => (
            <div key={cat} style={{ flex: n / comp.total, backgroundColor: KCAT[cat] || '#475569', borderRadius: 1 }} />
          ))}
        </div>
      )}

      {/* Week 2 teaser when program complete */}
      {isProgramComplete && (
        <div style={{
          marginTop: 14, padding: '10px 14px', borderRadius: 12,
          backgroundColor: 'rgba(0,0,0,0.32)', border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Icon name="lock" size={16} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
          <div>
            <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0 }}>Week 2 — Progressive Load</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0, marginTop: 1 }}>Same movements · +1 set · coming soon</p>
          </div>
        </div>
      )}

      {/* CTA button */}
      <button
        onClick={handleCta}
        disabled={restarting}
        style={{
          marginTop: 18, width: '100%', minHeight: 52,
          background: isAmberCta ? K.amber : isDoneOutline ? 'transparent' : K.gradD,
          color: isAmberCta ? '#0f172a' : isDoneOutline ? K.violet : '#fff',
          border: isDoneOutline ? `1px solid ${K.violet}50` : 'none',
          borderRadius: 14,
          fontFamily: FONT, fontWeight: 700, fontSize: 15,
          cursor: restarting ? 'default' : 'pointer',
          letterSpacing: '0.01em',
          transition: 'opacity 0.15s',
          position: 'relative', zIndex: 1,
        }}
        onMouseEnter={e => { if (!restarting) e.currentTarget.style.opacity = '0.88' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
      >
        {ctaLabel}
      </button>

      {/* Done today: "Do it again" ghost link */}
      {todayDone && !isProgramComplete && (
        <button
          onClick={onStart}
          style={{
            marginTop: 8, width: '100%', minHeight: 36,
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', zIndex: 1, position: 'relative',
          }}
        >
          Do it again
        </button>
      )}
    </div>
  )
}

// 7 day pills with gradient today, purple done, subdued future
function WeekPills({ days, todayDayNumber, completedThisWeekDayNumbers, onPress }) {
  return (
    <div style={{ paddingTop: 22 }}>
      <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: K.dim, textTransform: 'uppercase', marginBottom: 12 }}>
        Your Week
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
        {days.map(day => {
          const isToday = day.day === todayDayNumber
          const isDone  = completedThisWeekDayNumbers?.has(day.day)
          const label   = day.theme.split(' ')[0].slice(0, 3).toUpperCase()

          return (
            <button
              key={day.day}
              onClick={() => onPress(day.day)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', minHeight: 44,
              }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: isToday ? K.gradD : 'transparent',
                backgroundColor: isToday ? undefined : isDone ? 'rgba(139,92,246,0.15)' : K.inset,
                border: `1.5px solid ${isToday ? 'transparent' : isDone ? 'rgba(139,92,246,0.35)' : K.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {isDone && !isToday ? (
                  <Icon name="check" size={13} strokeWidth={2.5} style={{ color: K.violet }} />
                ) : (
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: isToday ? '#fff' : isDone ? K.violet : K.dim }}>
                    {day.day}
                  </span>
                )}
              </div>
              <span style={{ fontFamily: MONO, fontSize: 8, color: isToday ? K.violet : K.dim, fontWeight: 700, letterSpacing: '0.06em' }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Level card — XP bar + name
function LevelCard({ levelInfo }) {
  return (
    <div style={{
      backgroundColor: K.card, borderRadius: 20, border: `1px solid ${K.borderSt}`,
      padding: 18, marginBottom: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: K.gradD, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="trophy" size={16} style={{ color: '#fff' }} />
          </div>
          <div>
            <p style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, color: K.dim, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>Level</p>
            <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, color: K.text, margin: 0, lineHeight: 1.1 }}>
              {levelInfo.level} · {levelInfo.name}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: 'rgba(192,132,252,0.12)', borderRadius: 99, padding: '4px 10px', border: '1px solid rgba(192,132,252,0.22)' }}>
          <Icon name="xp" size={11} style={{ color: K.violet }} />
          <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.violet }}>{levelInfo.totalXP} XP</span>
        </div>
      </div>
      {/* XP progress bar */}
      <div style={{ height: 5, borderRadius: 999, backgroundColor: K.inset, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.round(levelInfo.progress * 100)}%`, background: K.gradD, borderRadius: 999, transition: 'width 0.6s ease' }} />
      </div>
      {levelInfo.xpToNext > 0 && (
        <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.08em', marginTop: 7 }}>
          {levelInfo.xpToNext} XP to level {levelInfo.level + 1}
        </p>
      )}
    </div>
  )
}

// Streak card — amber tint
function StreakCard({ currentStreak, longestStreak, totalWorkouts }) {
  return (
    <div style={{
      backgroundColor: K.card, borderRadius: 20, border: `1px solid ${K.borderSt}`,
      padding: 18, marginBottom: 14,
      background: 'linear-gradient(145deg, rgba(245,158,11,0.08), rgba(16,24,40,0))',
      borderColor: 'rgba(245,158,11,0.18)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="streak" size={22} style={{ color: K.amber }} />
          <div>
            <p style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, color: 'rgba(245,158,11,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>Streak</p>
            <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: K.amber, lineHeight: 1, margin: 0 }}>
              {currentStreak} <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(245,158,11,0.65)' }}>days</span>
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.08em', margin: 0 }}>{totalWorkouts} total</p>
          <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.08em', margin: 0, marginTop: 2 }}>{longestStreak} best</p>
        </div>
      </div>
    </div>
  )
}

// Badges card — 2×N mini grid
function BadgesCard({ badges }) {
  if (!badges.some(b => b.earned)) return null
  return (
    <div style={{
      backgroundColor: K.card, borderRadius: 20, border: `1px solid ${K.borderSt}`, padding: 18,
    }}>
      <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>Badges</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {badges.slice(0, 8).map(b => (
          <div key={b.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            opacity: b.earned ? 1 : 0.22,
            filter: b.earned ? 'none' : 'grayscale(1)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: b.earned ? 'rgba(139,92,246,0.12)' : K.inset,
              border: b.earned ? '1px solid rgba(139,92,246,0.28)' : `1px solid ${K.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: b.earned ? K.violet : K.dim,
            }}>
              <Icon name={b.iconName || 'badge'} size={22} />
            </div>
            <span style={{ fontSize: 9, fontWeight: 600, color: b.earned ? K.muted : K.dim, textAlign: 'center', lineHeight: 1.2 }}>
              {b.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Compact volume bars (narrow only)
function VolumeTrend({ logs }) {
  if (logs.length < 2) return null
  const today = new Date().toISOString().slice(0, 10)
  const thisMonday = getMondayStr(today)
  const weeks = [3, 2, 1, 0].map(n => {
    const start = dateAddDays(thisMonday, -7 * n)
    const end   = dateAddDays(start, 7)
    const sets  = logs.filter(l => l.date >= start && l.date < end).reduce((t, l) => t + (l.totalSets || 0), 0)
    return { start, sets, isCurrent: n === 0 }
  })
  if (weeks.every(w => w.sets === 0)) return null
  const max = Math.max(...weeks.map(w => w.sets), 1)

  return (
    <div style={{ paddingTop: 20 }}>
      <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: K.dim, textTransform: 'uppercase', marginBottom: 10 }}>
        Volume · sets
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 52 }}>
        {weeks.map(w => (
          <div key={w.start} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: w.isCurrent ? K.violet : K.dim }}>
              {w.sets || ''}
            </span>
            <div style={{
              width: '100%', borderRadius: 4,
              height: Math.max(4, Math.round((w.sets / max) * 36)),
              background: w.isCurrent ? K.gradD : K.inset,
            }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// Tiny avatar pill
function Avatar({ user, onClick }) {
  const initials = (user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email || '?')
    .slice(0, 2).toUpperCase()
  return (
    <button
      onClick={onClick}
      style={{
        width: 38, height: 38, borderRadius: '50%',
        background: K.gradD, border: `1.5px solid rgba(192,132,252,0.3)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', padding: 0, flexShrink: 0,
      }}
      aria-label="Profile"
    >
      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: '#fff' }}>{initials}</span>
    </button>
  )
}

// Home/Gym mode toggle
function ModeToggle({ mode, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      backgroundColor: K.inset, borderRadius: 99,
      padding: 3, gap: 2, border: `1px solid ${K.border}`,
    }}>
      {['home', 'gym'].map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            padding: '4px 12px', borderRadius: 99, border: 'none',
            background: mode === m ? K.gradD : 'transparent',
            color: mode === m ? '#fff' : K.dim,
            fontFamily: MONO, fontSize: 9, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { logs, loading, syncing, error: logsError, refetch: refetchLogs } = useWorkoutLogs()
  const isWide = useMediaQuery('(min-width: 768px)')

  const [workoutMode, setWorkoutMode] = useState(
    () => localStorage.getItem('strongbase_workout_mode') || 'home',
  )
  function handleModeChange(m) {
    setWorkoutMode(m)
    localStorage.setItem('strongbase_workout_mode', m)
  }

  const todayDayNumber = getProgramDayNumber(user)
  const todayDay       = weeklyPlan.days[todayDayNumber - 1]

  const {
    currentStreak, longestStreak, totalWorkouts, completedThisWeekDayNumbers,
  } = useStreak(logs)

  const badges = useBadges(logs)

  const todayISODate  = new Date().toISOString().slice(0, 10)
  const todayDone     = logs.some(l => l.date === todayISODate && l.dayNumber === todayDayNumber)
  const nextDayNumber = (todayDayNumber % 7) + 1

  const programStartDate  = user?.user_metadata?.programStartDate || user?.created_at?.slice(0, 10) || null
  const logsThisCycle     = programStartDate ? logs.filter(l => l.date >= programStartDate) : logs
  const isProgramComplete = [1,2,3,4,5,6,7].every(n => logsThisCycle.some(l => l.dayNumber === n))

  const isOverdue       = !todayDone && !isProgramComplete && totalWorkouts > 0 && currentStreak === 0
  const latestLogDate   = logs.length > 0 ? logs.reduce((max, l) => l.date > max ? l.date : max, logs[0].date) : null
  const daysSinceLast   = latestLogDate ? Math.round((new Date() - new Date(latestLogDate + 'T12:00:00')) / 86400000) : 0
  const firstName       = (user?.user_metadata?.display_name || user?.user_metadata?.full_name || '').split(' ')[0] || null

  const totalXP   = logs.reduce((sum, l) => sum + (l.totalSets || 0) * 25, 0)
  const levelInfo = getLevelInfo(totalXP)

  const [restarting, setRestarting] = useState(false)
  async function handleRestartProgram() {
    setRestarting(true)
    try { await supabase.auth.updateUser({ data: { programStartDate: new Date().toISOString().slice(0, 10) } }) }
    catch {}
    setRestarting(false)
  }

  const heroProps = {
    day: todayDay, dayNumber: todayDayNumber,
    accentColor: getDayAccentColor(todayDay),
    todayDone, isOverdue, daysSinceLast,
    isProgramComplete,
    onStart:       () => navigate(`/day/${todayDayNumber}`),
    onPreviewNext: () => navigate(`/day/${nextDayNumber}`),
    nextDayNumber,
    onRestart: handleRestartProgram, restarting,
  }

  const weekProps = {
    days: weeklyPlan.days,
    todayDayNumber,
    completedThisWeekDayNumbers,
    onPress: n => navigate(`/day/${n}`),
  }

  return (
    <div style={{ backgroundColor: K.bg, minHeight: '100svh', color: K.text }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: isWide ? '32px 28px 24px' : '52px 20px 20px',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        borderBottom: isWide ? `1px solid ${K.border}` : 'none',
      }}>
        <div>
          <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: K.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
            {getGreeting()}{firstName ? `, ${firstName}` : ''}
          </p>
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: K.text, lineHeight: 1, margin: 0 }}>
            Let's move.
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ModeToggle mode={workoutMode} onChange={handleModeChange} />
          {/* LVL pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: K.gradD, borderRadius: 99, padding: '5px 10px',
          }}>
            <Icon name="xp" size={11} style={{ color: '#fff' }} />
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: '#fff' }}>LVL {levelInfo.level}</span>
          </div>
          <Avatar user={user} onClick={() => navigate('/profile')} />
        </div>
      </div>

      {/* Error / syncing banners */}
      {logsError && (
        <div style={{ margin: '12px 20px 0', padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 13, color: '#fca5a5', fontWeight: 600, margin: 0 }}>⚠️ Couldn't load your data</p>
          <button onClick={refetchLogs} style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5', background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button>
        </div>
      )}
      {syncing && (
        <p style={{ textAlign: 'center', fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.violet, letterSpacing: '0.1em', marginTop: 10 }}>
          SYNCING…
        </p>
      )}

      {/* ── Wide: 2-column content grid ─────────────────────────────────────── */}
      {isWide ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 28, padding: '28px 28px 48px', alignItems: 'start' }}>

          {/* Left column */}
          <div>
            {loading ? (
              <div style={{ borderRadius: 22, backgroundColor: K.card, border: `1px solid ${K.border}`, height: 240, animation: 'kPulse 1.5s ease-in-out infinite' }} />
            ) : (
              <KineticHeroCard {...heroProps} />
            )}
            <WeekPills {...weekProps} />
            <VolumeTrend logs={logs} />

            {/* Recent activity */}
            {logs.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: K.dim, textTransform: 'uppercase', margin: 0 }}>Recent</p>
                  <button onClick={() => navigate('/history')} style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.violet, background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.08em' }}>
                    See all →
                  </button>
                </div>
                {logs.slice(0, 3).map(log => (
                  <div key={log.id || log.date} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 0', borderBottom: `1px solid ${K.border}`,
                  }}>
                    <div>
                      <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: K.text, margin: 0 }}>{log.theme}</p>
                      <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.dim, letterSpacing: '0.06em', margin: 0, marginTop: 2 }}>
                        DAY {log.dayNumber} · {new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: K.violet }}>
                      {log.totalTimeSeconds ? `${Math.round(log.totalTimeSeconds / 60)} min` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div>
            <LevelCard levelInfo={levelInfo} />
            <StreakCard currentStreak={currentStreak} longestStreak={longestStreak} totalWorkouts={totalWorkouts} />
            <BadgesCard badges={badges} />
          </div>
        </div>

      ) : (
        /* ── Narrow: single column ───────────────────────────────────────── */
        <div style={{ padding: '0 0 40px', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 40px)' }}>
          {/* Hero */}
          <div style={{ padding: '20px 16px 0' }}>
            {loading ? (
              <div style={{ borderRadius: 22, backgroundColor: K.card, border: `1px solid ${K.border}`, height: 220, animation: 'kPulse 1.5s ease-in-out infinite' }} />
            ) : (
              <KineticHeroCard {...heroProps} />
            )}
          </div>

          {/* Week */}
          <div style={{ padding: '0 16px' }}>
            <WeekPills {...weekProps} />
          </div>

          {/* Streak row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 16px 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="streak" size={20} style={{ color: K.amber }} />
              <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: K.amber, lineHeight: 1 }}>
                {currentStreak}
              </span>
              <span style={{ fontSize: 14, color: 'rgba(245,158,11,0.65)', fontWeight: 500 }}>
                day streak
              </span>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.dim, letterSpacing: '0.06em' }}>
              {totalWorkouts} total · {longestStreak} best
            </span>
          </div>

          {/* XP / Level bar */}
          <div style={{ padding: '14px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="xp" size={12} style={{ color: K.violet }} />
                <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.violet, letterSpacing: '0.08em' }}>
                  LVL {levelInfo.level} · {levelInfo.name}
                </span>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.dim }}>{levelInfo.totalXP} XP</span>
            </div>
            <div style={{ height: 4, borderRadius: 999, backgroundColor: K.inset, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.round(levelInfo.progress * 100)}%`, background: K.gradD, borderRadius: 999 }} />
            </div>
          </div>

          {/* Volume */}
          <div style={{ padding: '0 16px' }}>
            <VolumeTrend logs={logs} />
          </div>

          {/* Badges */}
          {badges.some(b => b.earned) && (
            <div style={{ padding: '24px 16px 0' }}>
              <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: K.dim, textTransform: 'uppercase', marginBottom: 12 }}>Earned</p>
              <div style={{ display: 'flex', gap: 20, overflowX: 'auto', padding: '4px 0 8px' }}>
                {badges.map(b => (
                  <div key={b.id} style={{
                    flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    opacity: b.earned ? 1 : 0.22, filter: b.earned ? 'none' : 'grayscale(1)',
                  }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: b.earned ? 'rgba(139,92,246,0.12)' : K.inset, border: b.earned ? '1px solid rgba(139,92,246,0.28)' : `1px solid ${K.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: b.earned ? K.violet : K.dim }}>
                      <Icon name={b.iconName || 'badge'} size={24} />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 600, color: b.earned ? K.muted : K.dim, textAlign: 'center', maxWidth: 48 }}>{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent */}
          {logs.length > 0 && (
            <div style={{ padding: '20px 16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: K.dim, textTransform: 'uppercase', margin: 0 }}>Recent</p>
                <button onClick={() => navigate('/history')} style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.violet, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  See all →
                </button>
              </div>
              {logs.slice(0, 3).map(log => (
                <div key={log.id || log.date} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: `1px solid ${K.border}`,
                }}>
                  <div>
                    <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: K.text, margin: 0 }}>{log.theme}</p>
                    <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.dim, letterSpacing: '0.06em', margin: 0, marginTop: 2 }}>
                      DAY {log.dayNumber} · {new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: K.violet }}>
                    {log.totalTimeSeconds ? `${Math.round(log.totalTimeSeconds / 60)} min` : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes kPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
    </div>
  )
}
