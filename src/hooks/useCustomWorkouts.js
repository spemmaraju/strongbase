// Saved custom workouts: localStorage is the instant source of truth, the
// Supabase `custom_workouts` table keeps devices in step. Never throws — any
// failure just flips syncState to 'local-only'.

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { readCustomWorkouts, writeCustomWorkouts } from '../utils/customWorkouts'

const ts = v => { const t = Date.parse(v); return Number.isNaN(t) ? 0 : t }

const fromRow = r => ({
  id: r.id,
  name: r.name,
  focusId: r.focus_id,
  exerciseIds: Array.isArray(r.exercise_ids) ? r.exercise_ids : [],
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

const toRow = (userId, w) => ({
  user_id: userId,
  id: w.id,
  name: w.name,
  focus_id: w.focusId || null,
  exercise_ids: w.exerciseIds || [],
  created_at: w.createdAt,
  updated_at: w.updatedAt,
})

async function currentUserId() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  } catch { return null }
}

export default function useCustomWorkouts() {
  const [workouts, setWorkouts] = useState(readCustomWorkouts)
  const [syncState, setSyncState] = useState('loading')
  const loadedRef = useRef(false)

  const commit = useCallback(list => {
    writeCustomWorkouts(list)
    setWorkouts(list)
  }, [])

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    ;(async () => {
      try {
        const userId = await currentUserId()
        if (!userId) { setSyncState('local-only'); return }
        const { data, error } = await supabase.from('custom_workouts').select('*')
        if (error) { setSyncState('local-only'); return }

        const byId = new Map()
        ;(data || []).map(fromRow).forEach(w => byId.set(w.id, w))
        const pushUp = []
        readCustomWorkouts().forEach(local => {
          const remote = byId.get(local.id)
          if (!remote || ts(local.updatedAt) > ts(remote.updatedAt)) {
            byId.set(local.id, local)
            pushUp.push(local)
          }
        })
        const merged = [...byId.values()].sort((a, b) => ts(b.updatedAt) - ts(a.updatedAt))
        commit(merged)
        if (pushUp.length) {
          const { error: upErr } = await supabase
            .from('custom_workouts').upsert(pushUp.map(w => toRow(userId, w)))
          if (upErr) { setSyncState('local-only'); return }
        }
        setSyncState('synced')
      } catch { setSyncState('local-only') }
    })()
  }, [commit])

  const save = useCallback(workout => {
    const now = new Date().toISOString()
    const list = readCustomWorkouts()
    const existing = workout.id ? list.find(w => w.id === workout.id) : null
    const saved = {
      ...workout,
      id: workout.id || crypto.randomUUID().slice(0, 8),
      createdAt: existing?.createdAt || workout.createdAt || now,
      updatedAt: now,
    }
    const next = [saved, ...list.filter(w => w.id !== saved.id)]
    commit(next)
    ;(async () => {
      try {
        const userId = await currentUserId()
        if (!userId) return
        const { error } = await supabase.from('custom_workouts').upsert(toRow(userId, saved))
        setSyncState(error ? 'local-only' : 'synced')
      } catch { setSyncState('local-only') }
    })()
    return saved
  }, [commit])

  const remove = useCallback(id => {
    commit(readCustomWorkouts().filter(w => w.id !== id))
    ;(async () => {
      try {
        const userId = await currentUserId()
        if (!userId) return
        const { error } = await supabase
          .from('custom_workouts').delete().eq('user_id', userId).eq('id', id)
        if (error) setSyncState('local-only')
      } catch { setSyncState('local-only') }
    })()
  }, [commit])

  return { workouts, save, remove, syncState }
}
