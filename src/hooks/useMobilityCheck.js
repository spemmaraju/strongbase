// The monthly mobility self-check.
// ---------------------------------------------------------------------------
// Four questions, categorical answers, no tape measure. Precision you never
// collect is worth less than a rough answer you collect twelve times a year —
// and a ruler is a chore you'd do twice.
//
// Stored in Supabase user_metadata, the same place fitnessLevel / equipment /
// programStartDate already live. Twelve entries a year of four short strings is
// a few hundred bytes, nowhere near the JWT-bloat that ruled metadata out for
// hundreds of video links. It syncs across devices with no new table and no SQL
// to run, which matters for data you won't look at again for a month —
// localStorage would quietly lose it on a browser change.
// ---------------------------------------------------------------------------

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const CACHE_KEY = 'strongbase_mobility_checks'

export const QUESTIONS = [
  {
    id: 'toeTouch',
    prompt: 'Stand, knees soft, fold forward. How far down do your hands reach?',
    options: [
      { value: 'knuckles',   label: 'Knuckles to shins' },
      { value: 'fingertips', label: 'Fingertips to floor' },
      { value: 'palms',      label: 'Flat palms on floor' },
    ],
  },
  {
    id: 'behindBack',
    prompt: 'One hand over the shoulder, the other up from below. Can they meet?',
    options: [
      { value: 'cant',  label: "Can't reach" },
      { value: 'touch', label: 'Fingers touch' },
      { value: 'clasp', label: 'Clasp easily' },
    ],
  },
  {
    id: 'lunge',
    prompt: 'In a deep lunge, does your front heel stay on the floor?',
    options: [
      { value: 'lifts', label: 'Heel lifts' },
      { value: 'just',  label: 'Stays, but only just' },
      { value: 'easy',  label: 'Stays down easily' },
    ],
  },
  {
    id: 'balance',
    prompt: 'Stand on one leg with your eyes closed. How long before you wobble?',
    options: [
      { value: 'under10', label: 'Under 10 seconds' },
      { value: '10to30',  label: '10–30 seconds' },
      { value: 'over30',  label: 'Over 30 seconds' },
    ],
  },
]

/** Rank of an answer within its question — used to show movement between checks. */
export function answerRank(questionId, value) {
  const q = QUESTIONS.find(x => x.id === questionId)
  return q ? q.options.findIndex(o => o.value === value) : -1
}

export function answerLabel(questionId, value) {
  const q = QUESTIONS.find(x => x.id === questionId)
  return q?.options.find(o => o.value === value)?.label ?? '—'
}

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]') } catch { return [] }
}
function writeCache(list) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)) } catch {}
}

export default function useMobilityCheck() {
  // Newest first: [{ date: 'YYYY-MM-DD', answers: { toeTouch: 'fingertips', … } }]
  const [checks, setChecks] = useState(readCache)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (cancelled) return
        const remote = user?.user_metadata?.mobilityChecks
        if (Array.isArray(remote)) {
          setChecks(remote)
          writeCache(remote)
        }
      } catch { /* offline — the cache stands */ }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  const save = useCallback(async answers => {
    const entry = { date: new Date().toISOString().slice(0, 10), answers }
    // Replace rather than append if one already exists for today.
    const next = [entry, ...checks.filter(c => c.date !== entry.date)].slice(0, 24)

    setChecks(next)
    writeCache(next)

    try {
      const { error } = await supabase.auth.updateUser({ data: { mobilityChecks: next } })
      return { ok: !error, synced: !error }
    } catch {
      return { ok: true, synced: false }
    }
  }, [checks])

  const latest = checks[0] ?? null
  const previous = checks[1] ?? null

  // Anchor BOTH sides at noon UTC — comparing a noon-anchored stored date
  // against a raw Date.now() goes negative earlier the same day, depending on
  // the local timezone. This mirrors dateAddDays() in useStreak.
  const daysSince = latest
    ? Math.max(0, Math.round(
        (new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00Z`).getTime()
          - new Date(`${latest.date}T12:00:00Z`).getTime()) / 86400000,
      ))
    : null

  return { checks, latest, previous, daysSince, loading, save }
}
