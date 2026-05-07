import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useWorkoutLogs from '../hooks/useWorkoutLogs'
import useStreak from '../hooks/useStreak'
import {
  buildHeatmapWeeks, groupLogsByWeek, getTopMuscles, getUniqueEquipment,
  formatDuration, formatDate, formatDateTime,
  getMonthIdx, MONTH_NAMES,
} from '../utils/workoutStats'

// ── Heatmap ────────────────────────────────────────────────────────────────

function HeatmapCell({ day, onTap }) {
  let bg = '#1E293B'
  if (day.isFuture) bg = '#0F172A'
  else if (day.isToday && day.logs.length === 0) bg = '#334155'
  else if (day.isToday && day.logs.length > 0) bg = '#0D9488'
  else if (day.logs.length > 0) bg = '#14B8A6'

  return (
    <div
      onClick={() => day.logs.length > 0 && onTap(day)}
      style={{
        width: 26, height: 26,
        borderRadius: 4,
        backgroundColor: bg,
        cursor: day.logs.length > 0 ? 'pointer' : 'default',
        flexShrink: 0,
        transition: 'transform 0.1s',
      }}
      onMouseEnter={e => { if (day.logs.length > 0) e.currentTarget.style.transform = 'scale(1.15)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
    />
  )
}

function HeatmapTooltip({ day, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-5 w-full"
        style={{
          backgroundColor: '#1E293B',
          border: '1px solid #14B8A6',
          maxWidth: 280,
        }}
        onClick={e => e.stopPropagation()}
      >
        <p className="text-sm font-bold mb-3" style={{ color: '#14B8A6' }}>
          📅 {formatDate(day.date)}
        </p>
        {day.logs.map((log, i) => (
          <div key={log.id || i} className="mb-2">
            <p className="text-base font-bold text-white">{log.theme}</p>
            <p className="text-xs" style={{ color: '#64748B' }}>
              {formatDateTime(log.completedAt)} · {formatDuration(log.totalTimeSeconds)}
            </p>
          </div>
        ))}
        <button
          onClick={onClose}
          className="w-full mt-3 text-sm font-semibold rounded-lg"
          style={{ minHeight: 40, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

function CalendarHeatmap({ weeks, onCellTap }) {
  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const MONTH_ROW_H = 18

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
      <div style={{ display: 'flex', gap: 4, minWidth: 'max-content' }}>
        {/* Day labels (sticky left) */}
        <div
          style={{
            display: 'flex', flexDirection: 'column', gap: 3,
            paddingTop: MONTH_ROW_H + 3,
            position: 'sticky', left: 0,
            backgroundColor: '#0F172A', zIndex: 1,
            marginRight: 2,
          }}
        >
          {DAY_LABELS.map((d, i) => (
            <div key={i} style={{ height: 26, display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', width: 10 }}>{d}</span>
            </div>
          ))}
        </div>

        {/* Week columns */}
        {weeks.map((week, wi) => {
          const showMonth = wi === 0 || getMonthIdx(week.weekStart) !== getMonthIdx(weeks[wi - 1].weekStart)
          return (
            <div key={week.weekStart} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Month label row */}
              <div style={{ height: MONTH_ROW_H, display: 'flex', alignItems: 'flex-end' }}>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: showMonth ? '#64748B' : 'transparent',
                  whiteSpace: 'nowrap',
                }}>
                  {MONTH_NAMES[getMonthIdx(week.weekStart)]}
                </span>
              </div>
              {/* Day cells */}
              {week.days.map(day => (
                <HeatmapCell key={day.date} day={day} onTap={onCellTap} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Stats summary bar ──────────────────────────────────────────────────────

function StatBar({ totalWorkouts, currentStreak, longestStreak, thisMonthCount }) {
  const chips = [
    { emoji: '📅', value: totalWorkouts, label: 'Total' },
    { emoji: '🔥', value: currentStreak,  label: 'Streak' },
    { emoji: '🏆', value: longestStreak,  label: 'Best' },
    { emoji: '⚡', value: thisMonthCount, label: 'Month' },
  ]
  return (
    <div
      className="flex rounded-xl overflow-hidden"
      style={{ border: '1px solid #334155' }}
    >
      {chips.map((c, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center py-3"
          style={{
            backgroundColor: '#1E293B',
            borderRight: i < chips.length - 1 ? '1px solid #334155' : 'none',
          }}
        >
          <span style={{ fontSize: 16 }}>{c.emoji}</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC', lineHeight: 1.2 }}>{c.value}</span>
          <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>{c.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Weekly summary card ────────────────────────────────────────────────────

const EQUIPMENT_LABEL = {
  'bodyweight': 'Bodyweight',
  'yoga-mat': 'Mat',
  'resistance-band': 'Band',
  '10lb-dumbbells': '10 lb',
  '15lb-dumbbells': '15 lb',
}

function EquipBadge({ eq }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: '#334155', color: '#94A3B8', whiteSpace: 'nowrap' }}
    >
      {EQUIPMENT_LABEL[eq] || eq}
    </span>
  )
}

function MiniDayStrip({ completedDayNumbers }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5, 6, 7].map(d => (
        <div
          key={d}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            backgroundColor: completedDayNumbers.has(d) ? '#14B8A6' : 'transparent',
            border: `2px solid ${completedDayNumbers.has(d) ? '#14B8A6' : '#334155'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {completedDayNumbers.has(d) && (
            <span style={{ fontSize: 10, color: '#fff', fontWeight: 800 }}>✓</span>
          )}
        </div>
      ))}
    </div>
  )
}

function WorkoutEntry({ log, navigate }) {
  const exercises = log.completedExerciseIds?.length || 0
  const equipment = getUniqueEquipment(log.completedExerciseIds || [])

  return (
    <button
      onClick={() => navigate(`/history/${log.id}`, { state: { log } })}
      className="w-full text-left rounded-xl p-4 transition-all active:scale-98"
      style={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#334155'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1E293B'}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-bold text-white">Day {log.dayNumber} — {log.theme}</p>
        <span className="text-xs font-semibold flex-shrink-0" style={{ color: '#14B8A6' }}>
          {formatDuration(log.totalTimeSeconds)}
        </span>
      </div>
      <p className="text-xs mb-2" style={{ color: '#64748B' }}>
        {formatDateTime(log.completedAt)} · {exercises} exercises · {log.totalSets} sets
      </p>
      {equipment.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {equipment.map(eq => <EquipBadge key={eq} eq={eq} />)}
        </div>
      )}
    </button>
  )
}

function WeeklyCard({ weekStart, weekEnd, logs, navigate }) {
  const [expanded, setExpanded] = useState(false)

  const completedDayNumbers = new Set(logs.map(l => l.dayNumber))
  const totalTime = logs.reduce((s, l) => s + (l.totalTimeSeconds || 0), 0)
  const allExIds = logs.flatMap(l => l.completedExerciseIds || [])
  const topMuscles = getTopMuscles(allExIds)

  // "Week of May 5"
  const weekLabel = 'Week of ' + formatDate(weekStart)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}
    >
      {/* Card header — tap to expand */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left p-4 transition-all active:scale-98"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-white">{weekLabel}</p>
          <span style={{ fontSize: 12, color: '#64748B', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            ▾
          </span>
        </div>

        <MiniDayStrip completedDayNumbers={completedDayNumbers} />

        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
            {logs.length} of 7 days
          </span>
          <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>
            ⏱ {formatDuration(totalTime)}
          </span>
          {topMuscles.length > 0 && (
            <span className="text-xs font-semibold" style={{ color: '#64748B' }}>
              💪 {topMuscles.join(' · ')}
            </span>
          )}
        </div>
      </button>

      {/* Expanded entries */}
      {expanded && (
        <div className="px-4 pb-4 space-y-2" style={{ borderTop: '1px solid #334155' }}>
          <p className="text-xs font-semibold uppercase tracking-widest pt-3" style={{ color: '#475569' }}>
            Workouts this week
          </p>
          {logs.map(log => (
            <WorkoutEntry key={log.id} log={log} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ navigate }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 text-center" style={{ paddingTop: 80 }}>
      {/* Simple SVG dumbbell illustration */}
      <svg width="96" height="64" viewBox="0 0 96 64" fill="none" style={{ marginBottom: 24 }}>
        <rect x="8" y="24" width="12" height="16" rx="4" stroke="#14B8A6" strokeWidth="2.5" fill="none" />
        <rect x="76" y="24" width="12" height="16" rx="4" stroke="#14B8A6" strokeWidth="2.5" fill="none" />
        <rect x="18" y="28" width="60" height="8" rx="3" stroke="#14B8A6" strokeWidth="2.5" fill="none" />
        <rect x="28" y="20" width="12" height="24" rx="4" stroke="#14B8A660" strokeWidth="2" fill="none" />
        <rect x="56" y="20" width="12" height="24" rx="4" stroke="#14B8A660" strokeWidth="2" fill="none" />
      </svg>
      <h2 className="text-2xl font-extrabold text-white mb-2">No workouts yet</h2>
      <p className="text-base mb-8" style={{ color: '#64748B', maxWidth: 280 }}>
        Complete your first workout to start tracking your progress.
      </p>
      <button
        onClick={() => navigate('/workout/1')}
        className="rounded-xl font-bold text-base text-white px-8 transition-all active:scale-95"
        style={{ minHeight: 56, backgroundColor: '#14B8A6', border: 'none', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0D9488'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#14B8A6'}
      >
        ▶ Start Day 1
      </button>
    </div>
  )
}

// ── Loading skeleton ───────────────────────────────────────────────────────

function LoadingState() {
  const pulse = { backgroundColor: '#1E293B', borderRadius: 8, animation: 'sbPulse 1.5s ease-in-out infinite' }
  return (
    <div className="px-5 space-y-5">
      <style>{`@keyframes sbPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
      <div style={{ height: 120, ...pulse, borderRadius: 12 }} />
      <div style={{ height: 72, ...pulse, borderRadius: 12 }} />
      {[1, 2, 3].map(i => <div key={i} style={{ height: 110, ...pulse, borderRadius: 12 }} />)}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function History() {
  const navigate = useNavigate()
  const { logs, loading, error: logsError, refetch: refetchLogs } = useWorkoutLogs()
  const [activeCell, setActiveCell] = useState(null)

  const { currentStreak, longestStreak, totalWorkouts } = useStreak(logs)

  const currentMonth = new Date().toISOString().slice(0, 7)
  const thisMonthCount = logs.filter(l => l.date.startsWith(currentMonth)).length

  const heatmapWeeks = buildHeatmapWeeks(logs)
  const weeklyGroups = groupLogsByWeek(logs)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F172A' }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-6"
        style={{ background: 'linear-gradient(180deg, #0D9488 0%, #0F172A 100%)' }}
      >
        <h1 className="text-4xl font-extrabold text-white tracking-tight">My History</h1>
        <p className="mt-1 text-base font-medium" style={{ color: '#99F6E4' }}>
          {loading ? '…' : `${totalWorkouts} workout${totalWorkouts !== 1 ? 's' : ''} completed`}
        </p>
      </div>

      {/* Error banner */}
      {logsError && (
        <div
          className="mx-5 mb-4 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
          style={{ backgroundColor: '#EF444415', border: '1px solid #EF444430' }}
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

      {loading ? (
        <LoadingState />
      ) : logs.length === 0 ? (
        <EmptyState navigate={navigate} />
      ) : (
        <div className="px-5 space-y-5">

          {/* ── Calendar Heatmap ─────────────────────────────────────────── */}
          <section
            className="rounded-xl p-4"
            style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>
              Last 12 Weeks
            </p>
            <CalendarHeatmap weeks={heatmapWeeks} onCellTap={setActiveCell} />
            {/* Legend */}
            <div className="flex items-center gap-3 mt-3">
              <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#1E293B', border: '1px solid #334155' }} />
              <span className="text-xs" style={{ color: '#475569' }}>None</span>
              <div style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#14B8A6' }} />
              <span className="text-xs" style={{ color: '#475569' }}>Done</span>
            </div>
          </section>

          {/* ── Stats bar ────────────────────────────────────────────────── */}
          <StatBar
            totalWorkouts={totalWorkouts}
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            thisMonthCount={thisMonthCount}
          />

          {/* ── Weekly summary cards ─────────────────────────────────────── */}
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#94A3B8' }}>
              Weekly Summaries
            </h2>
            <div className="space-y-3">
              {weeklyGroups.map(wg => (
                <WeeklyCard
                  key={wg.weekStart}
                  weekStart={wg.weekStart}
                  weekEnd={wg.weekEnd}
                  logs={wg.logs}
                  navigate={navigate}
                />
              ))}
            </div>
          </section>

        </div>
      )}

      {/* Heatmap cell tooltip */}
      {activeCell && <HeatmapTooltip day={activeCell} onClose={() => setActiveCell(null)} />}
    </div>
  )
}
