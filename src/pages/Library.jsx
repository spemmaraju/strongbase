// Exercise library — browse everything, build today's session from it.
// ---------------------------------------------------------------------------
// Every exercise can be dropped straight into today's workout from here (the
// + Today toggle), filtered by muscle group, and can carry your own video link
// on top of the built-in one.
// ---------------------------------------------------------------------------

import { useState, useMemo } from 'react'
import useExerciseLibrary from '../hooks/useExerciseLibrary'
import useAuth from '../hooks/useAuth'
import useMediaQuery from '../hooks/useMediaQuery'
import ExerciseModal from '../components/ExerciseModal'
import { parseYouTubeId, watchUrl } from '../utils/youtube'
import { REGIONS, toRegions } from '../data/muscleGroups'
import { getProgramDayNumber } from '../utils/workoutStats'
import { plannedIdsForDay, addExerciseToDay, removeExerciseFromDay } from '../hooks/useSessionDraft'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const K = {
  bg: '#0a0e1a', card: '#101828', inset: '#16233a',
  border: 'rgba(255,255,255,0.06)', borderSt: 'rgba(255,255,255,0.10)',
  pink: '#ec4899', purple: '#8b5cf6', violet: '#c084fc',
  gradD: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
  amber: '#f59e0b', teal: '#2dd4bf', green: '#22c55e',
  text: '#f8fafc', muted: '#94a3b8', subtle: '#64748b', dim: '#475569',
}

const KCAT = {
  'warm-up': K.amber, strength: K.pink, stability: K.purple,
  flexibility: K.teal, cardio: '#3b82f6', power: '#fb923c',
}

const CATEGORIES = ['strength', 'power', 'stability', 'warm-up', 'flexibility', 'cardio']

export default function Library() {
  const { exercises, overrides, setVideo, syncState } = useExerciseLibrary()
  const { user } = useAuth()
  const isWide = useMediaQuery('(min-width: 768px)')

  const [q, setQ]         = useState('')
  const [cat, setCat]     = useState('all')
  const [region, setRegion]   = useState('all')
  const [needsOnly, setNeeds] = useState(false)
  const [editing, setEditing] = useState(null)   // exercise id
  const [draft, setDraft]     = useState('')
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [detail, setDetail]   = useState(null)
  const [copied, setCopied]   = useState(false)

  // Today's session, so every row can toggle itself in and out of it.
  // localStorage is the source of truth; `bump` just re-reads it after a toggle.
  const todayDayNumber = getProgramDayNumber(user)
  const [bump, setBump] = useState(0)
  const inToday = useMemo(
    () => new Set(plannedIdsForDay(todayDayNumber)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todayDayNumber, bump],
  )

  function toggleToday(ex) {
    if (inToday.has(ex.id)) removeExerciseFromDay(todayDayNumber, ex.id)
    else addExerciseToDay(todayDayNumber, ex.id)
    setBump(b => b + 1)
  }

  const missingCount = exercises.filter(e => !e.youtubeId).length

  // Muscle-group chips, derived from the library itself, most-covered first.
  const regionOptions = useMemo(() => {
    const c = new Map()
    exercises.forEach(e => toRegions(e.primaryMuscles || []).forEach(r => c.set(r, (c.get(r) || 0) + 1)))
    return [...c.entries()].sort((a, b) => b[1] - a[1]).map(x => x[0])
  }, [exercises])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return exercises.filter(e => {
      if (cat !== 'all' && e.category !== cat) return false
      if (region !== 'all' && !toRegions(e.primaryMuscles || []).includes(region)) return false
      if (needsOnly && e.youtubeId) return false
      if (!needle) return true
      return (
        e.name.toLowerCase().includes(needle) ||
        (e.primaryMuscles || []).some(m => m.toLowerCase().includes(needle)) ||
        (e.equipment || []).some(m => m.toLowerCase().includes(needle))
      )
    })
  }, [exercises, q, cat, region, needsOnly])

  function openEditor(ex) {
    setEditing(ex.id)
    setDraft(ex.youtubeId ? watchUrl(ex.youtubeId) : '')
    setError('')
  }

  async function commit(exerciseId) {
    setSaving(true)
    const res = await setVideo(exerciseId, draft)
    setSaving(false)
    if (!res.ok) { setError(res.error || 'Could not save that.'); return }
    setEditing(null)
    setError('')
  }

  function exportOverrides() {
    const payload = Object.fromEntries(
      Object.entries(overrides).filter(([, v]) => v),
    )
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const chip = (active, label, onClick, key) => (
    <button key={key ?? label} onClick={onClick} style={{
      padding: '5px 11px', borderRadius: 99, cursor: 'pointer', whiteSpace: 'nowrap',
      fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
      backgroundColor: active ? 'rgba(192,132,252,0.16)' : K.inset,
      color: active ? K.violet : K.muted,
      border: `1px solid ${active ? 'rgba(192,132,252,0.4)' : K.border}`,
    }}>{label}</button>
  )

  return (
    <div style={{ backgroundColor: K.bg, minHeight: '100svh' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: isWide ? '32px 28px 60px' : '24px 16px 40px' }}>

        {/* Header */}
        <p style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: K.dim, letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 6px' }}>
          Exercise library
        </p>
        <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: K.text, margin: '0 0 6px' }}>
          {exercises.length} exercises
        </h1>
        <p style={{ fontSize: 14, color: K.muted, margin: '0 0 20px', maxWidth: '58ch', lineHeight: 1.55 }}>
          Tap <span style={{ color: K.violet, fontWeight: 700 }}>+ Today</span> to drop any exercise into
          today&rsquo;s session (Day {todayDayNumber}). Filter by muscle group to find something new.
          {missingCount > 0 && ` ${missingCount} exercises still need a video.`}
        </p>

        {/* Sync state — honest about whether this is syncing or device-only */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18,
          backgroundColor: syncState === 'synced' ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)',
          border: `1px solid ${syncState === 'synced' ? 'rgba(34,197,94,0.22)' : 'rgba(245,158,11,0.22)'}`,
          borderRadius: 12, padding: '10px 13px',
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            backgroundColor: syncState === 'synced' ? K.green : K.amber,
          }} />
          <p style={{ fontSize: 12.5, color: syncState === 'synced' ? 'rgba(187,247,208,0.9)' : 'rgba(253,230,138,0.9)', margin: 0, lineHeight: 1.5 }}>
            {syncState === 'loading' && 'Checking sync…'}
            {syncState === 'synced' && 'Synced to your account — links you add here follow you to other devices.'}
            {syncState === 'local-only' && 'Saved on this device only. Links still work, but they will not appear on your other devices.'}
          </p>
        </div>

        {/* Search + filters */}
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by name, muscle or equipment…"
          style={{
            width: '100%', minHeight: 44, boxSizing: 'border-box',
            backgroundColor: K.card, border: `1px solid ${K.borderSt}`,
            borderRadius: 12, padding: '0 14px', color: K.text,
            fontSize: 14, outline: 'none', caretColor: K.violet,
          }}
          onFocus={e => { e.target.style.borderColor = K.violet }}
          onBlur={e => { e.target.style.borderColor = K.borderSt }}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
          {chip(cat === 'all', 'ALL', () => setCat('all'), 'all')}
          {CATEGORIES.map(c => chip(cat === c, c.replace('-', ' ').toUpperCase(), () => setCat(c), c))}
          <span style={{ width: 8, flexShrink: 0 }} />
          {chip(needsOnly, needsOnly ? '✓ NEEDS VIDEO' : 'NEEDS VIDEO', () => setNeeds(v => !v), 'needs')}
        </div>

        {/* Muscle groups — the "what do I want to train?" axis */}
        <div style={{ display: 'flex', gap: 6, marginTop: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {chip(region === 'all', 'ANY MUSCLE', () => setRegion('all'), 'r-all')}
          {regionOptions.map(r => chip(
            region === r,
            (REGIONS[r]?.label || r).toUpperCase(),
            () => setRegion(region === r ? 'all' : r),
            `r-${r}`,
          ))}
        </div>

        {/* List */}
        <div style={{ marginTop: 18 }}>
          {results.map(ex => {
            const accent    = KCAT[ex.category] || K.violet
            const isEditing = editing === ex.id
            const overridden = Object.prototype.hasOwnProperty.call(overrides, ex.id) && overrides[ex.id]

            return (
              <div key={ex.id} style={{
                backgroundColor: K.card, border: `1px solid ${isEditing ? 'rgba(192,132,252,0.4)' : K.border}`,
                borderRadius: 14, padding: '12px 14px', marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: accent, flexShrink: 0 }} />

                  <button
                    onClick={() => setDetail(ex)}
                    style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    <p style={{ fontFamily: FONT, fontSize: 14.5, fontWeight: 700, color: K.text, margin: 0, lineHeight: 1.25 }}>
                      {ex.name}
                    </p>
                    <p style={{ fontSize: 11.5, color: K.dim, margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(ex.primaryMuscles || []).join(' · ')}
                    </p>
                  </button>

                  {/* Videos are the norm now — only the exceptions get a badge. */}
                  {ex.youtubeId && overridden && (
                    <span style={{
                      flexShrink: 0, fontFamily: MONO, fontSize: 8.5, fontWeight: 700,
                      color: K.violet, backgroundColor: 'rgba(192,132,252,0.12)',
                      border: '1px solid rgba(192,132,252,0.28)',
                      borderRadius: 99, padding: '3px 8px', letterSpacing: '0.08em',
                    }}>YOURS</span>
                  )}
                  {!ex.youtubeId && (
                    <span style={{
                      flexShrink: 0, fontFamily: MONO, fontSize: 8.5, fontWeight: 700,
                      color: K.amber, backgroundColor: 'rgba(245,158,11,0.12)',
                      border: '1px solid rgba(245,158,11,0.25)',
                      borderRadius: 99, padding: '3px 8px', letterSpacing: '0.08em',
                    }}>NEEDS VIDEO</span>
                  )}

                  <button
                    onClick={() => toggleToday(ex)}
                    aria-label={inToday.has(ex.id) ? `Remove ${ex.name} from today` : `Add ${ex.name} to today`}
                    style={{
                      flexShrink: 0, padding: '6px 11px', borderRadius: 9, cursor: 'pointer',
                      background: inToday.has(ex.id) ? 'rgba(34,197,94,0.14)' : K.gradD,
                      border: inToday.has(ex.id) ? '1px solid rgba(34,197,94,0.35)' : 'none',
                      color: inToday.has(ex.id) ? K.green : '#fff',
                      fontFamily: FONT, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                    }}
                  >{inToday.has(ex.id) ? '✓ Today' : '+ Today'}</button>

                  <button
                    onClick={() => (isEditing ? setEditing(null) : openEditor(ex))}
                    aria-label={`Edit video link for ${ex.name}`}
                    style={{
                      flexShrink: 0, padding: '6px 11px', borderRadius: 9,
                      backgroundColor: K.inset, border: `1px solid ${K.borderSt}`,
                      color: K.muted, cursor: 'pointer',
                      fontFamily: FONT, fontSize: 12, fontWeight: 700,
                    }}
                  >{isEditing ? 'Cancel' : ex.youtubeId ? 'Change' : 'Add link'}</button>
                </div>

                {isEditing && (
                  <div style={{ marginTop: 12, borderTop: `1px solid ${K.border}`, paddingTop: 12 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <input
                        autoFocus
                        value={draft}
                        onChange={e => { setDraft(e.target.value); setError('') }}
                        onKeyDown={e => { if (e.key === 'Enter') commit(ex.id) }}
                        placeholder="https://www.youtube.com/watch?v=…"
                        style={{
                          flex: 1, minWidth: 200, minHeight: 40, boxSizing: 'border-box',
                          backgroundColor: K.inset,
                          border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : K.border}`,
                          borderRadius: 10, padding: '0 12px', color: K.text,
                          fontSize: 13.5, outline: 'none', caretColor: K.violet,
                        }}
                      />
                      <button
                        onClick={() => commit(ex.id)}
                        disabled={saving}
                        style={{
                          minHeight: 40, padding: '0 18px', borderRadius: 10, border: 'none',
                          background: K.gradD, color: '#fff', cursor: saving ? 'wait' : 'pointer',
                          fontFamily: FONT, fontWeight: 700, fontSize: 13.5,
                        }}
                      >{saving ? 'Saving…' : 'Save'}</button>
                    </div>

                    {error && (
                      <p style={{ fontSize: 12.5, color: '#fca5a5', margin: '8px 0 0' }}>{error}</p>
                    )}

                    {!error && draft.trim() !== '' && parseYouTubeId(draft) && (
                      <div style={{
                        marginTop: 12, position: 'relative', paddingTop: '42%',
                        borderRadius: 10, overflow: 'hidden', border: `1px solid ${K.borderSt}`,
                        backgroundColor: '#000',
                      }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${parseYouTubeId(draft)}?rel=0&modestbranding=1&playsinline=1`}
                          title={`Preview: ${ex.name}`}
                          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                        />
                      </div>
                    )}

                    <p style={{ fontSize: 11.5, color: K.dim, margin: '9px 0 0', lineHeight: 1.5 }}>
                      Any YouTube link works — watch, share, embed or Shorts. Leave it empty and save to clear.
                    </p>
                  </div>
                )}
              </div>
            )
          })}

          {results.length === 0 && (
            <p style={{ textAlign: 'center', color: K.dim, fontSize: 14, padding: '40px 20px' }}>
              Nothing matches. Try clearing a filter.
            </p>
          )}
        </div>

        {/* Export — so these can be baked into the app permanently */}
        {Object.values(overrides).some(Boolean) && (
          <div style={{
            marginTop: 24, backgroundColor: K.card, border: `1px solid ${K.border}`,
            borderRadius: 14, padding: 16,
          }}>
            <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 8px' }}>
              Your links
            </p>
            <p style={{ fontSize: 13, color: K.muted, margin: '0 0 12px', lineHeight: 1.55, maxWidth: '58ch' }}>
              {Object.values(overrides).filter(Boolean).length} saved. Copy them out and they can be built
              into the app permanently, so they survive even if you sign out.
            </p>
            <button
              onClick={exportOverrides}
              style={{
                minHeight: 40, padding: '0 16px', borderRadius: 10,
                backgroundColor: K.inset, border: `1px solid ${K.borderSt}`,
                color: copied ? K.green : K.text, cursor: 'pointer',
                fontFamily: FONT, fontWeight: 700, fontSize: 13,
              }}
            >{copied ? '✓ Copied' : 'Copy as JSON'}</button>
          </div>
        )}
      </div>

      {detail && <ExerciseModal exercise={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}
