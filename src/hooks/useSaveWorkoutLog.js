// Writing a completed workout to Supabase, with an offline queue.
// ---------------------------------------------------------------------------
// Extracted verbatim from useWorkoutPlayer so the guided player and the
// self-directed session write logs through exactly one path.
//
// Every field here is load-bearing downstream:
//   date, dayNumber       → useStreak, useBadges, History grouping
//   totalSets             → XP and level (Home and Profile both do sets × 25)
//   completedExerciseIds  → History detail, muscle stats, equipment chips
//   totalTimeSeconds      → displayed durations
//   completedAt           → History sort key (string compare)
// Leaving any of them empty silently degrades a screen elsewhere.
// ---------------------------------------------------------------------------

import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logToRow } from './useWorkoutLogs'

export default function useSaveWorkoutLog() {
  const [status, setStatus] = useState('idle') // idle | saving | done | error

  const save = useCallback(async ({
    day,
    completedExerciseIds,
    totalSets,
    totalTimeSeconds = 0,
    setPerformance = null,
  }) => {
    if (!day) return { ok: false }
    setStatus('saving')

    const date = new Date().toISOString().slice(0, 10)
    const log = {
      dayNumber: day.day,
      date,
      theme: day.theme,
      completedExerciseIds,
      totalSets,
      totalTimeSeconds,
      completedAt: new Date().toISOString(),
    }

    // Per-set reps live in localStorage — there is no DB column for them.
    // perfHistory.js scans for this exact key shape.
    if (setPerformance) {
      try {
        localStorage.setItem(
          `strongbase_perf_${date}_d${day.day}`,
          JSON.stringify(setPerformance),
        )
      } catch { /* quota — ignore */ }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('not authenticated')

      const { error } = await supabase
        .from('workout_logs')
        .insert(logToRow(log, user.id))
      if (error) throw error

      setStatus('done')
      return { ok: true, log }
    } catch (e) {
      console.error('Supabase save failed — storing offline:', e)
      try {
        const pending = JSON.parse(localStorage.getItem('strongbase_pending_logs') || '[]')
        pending.push(log)
        localStorage.setItem('strongbase_pending_logs', JSON.stringify(pending))
      } catch {}
      setStatus('error')
      return { ok: false, log, offline: true }
    }
  }, [])

  return { save, status, setStatus }
}
