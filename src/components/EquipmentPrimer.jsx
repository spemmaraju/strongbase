// First-time primer, with an optional progression ladder.
// ---------------------------------------------------------------------------
// Shown inside the exercise modal the first time a matching exercise is opened.
// Dismissible, and the dismissal sticks — but it stays reachable via a quiet
// one-line link, because "I forgot how to set it down safely" is a real thing.
//
// Matched two ways: by equipment (kettlebell), or by an exercise's explicit
// `primer` field (power). Equipment keying alone wasn't enough — a progression
// isn't always about a piece of kit.
//
// Rungs can carry `criteria` — what has to be true before moving up — and the
// user's current rung persists so the ladder shows where they actually are
// rather than just what exists.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { Icon } from './Icons'
import primers from '../data/primers.json'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const K = {
  inset: '#16233a', border: 'rgba(255,255,255,0.06)',
  violet: '#c084fc', pink: '#ec4899', amber: '#f59e0b',
  text: '#f8fafc', muted: '#94a3b8', dim: '#475569',
}

const seenKey = eq => `strongbase_primer_seen_${eq}`

/**
 * Find a primer for an exercise — an explicit `primer` field wins, otherwise
 * the first piece of equipment that has one.
 */
export function findPrimer(equipment = [], primerKey = null) {
  if (primerKey && primers[primerKey]) return { eq: primerKey, ...primers[primerKey] }
  const eq = equipment.find(e => primers[e]?.matchEquipment === e)
  return eq ? { eq, ...primers[eq] } : null
}

export default function EquipmentPrimer({ equipment, exerciseId, primerKey }) {
  const primer = findPrimer(equipment, primerKey)
  const [open, setOpen] = useState(() => {
    if (!primer) return false
    try { return localStorage.getItem(seenKey(primer.eq)) !== '1' } catch { return true }
  })

  if (!primer) return null

  function dismiss() {
    setOpen(false)
    try { localStorage.setItem(seenKey(primer.eq), '1') } catch {}
  }

  // Collapsed — a quiet one-line way back in.
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16,
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontFamily: FONT, fontSize: 13, fontWeight: 700, color: K.violet,
        }}
      >
        <Icon name="target" size={14} style={{ color: K.violet }} />
        {primer.title}
      </button>
    )
  }

  const ladderIdx = primer.ladder?.indexOf(exerciseId) ?? -1
  // Rungs are optional; a primer can be a flat ladder (kettlebell) or a graded
  // one with move-up criteria (power).
  const rung = primer.rungs?.find(r => r.exercises?.includes(exerciseId)) ?? null

  return (
    <div style={{
      backgroundColor: 'rgba(236,72,153,0.06)',
      border: '1px solid rgba(236,72,153,0.24)',
      borderRadius: 14, padding: 16, marginBottom: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div>
          <p style={{
            fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.pink,
            letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 5px',
          }}>{primer.eyebrow || 'New equipment'}</p>
          <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: 16, color: K.text, margin: 0 }}>
            {primer.title}
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Got it"
          style={{
            flexShrink: 0, backgroundColor: K.inset, border: `1px solid ${K.border}`,
            borderRadius: 8, color: K.muted, cursor: 'pointer',
            fontSize: 11, fontWeight: 700, padding: '5px 10px',
          }}
        >Got it</button>
      </div>

      <p style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 14px', maxWidth: '66ch' }}>
        {primer.intro}
      </p>

      {primer.points?.map(p => (
        <div key={p.heading} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: K.pink, flexShrink: 0, marginTop: 7 }} />
          <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.55, margin: 0, maxWidth: '66ch' }}>
            <span style={{ color: K.text, fontWeight: 700 }}>{p.heading} — </span>{p.body}
          </p>
        </div>
      ))}

      {/* Progression ladder — shows where this exercise sits on the on-ramp */}
      {primer.ladder?.length > 0 && (
        <div style={{
          marginTop: 14, backgroundColor: K.inset,
          borderRadius: 10, padding: '12px 14px',
        }}>
          <p style={{
            fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: K.dim,
            letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 10px',
          }}>Learn in this order</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            {primer.ladder.map((id, i) => {
              const isHere   = id === exerciseId
              const isBefore = ladderIdx >= 0 && i < ladderIdx
              return (
                <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {i > 0 && <span style={{ color: K.dim, fontSize: 11 }}>→</span>}
                  <span style={{
                    fontFamily: MONO, fontSize: 10, fontWeight: 700,
                    padding: '4px 9px', borderRadius: 99,
                    backgroundColor: isHere ? K.pink : 'transparent',
                    color: isHere ? '#fff' : isBefore ? K.muted : K.dim,
                    border: isHere ? 'none' : `1px solid ${K.border}`,
                  }}>
                    {primer.ladderLabels?.[id] || id}
                  </span>
                </span>
              )
            })}
          </div>
          {primer.ladderNote && (
            <p style={{ fontSize: 12.5, color: K.muted, lineHeight: 1.55, margin: 0, maxWidth: '64ch' }}>
              {primer.ladderNote}
            </p>
          )}

          {/* Move-up criteria for the rung this exercise sits on. A rung isn't
              passed by doing it once — it's passed by doing it for the time
              floor with no symptoms. */}
          {rung && (
            <div style={{ marginTop: 12, borderTop: `1px solid ${K.border}`, paddingTop: 11 }}>
              <p style={{
                fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: K.dim,
                letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 7px',
              }}>Before moving up</p>
              {rung.criteria.map(c => (
                <div key={c} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                  <span style={{ color: K.dim, flexShrink: 0, lineHeight: 1.5 }}>·</span>
                  <p style={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.5, margin: 0, maxWidth: '62ch' }}>{c}</p>
                </div>
              ))}
              {rung.gated && (
                <p style={{
                  fontSize: 12.5, lineHeight: 1.5, margin: '9px 0 0', maxWidth: '62ch',
                  color: '#fca5a5',
                }}>
                  This rung isn't unlocked by reps. It needs someone watching you move — a
                  physio's opinion beats any rule an app can give you here.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Caveats sit in the open rather than in small print. Where the evidence
          is thinner than it's usually claimed to be, saying so is the point. */}
      {primer.caveats?.length > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary style={{
            cursor: 'pointer', listStyle: 'none',
            fontFamily: FONT, fontSize: 12.5, fontWeight: 700, color: K.muted,
          }}>
            What this app isn't certain about →
          </summary>
          <div style={{ marginTop: 10 }}>
            {primer.caveats.map(c => (
              <p key={c} style={{
                fontSize: 12.5, color: K.muted, lineHeight: 1.55,
                margin: '0 0 9px', maxWidth: '64ch',
              }}>{c}</p>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
