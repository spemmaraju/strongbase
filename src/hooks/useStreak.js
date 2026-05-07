// ── Shared date helpers (UTC-consistent, matches how logs are saved) ────────
export function dateAddDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function getMondayStr(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z')
  const dow = d.getUTCDay() // 0 = Sun, 1 = Mon …
  const offset = dow === 0 ? 6 : dow - 1
  return dateAddDays(dateStr, -offset)
}

// ── Pure stats computation ───────────────────────────────────────────────────
// Accepts a logs array (from Supabase via useWorkoutLogs).
// Each log must have: { date: 'YYYY-MM-DD', dayNumber: number }
export function computeStreakStats(logs) {
  const today = new Date().toISOString().slice(0, 10)

  if (!logs.length) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalWorkouts: 0,
      thisWeekCount: 0,
      completedThisWeekDayNumbers: new Set(),
    }
  }

  // ── Unique workout dates, sorted ascending ─────────────────────────────────
  const dateSet = new Set(logs.map(l => l.date))
  const sortedDates = [...dateSet].sort()

  // ── Current streak (consecutive days ending today or yesterday) ────────────
  let currentStreak = 0
  const yesterday = dateAddDays(today, -1)
  let check = dateSet.has(today) ? today : dateSet.has(yesterday) ? yesterday : null
  while (check && dateSet.has(check)) {
    currentStreak++
    check = dateAddDays(check, -1)
  }

  // ── Longest streak ever ────────────────────────────────────────────────────
  let longest = 1, cur = 1
  for (let i = 1; i < sortedDates.length; i++) {
    const diffMs =
      new Date(sortedDates[i] + 'T12:00:00Z') -
      new Date(sortedDates[i - 1] + 'T12:00:00Z')
    const diffDays = Math.round(diffMs / 86400000)
    cur = diffDays === 1 ? cur + 1 : 1
    longest = Math.max(longest, cur)
  }

  // ── This calendar week (Mon–Sun) ───────────────────────────────────────────
  const monday = getMondayStr(today)
  const nextMonday = dateAddDays(monday, 7)
  const thisWeekLogs = logs.filter(l => l.date >= monday && l.date < nextMonday)
  const completedThisWeekDayNumbers = new Set(thisWeekLogs.map(l => l.dayNumber))

  return {
    currentStreak,
    longestStreak: Math.max(longest, currentStreak),
    totalWorkouts: logs.length,
    thisWeekCount: thisWeekLogs.length,
    completedThisWeekDayNumbers,
  }
}

// ── Convenience hook (used by CompletionScreen to read live streak) ──────────
// Accepts logs array directly from useWorkoutLogs — pure computation, no side effects.
import { useMemo } from 'react'

export default function useStreak(logs = []) {
  return useMemo(() => computeStreakStats(logs), [logs])
}
