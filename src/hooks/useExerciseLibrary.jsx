// The exercise library, with your own video URLs layered on top.
// ---------------------------------------------------------------------------
// exercises.json is statically bundled by Vite, so anything you paste in the
// app can never be written back to it. Overrides therefore have to merge at
// read time — that is what this provider does.
//
// Storage is a Supabase table (exercise_media) so a URL pasted on a laptop
// shows up on the iPad, with a localStorage mirror for instant first paint and
// offline. If the table doesn't exist yet the whole thing degrades to
// localStorage-only rather than breaking — see `syncState`.
// ---------------------------------------------------------------------------

import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import baseExercises from '../data/exercises.json'
import { supabase } from '../lib/supabase'
import { parseYouTubeId } from '../utils/youtube'

const CACHE_KEY = 'strongbase_video_overrides'

const LibraryContext = createContext(null)

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') } catch { return {} }
}
function writeCache(map) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(map)) } catch {}
}

export function ExerciseLibraryProvider({ children }) {
  // { exerciseId: youtubeId | null }.  null means "deliberately cleared".
  const [overrides, setOverrides] = useState(readCache)
  // synced | local-only | loading — surfaced in the Library tab
  const [syncState, setSyncState] = useState('loading')
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setSyncState('local-only'); return }

        const { data, error } = await supabase
          .from('exercise_media')
          .select('exercise_id, youtube_id')

        // Table missing / RLS not set up — keep working from the local cache.
        if (error) { setSyncState('local-only'); return }

        const remote = {}
        ;(data || []).forEach(r => { remote[r.exercise_id] = r.youtube_id })
        setOverrides(prev => {
          // Remote wins; anything local-only is kept so a pending paste isn't lost.
          const merged = { ...prev, ...remote }
          writeCache(merged)
          return merged
        })
        setSyncState('synced')
      } catch {
        setSyncState('local-only')
      }
    })()
  }, [])

  /**
   * Set (or clear) the video for an exercise.
   * @param input a YouTube URL in any form, a bare id, or '' to clear.
   * @returns {{ok: boolean, id?: string|null, error?: string}}
   */
  const setVideo = useCallback(async (exerciseId, input) => {
    const raw = String(input ?? '').trim()
    const id = raw === '' ? null : parseYouTubeId(raw)
    if (raw !== '' && !id) return { ok: false, error: "That doesn't look like a YouTube link." }

    // Optimistic — the UI updates immediately, sync catches up.
    setOverrides(prev => {
      const next = { ...prev, [exerciseId]: id }
      writeCache(next)
      return next
    })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { ok: true, id, synced: false }

      const { error } = await supabase
        .from('exercise_media')
        .upsert(
          { user_id: user.id, exercise_id: exerciseId, youtube_id: id, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,exercise_id' },
        )
      if (error) { setSyncState('local-only'); return { ok: true, id, synced: false } }

      setSyncState('synced')
      return { ok: true, id, synced: true }
    } catch {
      setSyncState('local-only')
      return { ok: true, id, synced: false }
    }
  }, [])

  const exercises = useMemo(
    () => baseExercises.map(e => (
      Object.prototype.hasOwnProperty.call(overrides, e.id)
        ? { ...e, youtubeId: overrides[e.id] }
        : e
    )),
    [overrides],
  )

  const exMap = useMemo(
    () => Object.fromEntries(exercises.map(e => [e.id, e])),
    [exercises],
  )

  const value = useMemo(
    () => ({ exercises, exMap, overrides, setVideo, syncState }),
    [exercises, exMap, overrides, setVideo, syncState],
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export default function useExerciseLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useExerciseLibrary must be used inside <ExerciseLibraryProvider>')
  return ctx
}
