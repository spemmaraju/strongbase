import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useWorkoutLogs from '../hooks/useWorkoutLogs'
import useStreak from '../hooks/useStreak'
import useMediaQuery from '../hooks/useMediaQuery'
import { Icon } from '../components/Icons'
import {
  buildHeatmapWeeks, groupLogsByWeek, getTopMuscles, getUniqueEquipment,
  formatDuration, formatDate, formatDateTime,
  getMonthIdx, MONTH_NAMES,
} from '../utils/workoutStats'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const K = {
  bg:      '#0a0e1a',
  card:    '#101828',
  inset:   '#16233a',
  border:  'rgba(255,255,255,0.06)',
  borderSt:'rgba(255,255,255,0.10)',
  pink:    '#ec4899',
  purple:  '#8b5cf6',
  violet:  '#c084fc',
  grad:    'linear-gradient(90deg, #ec4899, #8b5cf6)',
  gradD:   'linear-gradient(135deg, #ec4899, #8b5cf6)',
  amber:   '#f59e0b',
  teal:    '#2dd4bf',
  text:    '#f8fafc',
  muted:   '#94a3b8',
  subtle:  '#64748b',
  dim:     '#475569',
}

// ── Heatmap ────────────────────────────────────────────────────────────────

function HeatmapCell({ day, onTap }) {
  let bg, border
  if (day.isFuture)            { bg = 'transparent';         border = `1px solid ${K.border}` }
  else if (day.logs.length > 0){ bg = K.purple;              border = `1px solid rgba(139,92,246,0.5)` }
  else if (day.isToday)        { bg = K.inset;               border = `1px solid rgba(255,255,255,0.14)` }
  else                         { bg = K.inset;               border = `1px solid ${K.border}` }

  return (
    <div
      onClick={() => day.logs.length > 0 && onTap(day)}
      style={{
        width: 32, height: 32, borderRadius: 6,
        backgroundColor: bg, border,
        cursor: day.logs.length > 0 ? 'pointer' : 'default',
        flexShrink: 0, transition: 'transform 0.1s, opacity 0.1s',
      }}
      onMouseEnter={e => { if (day.logs.length > 0) e.currentTarget.style.transform = 'scale(1.15)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
    />
  )
}

function HeatmapTooltip({ day, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: K.card, borderRadius: 20,
          border: `1px solid ${K.borderSt}`,
          padding: 20, width: '100%', maxWidth: 300,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Icon name="streak" size={16} style={{ color: K.violet }} />
          <p style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: K.violet, letterSpacing: '0.1em' }}>
            {formatDate(day.date)}
          </p>
        </div>
        {day.logs.map((log, i) => (
          <div key={log.id || i} style={{ marginBottom: 10 }}>
            <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: K.text, margin: 0 }}>{log.theme}</p>
            <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.dim, letterSpacing: '0.06em', margin: 0, marginTop: 2 }}>
              {formatDateTime(log.completedAt)} · {formatDuration(log.totalTimeSeconds)}
            </p>
          </div>
        ))}
        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 10, minHeight: 40,
            background: K.inset, border: `1px solid ${K.border}`,
            borderRadius: 10, fontFamily: MONO, fontSize: 10, fontWeight: 700,
            color: K.subtle, cursor: 'pointer', letterSpacing: '0.1em',
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  )
}

function CalendarHeatmap({ weeks, onCellTap }) {
  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const MONTH_ROW_H = 16

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
      <div style={{ display: 'flex', gap: 4, minWidth: 'max-content' }}>
        {/* Day labels */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 4,
          paddingTop: MONTH_ROW_H + 4,
          position: 'sticky', left: 0,
          backgroundColor: K.card, zIndex: 1, marginRight: 2,
        }}>
          {DAY_LABELS.map((d, i) => (
            <div key={i} style={{ height: 32, display: 'flex', alignItems: 'center' }}>
              <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, width: 10 }}>{d}</span>
            </div>
          ))}
        </div>

        {/* Week columns */}
        {weeks.map((week, wi) => {
          const showMonth = wi === 0 || getMonthIdx(week.weekStart) !== getMonthIdx(weeks[wi - 1].weekStart)
          return (
            <div key={week.weekStart} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ height: MONTH_ROW_H, display: 'flex', alignItems: 'flex-end' }}>
                <span style={{
                  fontFamily: MONO, fontSize: 9, fontWeight: 700,
                  color: showMonth ? K.subtle : 'transparent',
                  whiteSpace: 'nowrap',
                }}>
                  {MONTH_NAMES[getMonthIdx(week.weekStart)]}
                </span>
              </div>
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

// ── Stats bar ──────────────────────────────────────────────────────────────

function StatBar({ totalWorkouts, currentStreak, longestStreak, thisMonthCount }) {
  const stats = [
    { value: totalWorkouts,  label: 'Total',   icon: 'trophy' },
    { value: currentStreak,  label: 'Streak',  icon: 'streak' },
    { value: longestStreak,  label: 'Best',    icon: 'badge'  },
    { value: thisMonthCount, label: 'Month',   icon: 'target' },
  ]
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      backgroundColor: K.card, borderRadius: 18,
      border: `1px solid ${K.borderSt}`, overflow: 'hidden',
    }}>
      {stats.map((s, i) => (
        <div key={i} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '16px 8px',
          borderRight: i < stats.length - 1 ? `1px solid ${K.border}` : 'none',
        }}>
          <Icon name={s.icon} size={16} style={{ color: K.violet, marginBottom: 6 }} />
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: K.text, lineHeight: 1 }}>{s.value}</span>
          <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 5 }}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Weekly cards ──────────────────────────────────────────────────────────

const EQUIPMENT_LABEL = {
  'bodyweight':      'Bodyweight',
  'yoga-mat':        'Mat',
  'resistance-band': 'Band',
  '10lb-dumbbells':  '10 lb',
  '15lb-dumbbells':  '15 lb',
}

function MiniDayStrip({ completedDayNumbers }) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {[1, 2, 3, 4, 5, 6, 7].map(d => (
        <div key={d} style={{
          width: 26, height: 26, borderRadius: '50%',
          background: completedDayNumbers.has(d) ? K.gradD : 'transparent',
          border: `1.5px solid ${completedDayNumbers.has(d) ? 'transparent' : K.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {completedDayNumbers.has(d) && (
            <Icon name="check" size={11} strokeWidth={3} style={{ color: '#fff' }} />
          )}
        </div>
      ))}
    </div>
  )
}

function WorkoutEntry({ log, navigate }) {
  const equipment = getUniqueEquipment(log.completedExerciseIds || [])
  const exercises = log.completedExerciseIds?.length || 0

  return (
    <button
      onClick={() => navigate(`/history/${log.id}`, { state: { log } })}
      style={{
        width: '100%', textAlign: 'left',
        backgroundColor: K.inset, border: `1px solid ${K.border}`,
        borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = K.borderSt}
      onMouseLeave={e => e.currentTarget.style.borderColor = K.border}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
        <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: K.text, margin: 0 }}>
          Day {log.dayNumber} — {log.theme}
        </p>
        <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.violet, flexShrink: 0, letterSpacing: '0.06em' }}>
          {formatDuration(log.totalTimeSeconds)}
        </span>
      </div>
      <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.08em', margin: 0, marginBottom: 8 }}>
        {formatDateTime(log.completedAt)} · {exercises} ex · {log.totalSets} sets
      </p>
      {equipment.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {equipment.map(eq => (
            <span key={eq} style={{
              backgroundColor: K.card, borderRadius: 99, padding: '3px 9px',
              fontFamily: MONO, fontSize: 9, fontWeight: 700,
              color: K.subtle, border: `1px solid ${K.border}`, letterSpacing: '0.06em',
            }}>{EQUIPMENT_LABEL[eq] || eq}</span>
          ))}
        </div>
      )}
    </button>
  )
}

function WeeklyCard({ weekStart, weekEnd, logs, navigate }) {
  const [expanded, setExpanded] = useState(false)
  const completedDayNumbers = new Set(logs.map(l => l.dayNumber))
  const totalTime  = logs.reduce((s, l) => s + (l.totalTimeSeconds || 0), 0)
  const allExIds   = logs.flatMap(l => l.completedExerciseIds || [])
  const topMuscles = getTopMuscles(allExIds)
  const weekLabel  = 'Week of ' + formatDate(weekStart)

  return (
    <div style={{ backgroundColor: K.card, borderRadius: 16, border: `1px solid ${K.borderSt}`, overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', textAlign: 'left', padding: 16, background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: K.text, margin: 0 }}>{weekLabel}</p>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={K.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        <MiniDayStrip completedDayNumbers={completedDayNumbers} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.08em' }}>
            {logs.length} OF 7 DAYS
          </span>
          <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.08em' }}>
            {formatDuration(totalTime)}
          </span>
          {topMuscles.map(m => (
            <span key={m} style={{
              fontFamily: MONO, fontSize: 9, fontWeight: 700,
              backgroundColor: 'rgba(139,92,246,0.1)', color: K.violet,
              border: '1px solid rgba(139,92,246,0.22)',
              borderRadius: 99, padding: '2px 8px', letterSpacing: '0.08em',
            }}>{m}</span>
          ))}
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${K.border}` }}>
          <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '12px 0 10px' }}>
            Workouts this week
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.map(log => <WorkoutEntry key={log.id} log={log} navigate={navigate} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ navigate }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '80px 24px 40px', textAlign: 'center',
    }}>
      <div style={{ marginBottom: 24, color: K.purple, opacity: 0.4 }}>
        <Icon name="trophy" size={72} strokeWidth={1} />
      </div>
      <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: K.text, marginBottom: 8 }}>
        No workouts yet
      </h2>
      <p style={{ fontSize: 14, color: K.subtle, maxWidth: 280, lineHeight: 1.6, marginBottom: 28 }}>
        Complete your first workout to start tracking your progress.
      </p>
      <button
        onClick={() => navigate('/workout/1')}
        style={{
          background: K.gradD, color: '#fff', border: 'none',
          borderRadius: 14, padding: '0 28px', minHeight: 52,
          fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: 'pointer',
        }}
      >
        Start Day 1 →
      </button>
    </div>
  )
}

function LoadingState() {
  const pulse = { backgroundColor: K.card, borderRadius: 14, animation: 'kPulse 1.5s ease-in-out infinite' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '20px 20px 0' }}>
      <style>{`@keyframes kPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div style={{ height: 140, ...pulse }} />
      <div style={{ height: 80, ...pulse }} />
      {[1, 2, 3].map(i => <div key={i} style={{ height: 100, ...pulse }} />)}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function History() {
  const navigate    = useNavigate()
  const isWide      = useMediaQuery('(min-width: 768px)')
  const { logs, loading, error: logsError, refetch: refetchLogs } = useWorkoutLogs()
  const [activeCell, setActiveCell] = useState(null)

  const { currentStreak, longestStreak, totalWorkouts } = useStreak(logs)
  const currentMonth  = new Date().toISOString().slice(0, 7)
  const thisMonthCount = logs.filter(l => l.date.startsWith(currentMonth)).length
  const weeksToShow   = totalWorkouts < 7 ? 4 : totalWorkouts < 20 ? 8 : 12
  const heatmapWeeks  = buildHeatmapWeeks(logs).slice(-weeksToShow)
  const weeklyGroups  = groupLogsByWeek(logs)

  return (
    <div style={{ backgroundColor: K.bg, minHeight: '100svh', color: K.text }}>

      {/* Header */}
      <div style={{
        padding: isWide ? '32px 28px 24px' : '52px 20px 20px',
        borderBottom: `1px solid ${K.border}`,
      }}>
        <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: K.text, margin: 0 }}>History</h1>
        <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.dim, letterSpacing: '0.1em', marginTop: 5 }}>
          {loading ? '…' : `${totalWorkouts} WORKOUT${totalWorkouts !== 1 ? 'S' : ''} COMPLETED`}
        </p>
      </div>

      {/* Error */}
      {logsError && (
        <div style={{
          margin: '12px 20px 0', padding: '10px 14px',
          backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 12,
          border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <p style={{ fontSize: 13, color: '#fca5a5', fontWeight: 600, margin: 0 }}>⚠️ Couldn't load data</p>
          <button onClick={refetchLogs} style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: '#fca5a5', background: 'none', border: 'none', cursor: 'pointer' }}>RETRY</button>
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : logs.length === 0 ? (
        <EmptyState navigate={navigate} />
      ) : isWide ? (
        /* ── Wide: two-column ──────────────────────────────────────────────── */
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 28, padding: '28px 28px 48px', alignItems: 'start' }}>

          {/* Left: stats sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <StatBar
              totalWorkouts={totalWorkouts}
              currentStreak={currentStreak}
              longestStreak={longestStreak}
              thisMonthCount={thisMonthCount}
            />

            {/* Heatmap */}
            <div style={{ backgroundColor: K.card, borderRadius: 18, border: `1px solid ${K.borderSt}`, padding: 18 }}>
              <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
                Last {weeksToShow} Weeks
              </p>
              <CalendarHeatmap weeks={heatmapWeeks} onCellTap={setActiveCell} />
              {/* Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: K.inset, border: `1px solid ${K.border}` }} />
                <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim }}>None</span>
                <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: K.purple }} />
                <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim }}>Done</span>
              </div>
            </div>
          </div>

          {/* Right: weekly cards */}
          <div>
            <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
              Weekly Summaries
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {weeklyGroups.map(wg => (
                <WeeklyCard key={wg.weekStart} weekStart={wg.weekStart} weekEnd={wg.weekEnd} logs={wg.logs} navigate={navigate} />
              ))}
            </div>
          </div>
        </div>

      ) : (
        /* ── Narrow: single column ─────────────────────────────────────────── */
        <div style={{ padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Heatmap */}
          <div style={{ backgroundColor: K.card, borderRadius: 18, border: `1px solid ${K.borderSt}`, padding: 16 }}>
            <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              Last {weeksToShow} Weeks
            </p>
            <CalendarHeatmap weeks={heatmapWeeks} onCellTap={setActiveCell} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: K.inset, border: `1px solid ${K.border}` }} />
              <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim }}>None</span>
              <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: K.purple }} />
              <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim }}>Done</span>
            </div>
          </div>

          <StatBar totalWorkouts={totalWorkouts} currentStreak={currentStreak} longestStreak={longestStreak} thisMonthCount={thisMonthCount} />

          <div>
            <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              Weekly Summaries
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {weeklyGroups.map(wg => (
                <WeeklyCard key={wg.weekStart} weekStart={wg.weekStart} weekEnd={wg.weekEnd} logs={wg.logs} navigate={navigate} />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeCell && <HeatmapTooltip day={activeCell} onClose={() => setActiveCell(null)} />}
    </div>
  )
}
