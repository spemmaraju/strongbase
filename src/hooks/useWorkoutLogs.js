import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Map Supabase snake_case row → camelCase log object used by useStreak / useBadges
function rowToLog(row) {
  return {
    id: row.id,
    dayNumber: row.day_number,
    date: typeof row.date === 'string' ? row.date.slice(0, 10) : row.date,
    theme: row.theme,
    completedExerciseIds: row.completed_exercise_ids,
    totalSets: row.total_sets,
    totalTimeSeconds: row.total_time_seconds,
    completedAt: row.completed_at,
  }
}

// Map camelCase log → Supabase insert row (user_id must be provided separately)
export function logToRow(log, userId) {
  return {
    user_id: userId,
    day_number: log.dayNumber,
    date: log.date,
    theme: log.theme,
    completed_exercise_ids: log.completedExerciseIds,
    total_sets: log.totalSets,
    total_time_seconds: log.totalTimeSeconds,
    completed_at: log.completedAt,
  }
}

export default function useWorkoutLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncing, setSyncing] = useState(false) // uploading offline pending logs
  const didMigrate = useRef(false)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: fetchErr } = await supabase
      .from('workout_logs')
      .select('*')
      .order('completed_at', { ascending: false })

    if (fetchErr) {
      setError(fetchErr)
    } else {
      setLogs((data || []).map(rowToLog))
    }
    setLoading(false)
  }, [])

  // ── Migrate legacy localStorage logs → Supabase (runs once per session) ──
  async function migrateLegacyLogs(userId) {
    try {
      const raw = localStorage.getItem('strongbase_logs')
      if (!raw) return
      const legacyLogs = JSON.parse(raw)
      if (!legacyLogs.length) { localStorage.removeItem('strongbase_logs'); return }

      const rows = legacyLogs.map(l => logToRow(l, userId))
      const { error } = await supabase.from('workout_logs').insert(rows)
      if (!error) {
        localStorage.removeItem('strongbase_logs')
      }
    } catch (e) {
      console.error('Legacy log migration failed:', e)
    }
  }

  // ── Upload pending offline logs (runs once per session) ───────────────────
  async function uploadPendingLogs(userId) {
    try {
      const raw = localStorage.getItem('strongbase_pending_logs')
      if (!raw) return
      const pending = JSON.parse(raw)
      if (!pending.length) { localStorage.removeItem('strongbase_pending_logs'); return }

      setSyncing(true)
      const rows = pending.map(l => logToRow(l, userId))
      const { error } = await supabase.from('workout_logs').insert(rows)
      if (!error) {
        localStorage.removeItem('strongbase_pending_logs')
      }
      setSyncing(false)
    } catch (e) {
      setSyncing(false)
      console.error('Pending log upload failed:', e)
    }
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (!didMigrate.current) {
        didMigrate.current = true
        await migrateLegacyLogs(user.id)
        await uploadPendingLogs(user.id)
      }

      await fetchLogs()
    }
    init()
  }, [fetchLogs])

  return { logs, loading, error, syncing, refetch: fetchLogs }
}
