import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import weeklyPlan from '../data/weeklyPlan.json'
import useStreak from '../hooks/useStreak'
import useBadges from '../hooks/useBadges'

// ── Helpers ────────────────────────────────────────────────────────────────
const QUOTES = [
  "The hardest part is showing up. You already did that.",
  "Strong is built one rep at a time. Start today.",
  "Progress over perfection — every single day.",
  "Your future self is cheering you on right now.",
  "Consistency beats intensity. Show up, do the work.",
]

function getTodayDayNumber() {
  const jsDay = new Date().getDay() // 0=Sun
  return jsDay === 0 ? 7 : jsDay
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

// ── Sub-components ─────────────────────────────────────────────────────────

function WeeklyRing({ count, total = 7 }) {
  const SIZE = 130, STROKE = 8, RADIUS = (SIZE - STROKE) / 2
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
        <span style={{ fontSize: 28, fontWeight: 800, color: '#F8FAFC', lineHeight: 1 }}>{count}</span>
        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>/ {total}</span>
        <span style={{ fontSize: 9, color: '#64748B', fontWeight: 700, marginTop: 2, letterSpacing: '0.05em' }}>
          THIS WEEK
        </span>
      </div>
    </div>
  )
}

function StatChip({ emoji, value, label }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <span style={{ fontSize: 22, fontWeight: 800, color: '#F8FAFC', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

function BadgeCard({ badge, onTap }) {
  return (
    <button
      onClick={() => onTap(badge)}
      className="flex-shrink-0 flex flex-col items-center rounded-xl transition-all active:scale-95"
      style={{
        width: 76,
        padding: '12px 8px',
        backgroundColor: '#1E293B',
        border: `1px solid ${badge.earned ? '#334155' : '#1E293B'}`,
        cursor: 'pointer',
        position: 'relative',
        filter: badge.earned ? 'none' : 'grayscale(1)',
        opacity: badge.earned ? 1 : 0.4,
      }}
      aria-label={badge.name}
    >
      <span style={{ fontSize: 28 }}>{badge.emoji}</span>
      <span style={{
        fontSize: 9, fontWeight: 700, marginTop: 6, textAlign: 'center', lineHeight: 1.2,
        color: badge.earned ? '#F8FAFC' : '#94A3B8',
      }}>
        {badge.name}
      </span>
      {!badge.earned && (
        <span style={{
          position: 'absolute', top: 6, right: 6, fontSize: 10, opacity: 0.7,
        }}>🔒</span>
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

// ── Main component ─────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const todayDayNumber = getTodayDayNumber()
  const quote = getDailyQuote()
  const [tooltipBadge, setTooltipBadge] = useState(null)

  const {
    currentStreak,
    longestStreak,
    totalWorkouts,
    thisWeekCount,
    completedThisWeekDayNumbers,
  } = useStreak()

  const badges = useBadges()
  const bannerProps = getStreakBannerProps(currentStreak)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F172A' }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-6"
        style={{ background: 'linear-gradient(180deg, #0D9488 0%, #0F172A 100%)' }}
      >
        <h1 className="text-4xl font-extrabold text-white tracking-tight">StrongBase 💪</h1>
        <p className="mt-1 text-base font-medium" style={{ color: '#99F6E4' }}>
          Build the habit. Own the week.
        </p>
      </div>

      <div className="px-5 pb-12 space-y-5">

        {/* ── Streak Banner ──────────────────────────────────────────────── */}
        <section
          className="rounded-xl px-5 py-4"
          style={{
            backgroundColor: '#1E293B',
            border: `2px solid ${bannerProps.borderColor}`,
            boxShadow: bannerProps.glow === 'gold'
              ? '0 0 16px 2px #F59E0B40'
              : bannerProps.glow === 'teal'
              ? '0 0 16px 2px #14B8A640'
              : 'none',
          }}
        >
          <p className="text-base font-bold text-white">{bannerProps.text}</p>
          {currentStreak === 0 && (
            <p className="text-sm mt-1" style={{ color: '#64748B' }}>
              Complete today's workout to begin.
            </p>
          )}
        </section>

        {/* ── Weekly Ring + Stats ────────────────────────────────────────── */}
        <section
          className="rounded-xl p-5"
          style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}
        >
          <div className="flex items-center gap-5">
            <WeeklyRing count={thisWeekCount} />
            <div className="flex flex-col gap-4 flex-1">
              <StatChip emoji="🔥" value={currentStreak} label="day streak" />
              <StatChip emoji="✅" value={totalWorkouts} label="workouts done" />
              <StatChip emoji="🏆" value={longestStreak} label="best streak" />
            </div>
          </div>
        </section>

        {/* ── 7-Day Strip ───────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>
            This Week
          </h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {weeklyPlan.days.map((day) => {
              const isToday = day.day === todayDayNumber
              const isPast = day.day < todayDayNumber
              const isCompleted = completedThisWeekDayNumbers.has(day.day)

              let bgColor = '#1E293B'
              let borderColor = '#334155'
              let cardOpacity = 1

              if (isToday) {
                bgColor = '#14B8A6'
                borderColor = '#14B8A6'
              } else if (isCompleted) {
                bgColor = '#14B8A615'
                borderColor = '#14B8A650'
              } else if (isPast) {
                cardOpacity = 0.6
              }

              return (
                <button
                  key={day.day}
                  onClick={() => navigate(`/day/${day.day}`)}
                  className="flex-shrink-0 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95"
                  style={{
                    width: 80,
                    minHeight: 96,
                    padding: '10px 8px',
                    backgroundColor: bgColor,
                    border: `2px solid ${borderColor}`,
                    cursor: 'pointer',
                    opacity: cardOpacity,
                    position: 'relative',
                  }}
                >
                  {/* Completion checkmark badge */}
                  {isCompleted && (
                    <div style={{
                      position: 'absolute', top: 5, right: 5,
                      width: 16, height: 16, borderRadius: '50%',
                      backgroundColor: '#14B8A6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 9, color: '#fff', fontWeight: 800 }}>✓</span>
                    </div>
                  )}
                  <span className="text-xl mb-1">{day.emoji}</span>
                  <span className="text-xs font-bold" style={{ color: isToday ? '#fff' : '#94A3B8' }}>
                    Day {day.day}
                  </span>
                  <span className="text-center mt-1" style={{
                    fontSize: 9, color: isToday ? '#CCFBF1' : '#64748B',
                    fontWeight: 600, lineHeight: '1.2',
                  }}>
                    {day.theme}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Today's CTA ───────────────────────────────────────────────── */}
        <section
          className="rounded-xl p-5"
          style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
                Today's Workout
              </p>
              <p className="text-lg font-bold text-white mt-0.5">
                Day {todayDayNumber} — {weeklyPlan.days[todayDayNumber - 1].theme}
              </p>
              <p className="text-sm mt-0.5" style={{ color: '#94A3B8' }}>
                ⏱ {weeklyPlan.days[todayDayNumber - 1].durationMinutes} min
              </p>
            </div>
            <span className="text-4xl">{weeklyPlan.days[todayDayNumber - 1].emoji}</span>
          </div>
          <button
            onClick={() => navigate(`/day/${todayDayNumber}`)}
            className="w-full rounded-xl font-bold text-base text-white transition-all active:scale-95"
            style={{ backgroundColor: '#14B8A6', minHeight: 52, padding: '14px 20px', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0D9488'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#14B8A6'}
          >
            ▶ Start Today's Workout
          </button>
        </section>

        {/* ── Badges ────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>
            Badges
          </h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {badges.map(b => (
              <BadgeCard key={b.id} badge={b} onTap={setTooltipBadge} />
            ))}
          </div>
        </section>

        {/* ── Daily Quote ───────────────────────────────────────────────── */}
        <section
          className="rounded-xl p-5"
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderLeft: '3px solid #14B8A6',
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#14B8A6' }}>
            Daily Motivation
          </p>
          <p className="text-base font-medium text-white leading-relaxed italic">"{quote}"</p>
        </section>

      </div>

      {/* Badge tooltip overlay */}
      {tooltipBadge && <BadgeTooltip badge={tooltipBadge} onClose={() => setTooltipBadge(null)} />}
    </div>
  )
}
