// Monthly mobility self-check — card + modal.
// ---------------------------------------------------------------------------
// Deliberately passive. No prompt, no nudge, no streak — it sits on History
// with a "last checked N weeks ago" line and waits to be noticed.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import useMobilityCheck, { QUESTIONS, answerRank, answerLabel } from '../hooks/useMobilityCheck'
import { Icon } from './Icons'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const K = {
  card: '#101828', inset: '#16233a',
  border: 'rgba(255,255,255,0.06)', borderSt: 'rgba(255,255,255,0.10)',
  violet: '#c084fc', teal: '#2dd4bf', green: '#22c55e', amber: '#f59e0b',
  gradD: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
  text: '#f8fafc', muted: '#94a3b8', dim: '#475569',
}

function agoLabel(days) {
  if (days == null) return 'never checked'
  if (days === 0) return 'checked today'
  if (days === 1) return 'checked yesterday'
  if (days < 14) return `checked ${days} days ago`
  const weeks = Math.floor(days / 7)
  return `checked ${weeks} weeks ago`
}

export default function MobilityCheckCard({ style }) {
  const { latest, previous, daysSince, save } = useMobilityCheck()
  const [open, setOpen]       = useState(false)
  const [answers, setAnswers] = useState({})
  const [saving, setSaving]   = useState(false)

  const complete = QUESTIONS.every(q => answers[q.id])

  async function commit() {
    setSaving(true)
    await save(answers)
    setSaving(false)
    setOpen(false)
    setAnswers({})
  }

  return (
    <div style={{
      backgroundColor: K.card, border: `1px solid ${K.borderSt}`,
      borderRadius: 18, padding: 18, ...style,
    }}>
      <p style={{
        fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.dim,
        letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 4px',
      }}>Mobility check</p>
      <p style={{ fontFamily: FONT, fontSize: 13, color: K.muted, margin: '0 0 14px' }}>
        {agoLabel(daysSince)}
      </p>

      {latest && (
        <div style={{ marginBottom: 14 }}>
          {QUESTIONS.map(q => {
            const now = latest.answers[q.id]
            const was = previous?.answers?.[q.id]
            const delta = was ? answerRank(q.id, now) - answerRank(q.id, was) : 0
            return (
              <div key={q.id} style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: K.dim, minWidth: 92 }}>
                  {q.id === 'toeTouch' ? 'Toe touch'
                    : q.id === 'behindBack' ? 'Behind back'
                    : q.id === 'lunge' ? 'Lunge heel' : 'Balance'}
                </span>
                <span style={{ fontSize: 12.5, color: '#cbd5e1', flex: 1 }}>
                  {answerLabel(q.id, now)}
                </span>
                {delta !== 0 && (
                  <span style={{
                    fontFamily: MONO, fontSize: 10, fontWeight: 700,
                    color: delta > 0 ? K.green : K.amber,
                  }}>{delta > 0 ? '↑' : '↓'}</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', minHeight: 40, borderRadius: 11, cursor: 'pointer',
          backgroundColor: K.inset, border: `1px solid ${K.borderSt}`,
          color: K.text, fontFamily: FONT, fontWeight: 700, fontSize: 13,
        }}
      >{latest ? 'Check again' : 'Take the 2-minute check'}</button>

      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 70,
            backgroundColor: 'rgba(3,6,14,0.84)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div style={{
            width: '100%', maxWidth: 480, maxHeight: '88svh', overflowY: 'auto',
            backgroundColor: K.card, border: `1px solid ${K.borderSt}`,
            borderRadius: 22, padding: 24,
          }}>
            <p style={{
              fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.violet,
              letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 6px',
            }}>Mobility check</p>
            <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 21, color: K.text, margin: '0 0 6px' }}>
              Four questions
            </h2>
            <p style={{ fontSize: 13, color: K.muted, margin: '0 0 20px', lineHeight: 1.55 }}>
              Do them warm, not cold — right after a session is ideal. Answer honestly rather
              than optimistically; the point is the change between checks, not the score.
            </p>

            {QUESTIONS.map((q, qi) => (
              <div key={q.id} style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 13.5, color: '#cbd5e1', margin: '0 0 8px', lineHeight: 1.5 }}>
                  <span style={{ color: K.dim, fontFamily: MONO, fontSize: 11, marginRight: 7 }}>
                    {qi + 1}
                  </span>
                  {q.prompt}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {q.options.map(o => {
                    const sel = answers[q.id] === o.value
                    return (
                      <button
                        key={o.value}
                        onClick={() => setAnswers(a => ({ ...a, [q.id]: o.value }))}
                        style={{
                          padding: '7px 12px', borderRadius: 99, cursor: 'pointer',
                          fontFamily: FONT, fontSize: 12.5, fontWeight: 600,
                          backgroundColor: sel ? 'rgba(192,132,252,0.16)' : K.inset,
                          color: sel ? K.violet : K.muted,
                          border: `1px solid ${sel ? 'rgba(192,132,252,0.45)' : K.border}`,
                        }}
                      >{o.label}</button>
                    )
                  })}
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={() => { setOpen(false); setAnswers({}) }}
                style={{
                  flex: 1, minHeight: 46, borderRadius: 13, cursor: 'pointer',
                  backgroundColor: 'transparent', border: `1px solid ${K.borderSt}`,
                  color: K.muted, fontFamily: FONT, fontWeight: 700, fontSize: 14,
                }}
              >Cancel</button>
              <button
                onClick={commit}
                disabled={!complete || saving}
                style={{
                  flex: 2, minHeight: 46, borderRadius: 13, border: 'none',
                  cursor: complete && !saving ? 'pointer' : 'not-allowed',
                  background: complete ? K.gradD : K.inset,
                  color: complete ? '#fff' : K.dim,
                  fontFamily: FONT, fontWeight: 700, fontSize: 14,
                }}
              >{saving ? 'Saving…' : complete ? 'Save check' : 'Answer all four'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
