import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import weeklyPlan from '../data/weeklyPlan.json'
import useStreak from '../hooks/useStreak'
import useBadges from '../hooks/useBadges'
import useWorkoutLogs from '../hooks/useWorkoutLogs'
import useAuth from '../hooks/useAuth'
import { formatDuration, formatDate, getDayComposition, getDayEquipment, CAT_COLORS, CAT_LABELS, EQUIP_DISPLAY, getProgramDayNumber } from '../utils/workoutStats'
import exercisesData from '../data/exercises.json'

// ── Helpers ────────────────────────────────────────────────────────────────
const QUOTES = [
  "The hardest part is showing up. You already did that.",
  "Strong is built one rep at a time. Start today.",
  "Progress over perfection — every single day.",
  "Your future self is cheering you on right now.",
  "Consistency beats intensity. Show up, do the work.",
]

// getDayAccentColor — derives the category dot colour for a day card
function getDayAccentColor(day) {
  const exMap = Object.fromEntries(exercisesData.map(e => [e.id, e]))
  const exercises = day.exerciseIds.map(id => exMap[id]).filter(Boolean)
  const counts = {}
  exercises.forEach(ex => {
    if (ex.category !== 'warm-up' && ex.category !== 'flexibility') {
      counts[ex.category] = (counts[ex.category] || 0) + 1
    }
  })
  if (Object.keys(counts).length === 0) return CAT_COLORS['flexibility'] || '#22C55E'
  const primary = Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0]
  return CAT_COLORS[primary] || '#14B8A6'
}

function getDailyQuote() {
  const dayOfYear = Math.floor(
    (new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  )
  return QUOTES[dayOfYear % QUOTES.length]
}

function getStreakBannerProps(streak) {
  if (streak === 0)
    return { text: 'Start your streak today 💪', borderColor: '#334155', glow: false }
  if (streak === 1)
    return { text: '🔥 1 day streak — you showed up!', borderColor: '#334155', glow: false }
  if (streak < 7)
    return { text: `🔥 ${streak} day streak — keep it going!`, borderColor: '#334155', glow: false }
  if (streak === 7)
    return { text: '🏆 7-day streak — you crushed the whole week!', borderColor: '#F59E0B', glow: 'gold' }
  return { text: `🔥 ${streak} day streak — unstoppable!`, borderColor: '#14B8A6', glow: 'teal' }
}

// ── Skeleton components ────────────────────────────────────────────────────
const pulseStyle = {
  backgroundColor: '#1E293B',
  borderRadius: 8,
  animation: 'sbPulse 1.5s ease-in-out infinite',
}

function SkeletonBlock({ height, width = '100%', radius = 8, style = {} }) {
  return (
    <div style={{ height, width, borderRadius: radius, ...pulseStyle, ...style }} />
  )
}

function SkeletonHome() {
  return (
    <div className="px-5 pb-12 space-y-5">
      <style>{`@keyframes sbPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
      {/* Streak banner skeleton */}
      <SkeletonBlock height={64} radius={12} />
      {/* Ring + stats skeleton */}
      <div className="rounded-xl p-5" style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}>
        <div className="flex items-center gap-5">
          <div style={{ width: 130, height: 130, borderRadius: '50%', flexShrink: 0, ...pulseStyle }} />
          <div className="flex flex-col gap-4 flex-1">
            <SkeletonBlock height={20} width="60%" />
            <SkeletonBlock height={20} width="70%" />
            <SkeletonBlock height={20} width="50%" />
          </div>
        </div>
      </div>
      {/* Day strip skeleton */}
      <div className="flex gap-3">
        {[1,2,3,4,5].map(i => <SkeletonBlock key={i} height={96} width={80} radius={12} />)}
      </div>
      {/* CTA skeleton */}
      <SkeletonBlock height={130} radius={12} />
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function WeeklyRing({ count, total = 7 }) {
  const SIZE = 80, STROKE = 7, RADIUS = (SIZE - STROKE) / 2
  const CIRC = 2 * Math.PI * RADIUS
  const offset = CIRC * (1 - Math.min(count / total, 1))
  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
      <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#334155" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          fill="none" stroke="#14B8A6" strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC', lineHeight: 1 }}>{count}</span>
        <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>/ {total}</span>
      </div>
    </div>
  )
}

function StatRow({ value, label }) {
  return (
    <div className="flex flex-col">
      <span style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>{label}</span>
    </div>
  )
}

function BadgeCard({ badge, onTap }) {
  return (
    <button
      onClick={() => onTap(badge)}
      className="flex-shrink-0 flex flex-col items-center rounded-2xl transition-all active:scale-95"
      style={{
        width: 80,
        minHeight: 88,
        padding: '14px 10px',
        backgroundColor: '#1E293B',
        border: `1px solid ${badge.earned ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
        cursor: 'pointer',
        position: 'relative',
        filter: badge.earned ? 'none' : 'grayscale(1)',
        opacity: badge.earned ? 1 : 0.4,
      }}
      aria-label={badge.name}
    >
      <span style={{ fontSize: 28 }}>{badge.emoji}</span>
      <span style={{
        fontSize: 10, fontWeight: 600, marginTop: 6, textAlign: 'center', lineHeight: 1.3,
        color: badge.earned ? '#F8FAFC' : '#94A3B8',
        display: 'block',
      }}>
        {badge.name}
      </span>
      {!badge.earned && (
        <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 10, opacity: 0.7 }}>🔒</span>
      )}
    </button>
  )
}

function BadgeTooltip({ badge, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-6 text-center"
        style={{
          backgroundColor: '#1E293B',
          border: `1px solid ${badge.earned ? '#14B8A6' : '#334155'}`,
          maxWidth: 280,
          width: '100%',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          fontSize: 52,
          filter: badge.earned ? 'none' : 'grayscale(1)',
          opacity: badge.earned ? 1 : 0.5,
          marginBottom: 12,
        }}>
          {badge.emoji}
        </div>
        <p className="text-lg font-bold text-white mb-1">{badge.name}</p>
        <p className="text-sm" style={{ color: '#94A3B8' }}>{badge.condition}</p>
        <span
          className="inline-block mt-4 text-xs font-bold px-3 py-1 rounded-full"
          style={badge.earned
            ? { backgroundColor: '#14B8A620', color: '#14B8A6' }
            : { backgroundColor: '#33415540', color: '#64748B' }}
        >
          {badge.earned ? '✓ Earned' : '🔒 Locked'}
        </span>
        <button
          onClick={onClose}
          className="block w-full mt-4 text-sm font-semibold rounded-lg"
          style={{ minHeight: 44, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ── User avatar / sign-out menu ────────────────────────────────────────────
function UserMenu({ user, onSignOut }) {
  const [open, setOpen] = useState(false)
  const initials = (user.email || '?').slice(0, 2).toUpperCase()

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-center rounded-full font-bold text-sm transition-all active:scale-95"
        style={{
          width: 40, height: 40,
          backgroundColor: '#14B8A620',
          color: '#14B8A6',
          border: '2px solid #14B8A660',
          cursor: 'pointer',
          letterSpacing: '0.05em',
        }}
        aria-label="Account menu"
      >
        {initials}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div
            className="absolute right-0 rounded-xl z-50 overflow-hidden"
            style={{
              top: 48,
              minWidth: 180,
              backgroundColor: '#1E293B',
              border: '1px solid #334155',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: '#334155' }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#64748B' }}>
                Signed in as
              </p>
              <p className="text-sm font-semibold text-white mt-0.5 truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={() => { setOpen(false); onSignOut() }}
              className="w-full text-left px-4 py-3 text-sm font-semibold transition-all"
              style={{ color: '#FCA5A5', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EF444415'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const todayDayNumber = getProgramDayNumber(user)
  const quote = getDailyQuote()
  const [tooltipBadge, setTooltipBadge] = useState(null)

  const { logs, loading, syncing, error: logsError, refetch: refetchLogs } = useWorkoutLogs()

  // Today's Focus card data
  const todayDay = weeklyPlan.days[todayDayNumber - 1]
  const todayComp = getDayComposition(todayDay)
  const todayEquip = getDayEquipment(todayDay)
  const todayISODate = new Date().toISOString().slice(0, 10)
  const todayDone = logs.some(l => l.date === todayISODate && l.dayNumber === todayDayNumber)
  const nextDayNumber = (todayDayNumber % 7) + 1

  // Streak/workout counts must come BEFORE the card-state derivations below
  const {
    currentStreak,
    longestStreak,
    totalWorkouts,
    thisWeekCount,
    completedThisWeekDayNumbers,
  } = useStreak(logs)

  // Context-aware card state
  // No day is a true "rest day" — Day 4 is active recovery (it still has exercises)
  const isRestDay = false
  const isOverdue = !todayDone && !isRestDay && totalWorkouts > 0 && currentStreak === 0
  // Use reduce so we aren't assuming logs are sorted newest-first
  const latestLogDate = logs.length > 0
    ? logs.reduce((max, l) => (l.date > max ? l.date : max), logs[0].date)
    : null
  const daysSinceLast = latestLogDate
    ? Math.round((new Date() - new Date(latestLogDate + 'T12:00:00')) / 86400000)
    : 0

  const badges = useBadges(logs)
  const bannerProps = getStreakBannerProps(currentStreak)

  // Program-complete detection: all 7 days logged since this cycle's start date
  const programStartDate = user?.user_metadata?.programStartDate
    || user?.created_at?.slice(0, 10)
    || null
  const logsThisCycle = programStartDate
    ? logs.filter(l => l.date >= programStartDate)
    : logs
  const isProgramComplete = [1, 2, 3, 4, 5, 6, 7].every(
    n => logsThisCycle.some(l => l.dayNumber === n)
  )

  const [restarting, setRestarting] = useState(false)
  async function handleRestartProgram() {
    setRestarting(true)
    const today = new Date().toISOString().slice(0, 10)
    try {
      await supabase.auth.updateUser({ data: { programStartDate: today } })
      // onAuthStateChange will fire USER_UPDATED and refresh user in useAuth,
      // which will cause getProgramDayNumber to return 1. No reload needed.
    } catch (e) {
      console.error('Failed to reset program start date:', e)
    }
    setRestarting(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F172A' }}>
      {/* Header — flat dark, teal 2px bottom border */}
      <div
        className="px-5 pt-12 pb-5 flex items-end justify-between"
        style={{ backgroundColor: '#0F172A', borderBottom: '2px solid #14B8A6' }}
      >
        <div>
          <h1 className="text-3xl font-bold text-white">StrongBase 💪</h1>
          <p className="mt-1 text-sm" style={{ color: '#94A3B8' }}>
            Build the habit. Own the week.
          </p>
        </div>
        {user && (
          <div style={{ marginRight: 0 }}>
            <UserMenu user={user} onSignOut={handleSignOut} />
          </div>
        )}
      </div>

      {/* Error banner */}
      {logsError && (
        <div
          className="px-5 py-2 flex items-center justify-between gap-3"
          style={{ backgroundColor: '#EF444415', borderBottom: '1px solid #EF444430' }}
        >
          <p className="text-sm font-medium" style={{ color: '#FCA5A5' }}>
            ⚠️ Couldn't load your data. Check your connection.
          </p>
          <button
            onClick={refetchLogs}
            className="text-xs font-bold px-3 py-1 rounded-lg flex-shrink-0"
            style={{ backgroundColor: '#EF444425', color: '#FCA5A5', border: '1px solid #EF444440', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Offline sync banner */}
      {syncing && (
        <div
          className="px-5 py-2 text-sm font-semibold text-center"
          style={{ backgroundColor: '#F59E0B20', color: '#F59E0B', borderBottom: '1px solid #F59E0B30' }}
        >
          ☁️ Syncing offline workouts…
        </div>
      )}

      {/* Main content */}
      {loading ? (
        <SkeletonHome />
      ) : (
        <div className="px-5 pt-5 pb-12 space-y-5">

          {/* ── Streak Banner ──────────────────────────────────────────────── */}
          <section
            className="rounded-2xl px-5 py-4"
            style={{
              backgroundColor: '#1E293B',
              border: currentStreak >= 7
                ? '1px solid rgba(245,158,11,0.3)'
                : '1px solid rgba(255,255,255,0.06)',
              boxShadow: bannerProps.glow === 'gold'
                ? '0 0 16px 2px #F59E0B40'
                : bannerProps.glow === 'teal'
                ? '0 0 16px 2px #14B8A640'
                : '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {currentStreak === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', marginBottom: 2 }}>
                    Day 1 starts today
                  </p>
                  <p style={{ fontSize: 13, color: '#64748B' }}>Complete a workout to begin your streak</p>
                </div>
                <span style={{ fontSize: 32 }}>🔥</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 48,
                      color: '#F8FAFC',
                      lineHeight: 1,
                      margin: 0,
                    }}
                  >
                    {currentStreak}
                  </p>
                  <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>day streak</p>
                </div>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="0">
                  <path d="M12 2C12 2 6 8 6 13a6 6 0 0012 0c0-5-6-11-6-11zm0 17a4 4 0 01-4-4c0-2.5 2-5.5 4-8 2 2.5 4 5.5 4 8a4 4 0 01-4 4z"/>
                </svg>
              </div>
            )}
          </section>

          {/* ── Weekly Ring + Stats ────────────────────────────────────────── */}
          <section
            className="rounded-2xl p-5"
            style={{
              backgroundColor: '#1E293B',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: '#94A3B8', borderLeft: '2px solid #0D9488', paddingLeft: 8 }}>
              Weekly Progress
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <WeeklyRing count={thisWeekCount} />
              <div style={{ display: 'flex', flex: 1, justifyContent: 'space-around' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: '#F8FAFC', lineHeight: 1 }}>{totalWorkouts}</span>
                  <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Total</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: '#F8FAFC', lineHeight: 1 }}>{longestStreak}</span>
                  <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>Best</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── 7-Day Strip ───────────────────────────────────────────────── */}
          <section>
            <h2
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: '#94A3B8', borderLeft: '2px solid #0D9488', paddingLeft: 8 }}
            >
              This Week
            </h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {weeklyPlan.days.map((day) => {
                const isToday = day.day === todayDayNumber
                const isPast = day.day < todayDayNumber
                const isCompleted = completedThisWeekDayNumbers.has(day.day)

                let bgColor = '#1E293B'
                let borderColor = 'rgba(255,255,255,0.06)'
                let cardOpacity = 1

                if (isToday) {
                  bgColor = '#14B8A6'
                  borderColor = '#14B8A6'
                } else if (isCompleted) {
                  bgColor = '#14B8A615'
                  borderColor = '#14B8A650'
                } else if (isPast) {
                  cardOpacity = 0.55
                }

                return (
                  <button
                    key={day.day}
                    onClick={() => navigate(`/day/${day.day}`)}
                    className="flex-shrink-0 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95"
                    style={{
                      width: 80,
                      minHeight: 90,
                      padding: '10px 8px',
                      backgroundColor: bgColor,
                      border: `1px solid ${borderColor}`,
                      cursor: 'pointer',
                      opacity: cardOpacity,
                      position: 'relative',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                  >
                    {isCompleted && !isToday && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 16, height: 16, borderRadius: '50%',
                        backgroundColor: '#14B8A6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 9, color: '#fff', fontWeight: 800 }}>✓</span>
                      </div>
                    )}
                    {/* Color category dot — derived from day's exercise categories */}
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', marginBottom: 4,
                      backgroundColor: isToday ? '#fff' : getDayAccentColor(day),
                    }} />
                    <span className="text-xs font-bold" style={{ color: isToday ? '#fff' : '#94A3B8' }}>
                      Day {day.day}
                    </span>
                    <span
                      className="text-center mt-1 leading-tight"
                      style={{
                        fontSize: 9, color: isToday ? '#CCFBF1' : '#64748B',
                        fontWeight: 600,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        maxWidth: '100%',
                      }}
                    >
                      {day.theme}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Today's Focus — context-aware states ──────────────────────── */}
          {isProgramComplete ? (
            /* STATE 0: Full 7-day program complete — show restart + Week 2 teaser */
            <section className="rounded-2xl p-5" style={{ backgroundColor: '#1E293B', border: '1px solid rgba(245,158,11,0.25)', borderLeft: '4px solid #F59E0B', boxShadow: '0 0 20px 2px #F59E0B20' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#F59E0B', borderLeft: '2px solid #F59E0B', paddingLeft: 8 }}>Program Complete</p>
                  <p className="text-xl font-extrabold text-white leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Week 1 — Done! 🏆</p>
                  <p className="text-xs mt-1" style={{ color: '#64748B' }}>You completed all 7 days. That's the foundation built.</p>
                </div>
                <span className="text-4xl flex-shrink-0 ml-3">🏆</span>
              </div>

              {/* Week 2 teaser */}
              <div style={{ backgroundColor: '#0F172A', borderRadius: 12, padding: '12px 14px', marginBottom: 14, border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>🔒</span>
                <div>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: '#94A3B8', margin: 0 }}>Week 2 — Progressive Load</p>
                  <p style={{ fontSize: 11, color: '#475569', margin: 0, marginTop: 2 }}>+1 set per exercise · coming soon</p>
                </div>
              </div>

              <button
                onClick={handleRestartProgram}
                disabled={restarting}
                className="w-full rounded-xl font-bold text-base transition-all active:scale-95"
                style={{ minHeight: 52, backgroundColor: restarting ? '#334155' : '#F59E0B', color: restarting ? '#64748B' : '#0F172A', border: 'none', cursor: restarting ? 'default' : 'pointer' }}
                onMouseEnter={e => { if (!restarting) e.currentTarget.style.backgroundColor = '#D97706' }}
                onMouseLeave={e => { if (!restarting) e.currentTarget.style.backgroundColor = '#F59E0B' }}
              >
                {restarting ? 'Updating…' : 'Restart Week 1 →'}
              </button>
            </section>

          ) : todayDone ? (
            /* STATE 1: Already done today */
            <section className="rounded-2xl p-5" style={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '4px solid #14B8A6', boxShadow: '0 0 16px 2px #14B8A620' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: '#14B8A6' }}>✅ Workout Complete</p>
              <p className="text-lg font-bold text-white mb-1">Day {todayDayNumber} — {todayDay.theme}</p>
              <p className="text-3xl font-extrabold mb-5" style={{ color: '#14B8A6' }}>🔥 {currentStreak} day streak!</p>
              <button onClick={() => navigate(`/day/${nextDayNumber}`)} className="text-sm font-semibold" style={{ color: '#14B8A6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                → Preview Day {nextDayNumber}
              </button>
            </section>

          ) : isRestDay ? (
            /* STATE 2: Active recovery day */
            <section className="rounded-2xl p-5" style={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', borderLeft: '4px solid #22C55E', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#22C55E', borderLeft: '2px solid #22C55E', paddingLeft: 8 }}>Rest & Recover</p>
                  <p className="text-lg font-bold text-white leading-tight">Day 4 — Active Recovery</p>
                  <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>Light mobility only — your muscles are rebuilding</p>
                </div>
                <span className="text-4xl flex-shrink-0 ml-3">🧘</span>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => navigate('/day/4')}
                  className="flex-1 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
                  style={{ minHeight: 48, backgroundColor: '#22C55E', border: 'none', cursor: 'pointer' }}
                >
                  Start Recovery
                </button>
                <button
                  onClick={() => navigate(`/day/${nextDayNumber}`)}
                  className="rounded-xl font-semibold text-sm transition-all active:scale-95"
                  style={{ minHeight: 48, paddingLeft: 16, paddingRight: 16, backgroundColor: '#1E3A2E', color: '#22C55E', border: '1px solid #22C55E40', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Preview Day {nextDayNumber} →
                </button>
              </div>
            </section>

          ) : isOverdue ? (
            /* STATE 3: Comeback — streak broken, hasn't worked out in 2+ days */
            <section className="rounded-2xl p-5" style={{ backgroundColor: '#1E293B', border: '1px solid rgba(245,158,11,0.2)', borderLeft: '4px solid #F59E0B', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#F59E0B', borderLeft: '2px solid #F59E0B', paddingLeft: 8 }}>
                    {daysSinceLast === 1 ? 'Back at it?' : `${daysSinceLast} days since your last workout`}
                  </p>
                  <p className="text-lg font-bold text-white leading-tight">Day {todayDayNumber} — {todayDay.theme}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>Pick up where you left off — every rep counts</p>
                </div>
                <span className="text-4xl flex-shrink-0 ml-3">⚡</span>
              </div>
              <button
                onClick={() => navigate(`/day/${todayDayNumber}`)}
                className="w-full rounded-xl font-bold text-base text-white transition-all active:scale-95"
                style={{ minHeight: 52, backgroundColor: '#F59E0B', border: 'none', cursor: 'pointer', marginTop: 4 }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#D97706'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F59E0B'}
              >
                Get Back to It
              </button>
            </section>

          ) : (
            /* STATE 4: Normal — start today's workout */
            <section className="rounded-2xl p-5" style={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#94A3B8', borderLeft: '2px solid #0D9488', paddingLeft: 8 }}>Today's Focus</p>
                  <p className="text-lg font-bold text-white mt-0.5 leading-tight">Day {todayDayNumber} — {todayDay.theme}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>{todayDay.focusArea}</p>
                </div>
                <span className="text-4xl flex-shrink-0 ml-3">{todayDay.emoji}</span>
              </div>

              {todayComp.total > 0 && (
                <div className="mb-3">
                  <div style={{ display: 'flex', height: 6, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
                    {Object.entries(todayComp.counts).filter(([, n]) => n > 0).map(([cat, n]) => (
                      <div key={cat} title={CAT_LABELS[cat]} style={{ flex: n / todayComp.total, backgroundColor: CAT_COLORS[cat] || '#475569', borderRadius: 2 }} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    {Object.entries(todayComp.counts).filter(([, n]) => n > 0).map(([cat, n]) => (
                      <span key={cat} className="text-xs font-medium flex items-center gap-1">
                        <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: CAT_COLORS[cat], display: 'inline-block' }} />
                        <span style={{ color: '#64748B' }}>{CAT_LABELS[cat]} ({n})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#334155', color: '#94A3B8' }}>⏱ ~{todayDay.durationMinutes} min</span>
                {todayEquip.map(eq => (
                  <span key={eq} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#334155', color: '#94A3B8' }}>
                    {EQUIP_DISPLAY[eq]?.label || eq.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>

              <button
                onClick={() => navigate(`/day/${todayDayNumber}`)}
                className="w-full rounded-xl font-bold text-base text-white transition-all active:scale-95"
                style={{ backgroundColor: '#14B8A6', minHeight: 52, border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0D9488'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#14B8A6'}
              >
                Start Workout
              </button>
            </section>
          )}

          {/* ── Badges ────────────────────────────────────────────────────── */}
          <section>
            <h2
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: '#94A3B8', borderLeft: '2px solid #0D9488', paddingLeft: 8 }}
            >
              Badges
            </h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {badges.map(b => (
                <BadgeCard key={b.id} badge={b} onTap={setTooltipBadge} />
              ))}
            </div>
          </section>

          {/* ── Daily Quote ───────────────────────────────────────────────── */}
          <div style={{ paddingTop: 16, paddingBottom: 16, borderLeft: '2px solid #134E4A', paddingLeft: 16 }}>
            <p className="text-base font-medium text-white leading-relaxed italic">"{quote}"</p>
          </div>

          {/* ── Recent Activity ───────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: '#94A3B8', borderLeft: '2px solid #0D9488', paddingLeft: 8 }}
              >
                Recent Activity
              </h2>
              <button
                onClick={() => navigate('/history')}
                className="text-xs font-semibold"
                style={{ color: '#14B8A6', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                See all →
              </button>
            </div>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {logs.length === 0 ? (
                <p className="text-sm text-center py-5" style={{ color: '#64748B' }}>
                  No workouts yet — start today! 💪
                </p>
              ) : (
                logs.slice(0, 3).map((log, i) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between"
                    style={{
                      paddingLeft: 16, paddingRight: 16,
                      paddingTop: 14, paddingBottom: 14,
                      borderBottom: i < Math.min(logs.length, 3) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white leading-tight truncate">{log.theme}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                        Day {log.dayNumber} · {formatDate(log.date)}
                      </p>
                    </div>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: '#94A3B8', flexShrink: 0, marginLeft: 12, whiteSpace: 'nowrap' }}
                    >
                      {formatDuration(log.totalTimeSeconds)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      )}

      {/* Badge tooltip overlay */}
      {tooltipBadge && <BadgeTooltip badge={tooltipBadge} onClose={() => setTooltipBadge(null)} />}
    </div>
  )
}
