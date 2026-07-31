// Search-and-pick over the whole exercise library.
// ---------------------------------------------------------------------------
// Opened two ways:
//   Swap — pass `replacing` (an exercise). Defaults the muscle filter to that
//          exercise's primary muscle so the alternatives on screen are ones
//          that actually cover the same slot.
//   Add  — no `replacing`; opens unfiltered.
// ---------------------------------------------------------------------------

import { useState, useMemo, useEffect } from 'react'
import useMediaQuery from '../hooks/useMediaQuery'
import { canShowExercise } from '../utils/sessionPlan'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const K = {
  panel: '#0a111e', card: '#101828', inset: '#16233a',
  border: 'rgba(255,255,255,0.06)', borderSt: 'rgba(255,255,255,0.10)',
  pink: '#ec4899', purple: '#8b5cf6', violet: '#c084fc',
  grad: 'linear-gradient(90deg,#ec4899,#8b5cf6)',
  amber: '#f59e0b', teal: '#2dd4bf',
  text: '#f8fafc', muted: '#94a3b8', dim: '#475569',
}

const KCAT = {
  'warm-up': K.amber, strength: K.pink, stability: K.purple,
  flexibility: K.teal, cardio: '#3b82f6',
}

const CATEGORIES = ['strength', 'stability', 'warm-up', 'flexibility', 'cardio']

export default function ExerciseBrowser({
  exercises, exclude = [], replacing = null,
  mode = 'home', userEquipment = ['bodyweight'],
  onPick, onClose,
}) {
  const isWide = useMediaQuery('(min-width: 768px)')
  const [q, setQ]             = useState('')
  const [cat, setCat]         = useState(replacing?.category || 'all')
  const [muscle, setMuscle]   = useState(replacing?.primaryMuscles?.[0] || 'all')
  const [ownedOnly, setOwned] = useState(mode === 'home')

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', h)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // Muscle options come from the library itself, so this can never drift out of
  // sync with the data the way a hardcoded list would.
  const muscles = useMemo(() => {
    const c = new Map()
    exercises.forEach(e => (e.primaryMuscles || []).forEach(m => c.set(m, (c.get(m) || 0) + 1)))
    return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(x => x[0])
  }, [exercises])

  const excludeSet = useMemo(() => new Set(exclude), [exclude])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return exercises.filter(e => {
      if (excludeSet.has(e.id)) return false
      if (cat !== 'all' && e.category !== cat) return false
      if (muscle !== 'all' && !(e.primaryMuscles || []).includes(muscle)) return false
      if (ownedOnly && !canShowExercise(e, 'home', userEquipment)) return false
      if (!needle) return true
      return (
        e.name.toLowerCase().includes(needle) ||
        (e.primaryMuscles || []).some(m => m.toLowerCase().includes(needle)) ||
        (e.equipment || []).some(m => m.toLowerCase().includes(needle))
      )
    })
  }, [exercises, excludeSet, cat, muscle, ownedOnly, userEquipment, q])

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
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 70,
        backgroundColor: 'rgba(3,6,14,0.84)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: isWide ? 'center' : 'flex-end', justifyContent: 'center',
        padding: isWide ? 20 : 0,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 720, height: isWide ? '82svh' : '92svh',
        backgroundColor: K.card, border: `1px solid ${K.borderSt}`,
        borderRadius: isWide ? 22 : '22px 22px 0 0',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 12px', borderBottom: `1px solid ${K.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.violet, letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                {replacing ? 'Swap out' : 'Add exercise'}
              </p>
              <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 19, color: K.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {replacing ? replacing.name : 'Browse the library'}
              </h2>
            </div>
            <button onClick={onClose} aria-label="Close" style={{
              flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
              backgroundColor: K.inset, border: `1px solid ${K.border}`,
              color: K.muted, cursor: 'pointer', fontSize: 16, lineHeight: 1,
            }}>×</button>
          </div>

          <input
            autoFocus={isWide}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by name, muscle or equipment…"
            style={{
              width: '100%', minHeight: 42, boxSizing: 'border-box',
              backgroundColor: K.inset, border: `1px solid ${K.border}`,
              borderRadius: 12, padding: '0 14px', color: K.text,
              fontSize: 14, outline: 'none', caretColor: K.violet,
            }}
            onFocus={e => { e.target.style.borderColor = K.violet }}
            onBlur={e => { e.target.style.borderColor = K.border }}
          />

          {/* Filters */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
            {chip(cat === 'all', 'ALL', () => setCat('all'), 'cat-all')}
            {CATEGORIES.map(c => chip(cat === c, c.replace('-', ' ').toUpperCase(), () => setCat(c), `cat-${c}`))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, overflowX: 'auto', paddingBottom: 2 }}>
            {chip(muscle === 'all', 'ANY MUSCLE', () => setMuscle('all'), 'm-all')}
            {muscles.slice(0, 14).map(m => chip(muscle === m, m.toUpperCase(), () => setMuscle(m), `m-${m}`))}
          </div>
          {mode === 'home' && (
            <div style={{ marginTop: 8 }}>
              {chip(ownedOnly, ownedOnly ? '✓ ONLY MY EQUIPMENT' : 'ONLY MY EQUIPMENT', () => setOwned(v => !v), 'owned')}
            </div>
          )}
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 20px' }}>
          {results.length === 0 && (
            <p style={{ textAlign: 'center', color: K.dim, fontSize: 14, padding: '40px 20px' }}>
              Nothing matches. Try clearing a filter.
            </p>
          )}
          {results.map(ex => {
            const accent = KCAT[ex.category] || K.violet
            return (
              <button
                key={ex.id}
                onClick={() => { onPick(ex.id); onClose() }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 10px', borderRadius: 12, cursor: 'pointer',
                  background: 'none', border: 'none', textAlign: 'left',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = K.inset }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: accent, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FONT, fontSize: 14.5, fontWeight: 700, color: K.text, margin: 0, lineHeight: 1.25 }}>
                    {ex.name}
                  </p>
                  <p style={{ fontSize: 11.5, color: K.dim, margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(ex.primaryMuscles || []).join(' · ')}
                    {ex.equipment?.length ? ` — ${ex.equipment.map(q => q.replace(/-/g, ' ')).join(', ')}` : ''}
                  </p>
                </div>
                {!ex.youtubeId && (
                  <span style={{
                    flexShrink: 0, fontFamily: MONO, fontSize: 8.5, fontWeight: 700,
                    color: K.amber, backgroundColor: 'rgba(245,158,11,0.12)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 99, padding: '3px 7px', letterSpacing: '0.08em',
                  }}>NO VIDEO</span>
                )}
                <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 10, fontWeight: 700, color: accent }}>
                  {ex.durationSeconds ? `${ex.sets}×${ex.durationSeconds}s` : `${ex.sets}×${ex.reps}`}
                </span>
              </button>
            )
          })}
        </div>

        <div style={{ padding: '10px 20px', borderTop: `1px solid ${K.border}` }}>
          <p style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: K.dim, letterSpacing: '0.1em', margin: 0 }}>
            {results.length} {results.length === 1 ? 'MATCH' : 'MATCHES'}
          </p>
        </div>
      </div>
    </div>
  )
}
