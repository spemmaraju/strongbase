import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import weeklyPlan from '../data/weeklyPlan.json'
import exercisesData from '../data/exercises.json'
import useStreak, { getMondayStr, dateAddDays } from '../hooks/useStreak'
import useBadges from '../hooks/useBadges'
import useWorkoutLogs from '../hooks/useWorkoutLogs'
import useAuth from '../hooks/useAuth'
import {
  getDayComposition,
  CAT_COLORS,
  getProgramDayNumber,
} from '../utils/workoutStats'
import { C, FONT, CARD, LABEL } from '../styles/tokens'

// Local aliases for brevity
const BG     = C.bg
const SURF   = C.surface
const TEAL   = C.teal
const MUTED  = C.muted
const SUBTLE = C.dim
const WHITE  = C.white

// ── Helpers ───────────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Up early'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// Deep dark gradient per accent color — rich, not garish
const ACCENT_GRADIENTS = {
  '#F59E0B': 'linear-gradient(145deg, #2C1A00, #0F172A)',
  '#14B8A6': 'linear-gradient(145deg, #003530, #0F172A)',
  '#7C3AED': 'linear-gradient(145deg, #1E0A50, #0F172A)',
  '#22C55E': 'linear-gradient(145deg, #042D10, #0F172A)',
  '#3B82F6': 'linear-gradient(145deg, #071840, #0F172A)',
}

function getDayAccentColor(day) {
  if (!day) return TEAL
  const exMap = Object.fromEntries(exercisesData.map(e => [e.id, e]))
  const counts = {}
  day.exerciseIds.forEach(id => {
    const ex = exMap[id]
    if (ex && ex.category !== 'warm-up' && ex.category !== 'flexibility') {
      counts[ex.category] = (counts[ex.category] || 0) + 1
    }
  })
  if (!Object.keys(counts).length) return CAT_COLORS['flexibility'] || '#22C55E'
  const primary = Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0]
  return CAT_COLORS[primary] || TEAL
}

// ── Sub-components ────────────────────────────────────────────────────────────

// The editorial hero card — the focal point of every screen visit
function HeroCard({
  day, dayNumber, accentColor, todayDone, isOverdue, daysSinceLast,
  isProgramComplete, onStart, onPreviewNext, nextDayNumber,
  onRestart, restarting,
}) {
  const gradient = ACCENT_GRADIENTS[accentColor] || `linear-gradient(145deg, #1A2540, ${BG})`

  let ctaLabel, ctaColor, ctaBg, ctaBorder
  if (isProgramComplete) {
    ctaLabel = restarting ? 'Updating…' : 'Restart Week 1 →'
    ctaColor = '#0F172A'; ctaBg = '#F59E0B'; ctaBorder = 'none'
  } else if (todayDone) {
    ctaLabel = `Preview Day ${nextDayNumber} →`
    ctaColor = TEAL; ctaBg = 'transparent'; ctaBorder = `1px solid ${TEAL}40`
  } else if (isOverdue) {
    ctaLabel = daysSinceLast > 1 ? `${daysSinceLast} days away — get back to it` : 'Get back to it →'
    ctaColor = '#0F172A'; ctaBg = '#F59E0B'; ctaBorder = 'none'
  } else {
    ctaLabel = 'Start Workout →'
    ctaColor = '#0F172A'; ctaBg = accentColor; ctaBorder = 'none'
  }

  const handleCta = () => {
    if (isProgramComplete) { onRestart(); return }
    if (todayDone) { onPreviewNext(); return }
    onStart()
  }

  return (
    <div style={{
      margin: '0 16px',
      borderRadius: 24,
      background: gradient,
      border: `1px solid ${accentColor}20`,
      padding: '24px 20px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Watermark emoji — decorative, subtle */}
      <span style={{
        position: 'absolute', right: -6, top: -10,
        fontSize: 120, lineHeight: 1,
        opacity: 0.055, pointerEvents: 'none', userSelect: 'none',
      }}>
        {isProgramComplete ? '🏆' : day?.emoji}
      </span>

      {/* Day label */}
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
        color: accentColor, textTransform: 'uppercase', marginBottom: 6,
      }}>
        {isProgramComplete ? 'Program Complete' : `Day ${dayNumber}`}
      </p>

      {/* Workout name */}
      <h2 style={{
        fontFamily: FONT, fontWeight: 800, fontSize: 26,
        color: WHITE, lineHeight: 1.15, margin: 0,
      }}>
        {isProgramComplete ? 'Week 1 — Done!' : day?.theme}
      </h2>

      {/* Focus area */}
      <p style={{ fontSize: 14, color: MUTED, marginTop: 6, lineHeight: 1.4 }}>
        {isProgramComplete
          ? 'You completed all 7 days. Build on it.'
          : day?.focusArea}
      </p>

      {/* Duration row */}
      {!isProgramComplete && day && (
        <p style={{ fontSize: 13, color: accentColor, fontWeight: 600, marginTop: 10, opacity: 0.85 }}>
          ⏱ {day.durationMinutes} min
        </p>
      )}

      {/* Category composition bar */}
      {!isProgramComplete && day && (() => {
        const comp = getDayComposition(day)
        if (!comp.total) return null
        return (
          <div style={{ height: 3, borderRadius: 999, overflow: 'hidden', display: 'flex', gap: 2, marginTop: 14 }}>
            {Object.entries(comp.counts).filter(([, n]) => n > 0).map(([cat, n]) => (
              <div key={cat} style={{ flex: n / comp.total, backgroundColor: CAT_COLORS[cat] || '#475569', borderRadius: 1 }} />
            ))}
          </div>
        )
      })()}

      {/* Week 2 teaser when program complete */}
      {isProgramComplete && (
        <div style={{
          marginTop: 14, padding: '10px 12px', borderRadius: 12,
          backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid #334155',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>🔒</span>
          <div>
            <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: MUTED, margin: 0 }}>Week 2 — Progressive Load</p>
            <p style={{ fontSize: 11, color: SUBTLE, margin: 0, marginTop: 1 }}>Same movements · +1 set · coming soon</p>
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleCta}
        disabled={restarting}
        style={{
          marginTop: 18, width: '100%', minHeight: 52,
          backgroundColor: ctaBg, color: ctaColor, border: ctaBorder,
          borderRadius: 14,
          fontFamily: FONT, fontWeight: 700, fontSize: 15,
          cursor: restarting ? 'default' : 'pointer',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => { if (!restarting) e.currentTarget.style.opacity = '0.88' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
      >
        {ctaLabel}
      </button>

      {/* Done today: also show "start again" subtle link */}
      {todayDone && !isProgramComplete && (
        <button
          onClick={onStart}
          style={{
            marginTop: 8, width: '100%', minHeight: 40,
            background: 'none', border: 'none', color: SUBTLE,
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          Do it again
        </button>
      )}
    </div>
  )
}

// 7 compact day dots — each tappable
function WeekDots({ days, todayDayNumber, completedThisWeekDayNumbers, onPress }) {
  return (
    <div style={{ padding: '28px 16px 0' }}>
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        color: SUBTLE, textTransform: 'uppercase', marginBottom: 14,
      }}>
        Your Week
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {days.map(day => {
          const isToday  = day.day === todayDayNumber
          const isDone   = completedThisWeekDayNumbers?.has(day.day)
          const label    = day.theme.split(' ')[0].slice(0, 3).toUpperCase()

          return (
            <button
              key={day.day}
              onClick={() => onPress(day.day)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px 0', minWidth: 40, minHeight: 44,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                backgroundColor: isToday ? TEAL : isDone ? '#134E4A' : SURF,
                border: `2px solid ${isToday ? TEAL : isDone ? `${TEAL}60` : '#334155'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {isDone && !isToday ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: isToday ? BG : SUBTLE,
                    fontFamily: FONT,
                  }}>
                    {day.day}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 9, color: isToday ? TEAL : SUBTLE, fontWeight: 600, letterSpacing: '0.04em' }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Weekly training volume (total sets per week, last 4 weeks) — the simplest
// honest "am I doing more than before?" signal
function VolumeTrend({ logs }) {
  if (logs.length < 2) return null
  const today = new Date().toISOString().slice(0, 10)
  const thisMonday = getMondayStr(today)
  const weeks = [3, 2, 1, 0].map(n => {
    const start = dateAddDays(thisMonday, -7 * n)
    const end = dateAddDays(start, 7)
    const sets = logs
      .filter(l => l.date >= start && l.date < end)
      .reduce((t, l) => t + (l.totalSets || 0), 0)
    return { start, sets, isCurrent: n === 0 }
  })
  if (weeks.every(w => w.sets === 0)) return null
  const max = Math.max(...weeks.map(w => w.sets), 1)

  return (
    <div style={{ padding: '20px 20px 0' }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: SUBTLE, textTransform: 'uppercase', margin: 0, marginBottom: 10 }}>
        Weekly volume · sets
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 56 }}>
        {weeks.map(w => (
          <div key={w.start} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: w.isCurrent ? TEAL : SUBTLE }}>
              {w.sets || ''}
            </span>
            <div style={{
              width: '100%', borderRadius: 4,
              height: Math.max(4, Math.round((w.sets / max) * 36)),
              backgroundColor: w.isCurrent ? TEAL : '#334155',
            }} />
          </div>
        ))}
      </div>
    </div>
  )
}

// Compact earned badges — shown only if any earned
function BadgesRow({ badges }) {
  if (!badges.some(b => b.earned)) return null
  return (
    <div style={{ padding: '28px 0 8px' }}>
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        color: SUBTLE, textTransform: 'uppercase',
        padding: '0 16px', marginBottom: 12,
      }}>
        Earned
      </p>
      <div style={{ display: 'flex', gap: 20, overflowX: 'auto', padding: '4px 16px 8px' }}>
        {badges.map(b => (
          <div key={b.id} style={{
            flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            opacity: b.earned ? 1 : 0.22,
            filter: b.earned ? 'none' : 'grayscale(1)',
          }}>
            <span style={{ fontSize: 30 }}>{b.emoji}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: b.earned ? MUTED : SUBTLE, textAlign: 'center', maxWidth: 52 }}>
              {b.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Tiny initials avatar — taps to Profile
function Avatar({ user, onClick }) {
  const initials = (user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email || '?')
    .slice(0, 2).toUpperCase()
  return (
    <button
      onClick={onClick}
      style={{
        width: 38, height: 38, borderRadius: '50%',
        backgroundColor: '#134E4A', border: `1.5px solid ${TEAL}60`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', background: 'none',
        padding: 0,
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        backgroundColor: '#134E4A', border: `1.5px solid ${TEAL}60`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: TEAL }}>{initials}</span>
      </div>
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { logs, loading, syncing, error: logsError, refetch: refetchLogs } = useWorkoutLogs()

  const todayDayNumber = getProgramDayNumber(user)
  const todayDay = weeklyPlan.days[todayDayNumber - 1]
  const accentColor = getDayAccentColor(todayDay)

  const {
    currentStreak, longestStreak, totalWorkouts,
    completedThisWeekDayNumbers,
  } = useStreak(logs)

  const badges = useBadges(logs)

  const todayISODate = new Date().toISOString().slice(0, 10)
  const todayDone = logs.some(l => l.date === todayISODate && l.dayNumber === todayDayNumber)
  const nextDayNumber = (todayDayNumber % 7) + 1

  // Program complete
  const programStartDate = user?.user_metadata?.programStartDate || user?.created_at?.slice(0, 10) || null
  const logsThisCycle = programStartDate ? logs.filter(l => l.date >= programStartDate) : logs
  const isProgramComplete = [1,2,3,4,5,6,7].every(n => logsThisCycle.some(l => l.dayNumber === n))

  // Overdue
  const isOverdue = !todayDone && !isProgramComplete && totalWorkouts > 0 && currentStreak === 0
  const latestLogDate = logs.length > 0
    ? logs.reduce((max, l) => l.date > max ? l.date : max, logs[0].date)
    : null
  const daysSinceLast = latestLogDate
    ? Math.round((new Date() - new Date(latestLogDate + 'T12:00:00')) / 86400000)
    : 0

  const firstName = (user?.user_metadata?.display_name || user?.user_metadata?.full_name || '')
    .split(' ')[0] || null

  const [restarting, setRestarting] = useState(false)
  async function handleRestartProgram() {
    setRestarting(true)
    try { await supabase.auth.updateUser({ data: { programStartDate: new Date().toISOString().slice(0, 10) } }) }
    catch {}
    setRestarting(false)
  }

  return (
    <div style={{ backgroundColor: BG, minHeight: '100svh', paddingBottom: 'max(env(safe-area-inset-bottom), 96px)' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '52px 20px 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, color: MUTED, fontWeight: 500, marginBottom: 3 }}>
            {getGreeting()}{firstName ? `, ${firstName}` : ''}
          </p>
          <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: WHITE, lineHeight: 1, margin: 0 }}>
            StrongBase
          </h1>
        </div>
        <Avatar user={user} onClick={() => navigate('/profile')} />
      </div>

      {/* Offline / error banners */}
      {logsError && (
        <div style={{ margin: '0 16px 12px', padding: '10px 14px', backgroundColor: '#EF444415', borderRadius: 12, border: '1px solid #EF444430', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 13, color: '#FCA5A5', fontWeight: 600, margin: 0 }}>⚠️ Couldn't load your data</p>
          <button onClick={refetchLogs} style={{ fontSize: 12, fontWeight: 700, color: '#FCA5A5', background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button>
        </div>
      )}
      {syncing && (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#F59E0B', fontWeight: 600, marginBottom: 8 }}>
          ☁️ Syncing…
        </p>
      )}

      {/* ── Hero card ──────────────────────────────────────────────────────── */}
      {loading ? (
        // Skeleton
        <div style={{ margin: '0 16px', borderRadius: 24, backgroundColor: SURF, border: `1px solid ${C.border}`, height: 220, animation: 'pulse 1.5s ease-in-out infinite' }}>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
        </div>
      ) : (
        <HeroCard
          day={todayDay}
          dayNumber={todayDayNumber}
          accentColor={accentColor}
          todayDone={todayDone}
          isOverdue={isOverdue}
          daysSinceLast={daysSinceLast}
          isProgramComplete={isProgramComplete}
          onStart={() => navigate(`/day/${todayDayNumber}`)}
          onPreviewNext={() => navigate(`/day/${nextDayNumber}`)}
          nextDayNumber={nextDayNumber}
          onRestart={handleRestartProgram}
          restarting={restarting}
        />
      )}

      {/* ── Week dots ──────────────────────────────────────────────────────── */}
      <WeekDots
        days={weeklyPlan.days}
        todayDayNumber={todayDayNumber}
        completedThisWeekDayNumbers={completedThisWeekDayNumbers}
        onPress={n => navigate(`/day/${n}`)}
      />

      {/* ── Streak row ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 20px 8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🔥</span>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: WHITE, lineHeight: 1 }}>
            {currentStreak}
          </span>
          <span style={{ fontSize: 14, color: MUTED, fontWeight: 500 }}>
            day streak
          </span>
        </div>
        <span style={{ fontSize: 13, color: SUBTLE }}>
          {totalWorkouts} total · {longestStreak} best
        </span>
      </div>

      {/* ── Weekly volume trend ────────────────────────────────────────────── */}
      <VolumeTrend logs={logs} />

      {/* ── Badges ─────────────────────────────────────────────────────────── */}
      <BadgesRow badges={badges} />

      {/* ── Recent activity (compact) ──────────────────────────────────────── */}
      {logs.length > 0 && (
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: SUBTLE, textTransform: 'uppercase', margin: 0 }}>
              Recent
            </p>
            <button onClick={() => navigate('/history')} style={{ fontSize: 13, color: TEAL, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              See all →
            </button>
          </div>
          {logs.slice(0, 3).map(log => (
            <div key={log.id || log.date} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid rgba(51,65,85,0.4)',
            }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: WHITE, margin: 0 }}>{log.theme}</p>
                <p style={{ fontSize: 12, color: SUBTLE, margin: 0, marginTop: 1 }}>
                  Day {log.dayNumber} · {new Date(log.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>
                {log.totalTimeSeconds ? `${Math.round(log.totalTimeSeconds / 60)} min` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
