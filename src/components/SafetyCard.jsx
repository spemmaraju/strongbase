// Global "when to stop" reference.
// ---------------------------------------------------------------------------
// Reachable from the "Stop if" line on every exercise's sensation card, and
// from Profile. Three tiers, deliberately escalating: change something / call
// someone this week / emergency now.
//
// The emergency tier is cauda equina syndrome. It is rare, but this user has a
// lumbar discectomy history, which puts it on the list — and it is the one
// back symptom where hours matter.
// ---------------------------------------------------------------------------

import { useEffect } from 'react'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const K = {
  panel: '#0a111e', card: '#101828', inset: '#16233a',
  border: 'rgba(255,255,255,0.06)', borderSt: 'rgba(255,255,255,0.10)',
  violet: '#c084fc', amber: '#f59e0b', teal: '#2dd4bf',
  text: '#f8fafc', muted: '#94a3b8', dim: '#475569',
}

const TIERS = [
  {
    tone:   { fg: '#fbbf24', bg: 'rgba(245,158,11,0.07)', bd: 'rgba(245,158,11,0.25)' },
    label:  'Stop this set and change something',
    items: [
      'Sharp, pinching, or catching pain right at a joint',
      'Pain over 5 out of 10 at any point',
      'Pain that makes you change how you move to get through the rep',
      'One side hurting in a way the other side does not',
    ],
    footer: 'Drop the weight, shorten the range, and try one set. If it is still there, skip the exercise today. That is not a setback — it is the system working.',
  },
  {
    tone:   { fg: '#fb923c', bg: 'rgba(251,146,60,0.07)', bd: 'rgba(251,146,60,0.28)' },
    label:  'Stop the session — contact a clinician this week',
    items: [
      'Pain that travels down your leg or arm, past the knee or elbow',
      'Pins and needles, numbness, or burning in a stripe down a limb',
      'A leg or arm that feels weak or gives way',
      'Back symptoms that move further down your leg during the session',
      'Swelling, or soreness still getting worse more than 3 days later',
    ],
    footer: 'These are nerve and tissue signals. They are not form problems, and no cue in this app will fix them.',
  },
  {
    tone:   { fg: '#f87171', bg: 'rgba(239,68,68,0.09)', bd: 'rgba(239,68,68,0.32)' },
    label:  'Get emergency care now — do not wait',
    items: [
      'Loss of control of your bladder or bowels',
      'Numbness in the saddle area: groin, genitals, inner thighs, or buttocks',
      'Sudden weakness in both legs',
    ],
    footer: 'Given your surgical history these need same-day emergency assessment. Nerve compression treated quickly usually recovers; left alone it can cause permanent damage.',
  },
]

export default function SafetyCard({ onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', h)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 80,
        backgroundColor: 'rgba(3,6,14,0.82)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 560, maxHeight: '88svh', overflowY: 'auto',
        backgroundColor: K.card, border: `1px solid ${K.borderSt}`,
        borderRadius: 22, padding: 26, position: 'relative',
      }}>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 18, right: 18, width: 30, height: 30,
            borderRadius: '50%', backgroundColor: K.inset, border: `1px solid ${K.border}`,
            color: K.muted, cursor: 'pointer', fontSize: 15, lineHeight: 1,
          }}
        >×</button>

        <p style={{
          fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.violet,
          letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 8px',
        }}>Reference</p>
        <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, color: K.text, margin: '0 0 20px' }}>
          When to stop
        </h2>

        {TIERS.map(t => (
          <div key={t.label} style={{
            backgroundColor: t.tone.bg, border: `1px solid ${t.tone.bd}`,
            borderRadius: 14, padding: 16, marginBottom: 12,
          }}>
            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14.5, color: t.tone.fg, margin: '0 0 10px' }}>
              {t.label}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px' }}>
              {t.items.map(i => (
                <li key={i} style={{ display: 'flex', gap: 9, marginBottom: 6 }}>
                  <span style={{ color: t.tone.fg, flexShrink: 0, lineHeight: 1.55 }}>•</span>
                  <span style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.55 }}>{i}</span>
                </li>
              ))}
            </ul>
            <p style={{ fontSize: 13, color: K.muted, lineHeight: 1.55, margin: 0 }}>{t.footer}</p>
          </div>
        ))}

        {/* Centralisation — the single most useful self-check for this user */}
        <div style={{
          backgroundColor: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.2)',
          borderRadius: 14, padding: 16, marginBottom: 12,
        }}>
          <p style={{
            fontFamily: MONO, fontSize: 9, fontWeight: 700, color: K.teal,
            letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 8px',
          }}>The direction rule</p>
          <p style={{ fontSize: 13.5, color: 'rgba(153,246,228,0.88)', lineHeight: 1.6, margin: 0 }}>
            If back symptoms move <strong>back toward your spine</strong>, that is a good sign — keep going.
            If they move <strong>further down your leg</strong>, that is a bad sign — stop that movement.
            Direction matters more than intensity.
          </p>
        </div>

        <p style={{ fontSize: 12.5, color: K.dim, lineHeight: 1.6, margin: 0 }}>
          This app can help you find the right muscle. It cannot tell you whether something is
          injured. When in doubt, the answer is a clinician, not a different cue.
        </p>
      </div>
    </div>
  )
}
