import { useNavigate } from 'react-router-dom'
import weeklyPlan from '../data/weeklyPlan.json'

const QUOTES = [
  "The hardest part is showing up. You already did that.",
  "Strong is built one rep at a time. Start today.",
  "Progress over perfection — every single day.",
  "Your future self is cheering you on right now.",
  "Consistency beats intensity. Show up, do the work."
]

function getTodayDayNumber() {
  // Monday=1, Tuesday=2, ..., Sunday=7
  const jsDay = new Date().getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  return jsDay === 0 ? 7 : jsDay
}

function getDailyQuote() {
  const dayOfYear = Math.floor(
    (new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  )
  return QUOTES[dayOfYear % QUOTES.length]
}

export default function Home() {
  const navigate = useNavigate()
  const todayDayNumber = getTodayDayNumber()
  const quote = getDailyQuote()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F172A' }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-6"
        style={{
          background: 'linear-gradient(180deg, #0D9488 0%, #0F172A 100%)'
        }}
      >
        <h1
          className="text-4xl font-extrabold text-white tracking-tight"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          StrongBase 💪
        </h1>
        <p className="mt-1 text-base font-medium" style={{ color: '#99F6E4' }}>
          Build the habit. Own the week.
        </p>
      </div>

      <div className="px-5 pb-10 space-y-6">
        {/* 7-Day Strip */}
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: '#94A3B8' }}
          >
            This Week
          </h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {weeklyPlan.days.map((day) => {
              const isToday = day.day === todayDayNumber
              return (
                <button
                  key={day.day}
                  onClick={() => navigate(`/day/${day.day}`)}
                  className="flex-shrink-0 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95"
                  style={{
                    width: 80,
                    minHeight: 90,
                    padding: '12px 8px',
                    backgroundColor: isToday ? '#14B8A6' : '#1E293B',
                    border: isToday ? '2px solid #14B8A6' : '2px solid #334155',
                    cursor: 'pointer'
                  }}
                >
                  <span className="text-xl mb-1">{day.emoji}</span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: isToday ? '#fff' : '#94A3B8' }}
                  >
                    Day {day.day}
                  </span>
                  <span
                    className="text-center mt-1 leading-tight"
                    style={{
                      fontSize: 9,
                      color: isToday ? '#CCFBF1' : '#64748B',
                      fontWeight: 600,
                      lineHeight: '1.2'
                    }}
                  >
                    {day.theme}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Today's Workout CTA */}
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
            <span className="text-4xl">
              {weeklyPlan.days[todayDayNumber - 1].emoji}
            </span>
          </div>
          <button
            onClick={() => navigate(`/day/${todayDayNumber}`)}
            className="w-full rounded-xl font-bold text-base text-white transition-all active:scale-95"
            style={{
              backgroundColor: '#14B8A6',
              minHeight: 52,
              padding: '14px 20px'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0D9488'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#14B8A6'}
          >
            ▶ Start Today's Workout
          </button>
        </section>

        {/* Streak */}
        <section
          className="rounded-xl p-4 flex items-center gap-4"
          style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}
        >
          <div
            className="rounded-full flex items-center justify-center flex-shrink-0"
            style={{ width: 52, height: 52, backgroundColor: '#0F172A' }}
          >
            <span className="text-2xl">🔥</span>
          </div>
          <div>
            <p className="text-lg font-bold text-white">Current Streak: 0 days</p>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              Complete today's workout to start your streak!
            </p>
          </div>
        </section>

        {/* Daily Quote */}
        <section
          className="rounded-xl p-5"
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderLeft: '3px solid #14B8A6'
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#14B8A6' }}>
            Daily Motivation
          </p>
          <p className="text-base font-medium text-white leading-relaxed italic">
            "{quote}"
          </p>
        </section>
      </div>
    </div>
  )
}
