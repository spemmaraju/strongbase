import { useState, useEffect } from 'react'
import { readLogs, computeStreakStats, getMondayStr, dateAddDays } from './useStreak'

// ── Badge definitions ──────────────────────────────────────────────────────
export const BADGE_DEFS = [
  {
    id: 'first-step',
    emoji: '🐣',
    name: 'First Step',
    condition: 'Complete your first ever workout',
  },
  {
    id: 'on-fire',
    emoji: '🔥',
    name: 'On Fire',
    condition: 'Achieve a 3-day streak',
  },
  {
    id: 'halfway-hero',
    emoji: '💪',
    name: 'Halfway Hero',
    condition: 'Complete 4 workouts in one week',
  },
  {
    id: 'week-warrior',
    emoji: '🏆',
    name: 'Week Warrior',
    condition: 'Complete all 7 days in one week',
  },
  {
    id: 'pull-power',
    emoji: '🦾',
    name: 'Pull Power',
    condition: 'Complete Day 5 (Pull Day) at least once',
  },
  {
    id: 'comeback-kid',
    emoji: '⚡',
    name: 'Comeback Kid',
    condition: 'Complete a workout after a 2+ day break',
  },
]

// ── Pure badge computation ─────────────────────────────────────────────────
export function computeBadges(logs) {
  const earned = new Set()

  if (!logs.length) return BADGE_DEFS.map(b => ({ ...b, earned: false }))

  // First Step: at least one completed workout
  if (logs.length >= 1) earned.add('first-step')

  // On Fire: 3-day streak (current or any past streak via longestStreak)
  const { longestStreak } = computeStreakStats(logs)
  if (longestStreak >= 3) earned.add('on-fire')

  // Pull Power: completed Day 5 at least once
  if (logs.some(l => l.dayNumber === 5)) earned.add('pull-power')

  // Comeback Kid: completed a workout after a 2+ day gap
  const sorted = [...logs].sort((a, b) => (a.date < b.date ? -1 : 1))
  for (let i = 1; i < sorted.length; i++) {
    const diffMs =
      new Date(sorted[i].date + 'T12:00:00Z') -
      new Date(sorted[i - 1].date + 'T12:00:00Z')
    if (Math.round(diffMs / 86400000) >= 2) {
      earned.add('comeback-kid')
      break
    }
  }

  // Group logs by Mon-Sun week → count entries and unique day numbers
  const weekEntries = {}   // weekKey → count
  const weekDayNums = {}   // weekKey → Set of dayNumbers

  logs.forEach(l => {
    const wk = getMondayStr(l.date)
    weekEntries[wk] = (weekEntries[wk] || 0) + 1
    if (!weekDayNums[wk]) weekDayNums[wk] = new Set()
    weekDayNums[wk].add(l.dayNumber)
  })

  // Halfway Hero: any week with 4+ workout entries
  if (Object.values(weekEntries).some(c => c >= 4)) earned.add('halfway-hero')

  // Week Warrior: any week where all 7 day numbers (1-7) are present
  if (Object.values(weekDayNums).some(s => s.size >= 7)) earned.add('week-warrior')

  return BADGE_DEFS.map(b => ({ ...b, earned: earned.has(b.id) }))
}

// ── Hook ───────────────────────────────────────────────────────────────────
export default function useBadges() {
  const [badges, setBadges] = useState(() => computeBadges(readLogs()))

  useEffect(() => {
    const refresh = () => setBadges(computeBadges(readLogs()))
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])

  return badges
}
