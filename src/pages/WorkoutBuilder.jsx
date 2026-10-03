// Workout Builder — make your own session: pick a focus, get a sensible
// starting list, add/reorder/remove, save as a reusable template, and go.
// Used at /build (new) and /build/:id (edit).

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import useExerciseLibrary from '../hooks/useExerciseLibrary'
import useCustomWorkouts from '../hooks/useCustomWorkouts'
import useDragReorder from '../hooks/useDragReorder'
import ExerciseBrowser from '../components/ExerciseBrowser'
import ExerciseModal from '../components/ExerciseModal'
import { FOCUS_PRESETS, getDifficulty, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '../utils/exerciseMeta'
import { estimateMinutes } from '../utils/sessionPlan'
import { suggestWorkout } from '../utils/suggestWorkout'
import { getCustomWorkout } from '../utils/customWorkouts'
import { K, FONT, MONO } from '../theme'

const SIZES = [
  { id: 'short', label: 'Short' },
  { id: 'standard', label: 'Standard' },
  { id: 'long', label: 'Long' },
]

function formatSetsReps(ex) {
  if (ex.durationSeconds) {
    const t = ex.durationSeconds >= 60 ? `${Math.floor(ex.durationSeconds / 60)} min` : `${ex.durationSeconds}s`
    return `${ex.sets} × ${t}`
  }
  return `${ex.sets} × ${ex.reps}`
}

function defaultName(focus) {
  const d = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${focus ? focus.label : 'My workout'} · ${d}`
}

const chipStyle = active => ({
  padding: '9px 16px', borderRadius: 99, cursor: 'pointer', whiteSpace: 'nowrap',
  fontFamily: FONT, fontSize: 14, fontWeight: 700,
  backgroundColor: active ? 'rgba(58,120,224,0.16)' : K.inset,
  color: active ? K.violet : K.muted,
  border: `1px solid ${active ? 'rgba(58,120,224,0.45)' : K.border}`,
})

const smallBtn = {
  width: 36, height: 36, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
  background: 'transparent', border: 'none', color: K.subtle,
  fontFamily: FONT, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
}

export default function WorkoutBuilder() {
  const navigate = useNavigate()
  const { id: routeId } = useParams()
  const { user } = useAuth()
  const { exercises, exMap } = useExerciseLibrary()
  const { save, remove } = useCustomWorkouts()

  const equipKey = (user?.user_metadata?.equipment || ['bodyweight']).join(',')
  const userEquipment = useMemo(() => equipKey.split(','), [equipKey])

  // Edit mode loads the saved workout once, synchronously from localStorage.
  const [initial] = useState(() => (routeId ? getCustomWorkout(routeId) : null))
  const [savedId, setSavedId] = useState(initial?.id || null)
  const [name, setName] = useState(initial?.name || '')
  const [nameTouched, setNameTouched] = useState(!!initial)
  const [focusId, setFocusId] = useState(initial?.focusId || null)
  const [size, setSize] = useState('standard')
  const [seed, setSeed] = useState(0)
  const [ids, setIds] = useState(() => initial?.exerciseIds || [])
  const [browsing, setBrowsing] = useState(false)
  const [detail, setDetail] = useState(null)
  const [toast, setToast] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const toastTimer = useRef(null)
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const focus = FOCUS_PRESETS.find(f => f.id === focusId) || null
  const rows = useMemo(() => ids.map(id => exMap[id]).filter(Boolean), [ids, exMap])
  const minutes = rows.length ? estimateMinutes(rows) : 0

  const move = useCallback((from, to) => {
    setIds(prev => {
      const next = [...prev]
      const [x] = next.splice(from, 1)
      next.splice(to, 0, x)
      return next
    })
  }, [])
  const reorder = useDragReorder(rows.length, move)

  function suggest(f, sz, sd) {
    if (!f) return
    setIds(suggestWorkout(f, exercises, { userEquipment, size: sz, seed: sd }))
  }

  function pickFocus(f) {
    setFocusId(f.id)
    if (!nameTouched) setName(defaultName(f))
    if (ids.length === 0) suggest(f, size, seed)
  }

  function pickSize(sz) {
    setSize(sz)
  }

  function runSuggest(sd) {
    if (!focus) return
    if (ids.length && sd === seed && !window.confirm('Replace the current list with a fresh suggestion?')) return
    suggest(focus, size, sd)
  }

  function shuffle() {
    const next = seed + 1
    setSeed(next)
    suggest(focus, size, next)
  }

  function flash(msg) {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2200)
  }

  function persist() {
    if (!ids.length) return null
    const saved = save({
      id: savedId || undefined,
      name: name.trim() || defaultName(focus),
      focusId: focusId || 'full',
      exerciseIds: ids,
    })
    setSavedId(saved.id)
    return saved
  }

  function onSave() {
    if (persist()) flash('Saved')
  }

  function onStart() {
    const saved = persist()
    if (saved) navigate(`/day/c-${saved.id}`)
  }

  function onDelete() {
    if (savedId) remove(savedId)
    navigate('/', { replace: true })
  }

  const empty = rows.length === 0
  const canGo = !empty

  return (
    <div style={{ minHeight: '100svh', backgroundColor: K.bg, color: K.text, fontFamily: FONT }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 16px 150px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <button onClick={() => navigate(-1)} aria-label="Back" style={{ ...smallBtn, width: 44, height: 44, fontSize: 24, color: K.muted }}>‹</button>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{initial ? 'Edit workout' : 'Build a workout'}</h1>
        </div>

        {/* Name */}
        <input
          value={name}
          onChange={e => { setName(e.target.value); setNameTouched(true) }}
          placeholder={defaultName(focus)}
          aria-label="Workout name"
          maxLength={60}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: 14,
            backgroundColor: K.card, border: `1px solid ${K.borderSt}`, color: K.text,
            fontFamily: FONT, fontSize: 18, fontWeight: 700, outline: 'none',
          }}
        />

        {/* Focus */}
        <p style={sectionLabel}>Focus</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {FOCUS_PRESETS.map(f => (
            <button key={f.id} onClick={() => pickFocus(f)} style={chipStyle(focusId === f.id)}>{f.label}</button>
          ))}
        </div>

        {/* Length + suggest */}
        <p style={sectionLabel}>Length</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {SIZES.map(s => (
            <button key={s.id} onClick={() => pickSize(s.id)} style={chipStyle(size === s.id)}>{s.label}</button>
          ))}
          <span style={{ flex: 1 }} />
          <button
            onClick={() => runSuggest(seed)} disabled={!focus}
            style={{ ...ghostBtn, opacity: focus ? 1 : 0.4 }}
          >Suggest</button>
          <button
            onClick={shuffle} disabled={!focus}
            style={{ ...ghostBtn, opacity: focus ? 1 : 0.4 }}
          >Shuffle</button>
        </div>

        {/* List header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '28px 0 6px' }}>
          <p style={{ ...sectionLabel, margin: 0 }}>Exercises</p>
          <p style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: K.muted, margin: 0 }}>
            {rows.length} exercise{rows.length === 1 ? '' : 's'}{minutes ? ` · ~${minutes} min` : ''}
          </p>
        </div>

        {empty ? (
          <div style={{
            padding: '36px 20px', textAlign: 'center', borderRadius: 16,
            border: `1px dashed ${K.borderSt}`, color: K.muted, fontSize: 15, lineHeight: 1.5,
          }}>
            Pick a focus above for a suggested starting list,<br />or add exercises one by one.
          </div>
        ) : (
          <div>
            {rows.map((ex, i) => {
              const isDragging = reorder.drag?.from === i
              const showMarker = reorder.drag && reorder.drag.to === i && !isDragging
              const markerAbove = showMarker && reorder.drag.to < reorder.drag.from
              const diff = getDifficulty(ex)
              const marker = <div style={{ height: 2, borderRadius: 2, background: K.grad }} />
              return (
                <div key={ex.id} ref={el => reorder.registerRow(i, el)}>
                  {markerAbove && marker}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '8px 0',
                    borderBottom: `1px solid ${K.border}`,
                    transform: isDragging ? `translateY(${reorder.drag.dy}px)` : 'none',
                    position: isDragging ? 'relative' : 'static',
                    zIndex: isDragging ? 30 : 'auto',
                    backgroundColor: isDragging ? K.card : 'transparent',
                    borderRadius: isDragging ? 12 : 0,
                    boxShadow: isDragging ? '0 14px 34px rgba(0,0,0,0.55)' : 'none',
                  }}>
                    <div
                      {...reorder.handleProps(i)}
                      role="button" aria-label={`Drag ${ex.name} to reorder`} title="Drag to reorder"
                      style={{
                        ...reorder.handleProps(i).style,
                        width: 40, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: isDragging ? 'grabbing' : 'grab',
                        color: isDragging ? K.violet : K.dim, userSelect: 'none', WebkitUserSelect: 'none',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <circle cx="9" cy="6" r="1.7" /><circle cx="15" cy="6" r="1.7" />
                        <circle cx="9" cy="12" r="1.7" /><circle cx="15" cy="12" r="1.7" />
                        <circle cx="9" cy="18" r="1.7" /><circle cx="15" cy="18" r="1.7" />
                      </svg>
                    </div>
                    <button
                      onClick={() => setDetail(ex)}
                      style={{ flex: 1, minWidth: 0, textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 0', color: K.text }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          title={DIFFICULTY_LABELS[diff]}
                          style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, backgroundColor: DIFFICULTY_COLORS[diff] }}
                        />
                        <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, lineHeight: 1.25 }}>{ex.name}</span>
                      </span>
                      <span style={{ display: 'block', fontFamily: MONO, fontSize: 12, fontWeight: 700, color: K.muted, marginTop: 4, marginLeft: 17, letterSpacing: '0.04em' }}>
                        {formatSetsReps(ex)} · {ex.category}
                      </span>
                    </button>
                    <button onClick={() => i > 0 && move(i, i - 1)} disabled={i === 0} aria-label={`Move ${ex.name} up`} style={{ ...smallBtn, opacity: i === 0 ? 0.25 : 1 }}>↑</button>
                    <button onClick={() => i < rows.length - 1 && move(i, i + 1)} disabled={i === rows.length - 1} aria-label={`Move ${ex.name} down`} style={{ ...smallBtn, opacity: i === rows.length - 1 ? 0.25 : 1 }}>↓</button>
                    <button onClick={() => setIds(prev => prev.filter(x => x !== ex.id))} aria-label={`Remove ${ex.name}`} style={smallBtn}>✕</button>
                  </div>
                  {showMarker && !markerAbove && marker}
                </div>
              )
            })}
          </div>
        )}

        <button
          onClick={() => setBrowsing(true)}
          style={{
            width: '100%', marginTop: 16, padding: '15px', borderRadius: 14, cursor: 'pointer',
            backgroundColor: 'transparent', color: K.violet, fontFamily: FONT, fontSize: 16, fontWeight: 700,
            border: '1px dashed rgba(58,120,224,0.45)',
          }}
        >＋ Add exercises</button>
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40,
        backgroundColor: 'rgba(10,14,26,0.94)', backdropFilter: 'blur(10px)',
        borderTop: `1px solid ${K.border}`,
        padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {(initial || savedId) && (
            <button onClick={() => setConfirmDel(true)} style={{ ...ghostBtn, color: K.red, borderColor: 'rgba(224,108,108,0.35)', height: 52 }}>Delete</button>
          )}
          <button onClick={onSave} disabled={!canGo} style={{ ...ghostBtn, height: 52, padding: '0 22px', opacity: canGo ? 1 : 0.4 }}>Save</button>
          <button
            onClick={onStart} disabled={!canGo}
            style={{
              flex: 1, height: 52, borderRadius: 14, border: 'none', cursor: canGo ? 'pointer' : 'default',
              background: K.grad, color: '#fff', fontFamily: FONT, fontSize: 17, fontWeight: 700,
              opacity: canGo ? 1 : 0.4,
            }}
          >Start workout</button>
        </div>
      </div>

      {toast && (
        <div role="status" style={{
          position: 'fixed', left: '50%', bottom: 100, transform: 'translateX(-50%)', zIndex: 60,
          backgroundColor: K.card, border: `1px solid ${K.borderSt}`, color: K.text,
          padding: '10px 20px', borderRadius: 99, fontSize: 14, fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>{toast}</div>
      )}

      {confirmDel && (
        <div onClick={e => { if (e.target === e.currentTarget) setConfirmDel(false) }} style={{
          position: 'fixed', inset: 0, zIndex: 80, backgroundColor: 'rgba(3,6,14,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{ width: '100%', maxWidth: 380, backgroundColor: K.card, border: `1px solid ${K.borderSt}`, borderRadius: 18, padding: 22 }}>
            <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Delete this workout?</p>
            <p style={{ fontSize: 14, color: K.muted, margin: '0 0 18px', lineHeight: 1.5 }}>
              “{name.trim() || 'Untitled'}” will be removed from your saved workouts. Past logs are kept.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDel(false)} style={{ ...ghostBtn, flex: 1, height: 48 }}>Cancel</button>
              <button onClick={onDelete} style={{ ...ghostBtn, flex: 1, height: 48, color: '#fff', backgroundColor: K.red, borderColor: K.red }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {detail && <ExerciseModal exercise={detail} onClose={() => setDetail(null)} />}

      {browsing && (
        <ExerciseBrowser
          exercises={exercises}
          exclude={ids}
          day={{ day: 'builder', theme: name || 'Workout', focus: focus || FOCUS_PRESETS[0] }}
          mode="home"
          userEquipment={userEquipment}
          onPick={id => setIds(prev => (prev.includes(id) ? prev : [...prev, id]))}
          onRemove={id => setIds(prev => prev.filter(x => x !== id))}
          onClose={() => setBrowsing(false)}
        />
      )}
    </div>
  )
}

const sectionLabel = {
  fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
  textTransform: 'uppercase', color: K.subtle, margin: '24px 0 10px',
}

const ghostBtn = {
  padding: '0 16px', height: 42, borderRadius: 12, cursor: 'pointer',
  backgroundColor: K.inset, color: K.text, border: `1px solid ${K.borderSt}`,
  fontFamily: FONT, fontSize: 14, fontWeight: 700,
}
