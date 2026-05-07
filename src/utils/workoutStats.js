import exercisesData from '../data/exercises.json'
import { getMondayStr, dateAddDays } from '../hooks/useStreak'

// Fast lookup map: exercise id → exercise object
const EX_MAP = Object.fromEntries(exercisesData.map(e => [e.id, e]))

// ── Muscle analysis ────────────────────────────────────────────────────────
export function getTopMuscles(exerciseIds, topN = 3) {
  const count = {}
  exerciseIds.forEach(id => {
    const ex = EX_MAP[id]
    if (ex) ex.targetMuscles.forEach(m => { count[m] = (count[m] || 0) + 1 })
  })
  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([m]) => m)
}

// ── Weekly grouping ────────────────────────────────────────────────────────
export function groupLogsByWeek(logs) {
  const weeks = {}
  logs.forEach(log => {
    const ws = getMondayStr(log.date)
    if (!weeks[ws]) weeks[ws] = []
    weeks[ws].push(log)
  })
  return Object.entries(weeks)
    .map(([weekStart, wLogs]) => ({
      weekStart,
      weekEnd: dateAddDays(weekStart, 6),
      logs: [...wLogs].sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    }))
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
}

// ── Heatmap grid: 12 weeks × 7 days ───────────────────────────────────────
export function buildHeatmapWeeks(logs) {
  const today = new Date().toISOString().slice(0, 10)
  const curMonday = getMondayStr(today)
  const startMonday = dateAddDays(curMonday, -11 * 7) // 12 weeks ago

  const logsByDate = {}
  logs.forEach(log => {
    if (!logsByDate[log.date]) logsByDate[log.date] = []
    logsByDate[log.date].push(log)
  })

  const weeks = []
  for (let w = 0; w < 12; w++) {
    const weekStart = dateAddDays(startMonday, w * 7)
    const days = []
    for (let d = 0; d < 7; d++) {
      const date = dateAddDays(weekStart, d)
      days.push({
        date,
        logs: logsByDate[date] || [],
        isToday: date === today,
        isFuture: date > today,
      })
    }
    weeks.push({ weekStart, days })
  }
  return weeks
}

// ── Exercise helpers ───────────────────────────────────────────────────────
export function getExercisesForLog(log) {
  return (log.completedExerciseIds || []).map(id => EX_MAP[id]).filter(Boolean)
}

export function getUniqueEquipment(exerciseIds) {
  const eq = new Set()
  exerciseIds.forEach(id => {
    const ex = EX_MAP[id]
    if (ex) ex.equipment.forEach(e => eq.add(e))
  })
  return [...eq]
}

// ── Formatting helpers ─────────────────────────────────────────────────────
export function formatDuration(seconds) {
  if (!seconds) return '0 min'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h} hr ${m} min`
  if (h > 0) return `${h} hr`
  return `${m} min`
}

export function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  })
}

export function formatFullDate(dateStr) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  })
}

export function formatDateTime(isoStr) {
  return new Date(isoStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

// Month index (0-11) from a YYYY-MM-DD string
export function getMonthIdx(dateStr) {
  return new Date(dateStr + 'T12:00:00Z').getUTCMonth()
}

export const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
