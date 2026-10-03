// Plan Library — browse the training plans and switch to one.
// Switching starts the new plan today at Day 1; workout history is untouched
// (it lives in its own table). Plan id + start date are kept in the user's
// auth metadata, the same place Home's "restart program" writes to.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuth from '../hooks/useAuth'
import useExerciseLibrary from '../hooks/useExerciseLibrary'
import { PLANS, getActivePlan } from '../data/plans'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const K = {
  bg: '#0a0e1a', card: '#101828', inset: '#16233a',
  border: 'rgba(255,255,255,0.06)', borderSt: 'rgba(255,255,255,0.10)',
  pink: '#ec4899', purple: '#8b5cf6', violet: '#c084fc',
  grad: 'linear-gradient(90deg,#ec4899,#8b5cf6)',
  gradH: 'linear-gradient(130deg, #fb923c 0%, #ec4899 48%, #8b5cf6 100%)',
  amber: '#f59e0b', teal: '#2dd4bf', green: '#22c55e',
  text: '#f8fafc', muted: '#94a3b8', subtle: '#64748b', dim: '#475569',
}

const label = { fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }

function Pill({ children, color = K.muted }) {
  return (
    <span style={{ ...label, fontSize: 9.5, color, background: K.inset, border: `1px solid ${K.border}`, borderRadius: 999, padding: '4px 9px' }}>
      {children}
    </span>
  )
}

function WeekStrip({ plan }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
      {plan.days.map(d => (
        <div key={d.day} title={d.theme} style={{
          background: K.inset, border: `1px solid ${K.border}`, borderRadius: 10,
          padding: '8px 2px 6px', textAlign: 'center', opacity: d.optional ? 0.45 : 1, minWidth: 0,
        }}>
          <div style={{ fontSize: 17, lineHeight: 1 }}>{d.emoji}</div>
          <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 600, color: d.optional ? K.subtle : K.muted, marginTop: 5, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {d.theme}
          </div>
        </div>
      ))}
    </div>
  )
}

function Section({ title, open, onToggle, children }) {
  return (
    <div style={{ borderTop: `1px solid ${K.border}` }}>
      <button onClick={onToggle} aria-expanded={open} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: K.text,
      }}>
        <span style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700 }}>{title}</span>
        <span style={{ color: K.subtle, fontSize: 14 }}>{open ? '−' : '+'}</span>
      </button>
      {open && <div style={{ paddingBottom: 14 }}>{children}</div>}
    </div>
  )
}

function PlanCard({ plan, isActive, onStart, exMap }) {
  const [open, setOpen] = useState(null) // 'who' | 'why' | 'days' | null
  const toggle = k => setOpen(o => (o === k ? null : k))

  return (
    <div style={{ background: K.card, border: `1px solid ${isActive ? K.purple : K.border}`, borderRadius: 18, padding: 18 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <Pill color={K.violet}>{plan.level}</Pill>
        <Pill>{plan.daysPerWeek} days/week</Pill>
        {isActive && <Pill color={K.green}>Current</Pill>}
      </div>
      <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, margin: 0, color: K.text }}>{plan.name}</h2>
      <p style={{ fontFamily: FONT, fontSize: 13.5, color: K.muted, margin: '4px 0 14px', lineHeight: 1.45 }}>{plan.tagline}</p>

      <WeekStrip plan={plan} />

      <div style={{ marginTop: 12 }}>
        <Section title="Who it's for" open={open === 'who'} onToggle={() => toggle('who')}>
          <p style={{ fontFamily: FONT, fontSize: 13.5, color: K.muted, lineHeight: 1.55, margin: 0 }}>{plan.whoFor}</p>
        </Section>
        <Section title="Why it works" open={open === 'why'} onToggle={() => toggle('why')}>
          <p style={{ fontFamily: FONT, fontSize: 13.5, color: K.muted, lineHeight: 1.55, margin: 0 }}>{plan.why}</p>
        </Section>
        <Section title="The 7 days" open={open === 'days'} onToggle={() => toggle('days')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {plan.days.map(d => (
              <div key={d.day} style={{ opacity: d.optional ? 0.7 : 1 }}>
                <p style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: K.text, margin: 0 }}>
                  <span style={{ ...label, color: K.dim, marginRight: 8 }}>Day {d.day}</span>
                  {d.emoji} {d.theme}
                  {d.optional && <span style={{ ...label, fontSize: 9, color: K.subtle, marginLeft: 8 }}>Optional</span>}
                </p>
                <p style={{ fontFamily: FONT, fontSize: 12.5, color: K.subtle, margin: '3px 0 0', lineHeight: 1.5 }}>
                  {d.durationMinutes} min · {d.exerciseIds.map(id => exMap?.[id]?.name || id).join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {!isActive && (
        <button onClick={() => onStart(plan)} style={{
          marginTop: 6, width: '100%', border: 'none', borderRadius: 12, padding: '13px 16px', cursor: 'pointer',
          background: K.grad, color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 14,
        }}>
          Start this plan
        </button>
      )}
    </div>
  )
}

export default function Plans() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { exMap } = useExerciseLibrary()
  const [confirm, setConfirm] = useState(null) // plan awaiting confirmation
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const active = getActivePlan(user)

  async function startPlan() {
    setBusy(true)
    setError('')
    try {
      const today = new Date().toISOString().slice(0, 10)
      const { error: err } = await supabase.auth.updateUser({ data: { planId: confirm.id, programStartDate: today } })
      if (err) throw err
      await supabase.auth.refreshSession()
      navigate('/')
    } catch {
      setError('Could not switch plans. Check your connection and try again.')
      setBusy(false)
    }
  }

  return (
    <div style={{ backgroundColor: K.bg, minHeight: '100svh', color: K.text }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 16px 120px' }}>
        <button onClick={() => navigate(-1)} style={{
          ...label, background: 'none', border: 'none', color: K.subtle, cursor: 'pointer', padding: '4px 0', marginBottom: 14,
        }}>
          ← Back
        </button>

        <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, margin: 0, lineHeight: 1.1 }}>Plans</h1>
        <p style={{ fontFamily: FONT, fontSize: 13.5, color: K.muted, margin: '6px 0 22px', lineHeight: 1.5 }}>
          Pick the weekly structure that fits your life. Each plan is a 7-day cycle.
        </p>

        <p style={{ ...label, color: K.dim, margin: '0 0 8px' }}>Current plan</p>
        <PlanCard plan={active} isActive onStart={() => {}} exMap={exMap} />

        <p style={{ ...label, color: K.dim, margin: '26px 0 8px' }}>Other plans</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {PLANS.filter(p => p.id !== active.id).map(p => (
            <PlanCard key={p.id} plan={p} isActive={false} onStart={setConfirm} exMap={exMap} />
          ))}
        </div>
      </div>

      {confirm && (
        <div onClick={() => !busy && setConfirm(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" style={{
            width: '100%', maxWidth: 480, background: K.card, border: `1px solid ${K.borderSt}`,
            borderRadius: '20px 20px 0 0', padding: '22px 20px 28px',
          }}>
            <h3 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, margin: 0 }}>Switch to {confirm.name}?</h3>
            <p style={{ fontFamily: FONT, fontSize: 13.5, color: K.muted, lineHeight: 1.55, margin: '8px 0 16px' }}>
              Starts today at Day 1. Your history is kept.
            </p>
            {error && <p style={{ fontFamily: FONT, fontSize: 12.5, color: K.pink, margin: '0 0 12px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button disabled={busy} onClick={() => setConfirm(null)} style={{
                flex: 1, background: K.inset, border: `1px solid ${K.border}`, color: K.muted, borderRadius: 12,
                padding: '13px 0', fontFamily: FONT, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>Cancel</button>
              <button disabled={busy} onClick={startPlan} style={{
                flex: 1.4, background: K.grad, border: 'none', color: '#fff', borderRadius: 12,
                padding: '13px 0', fontFamily: FONT, fontWeight: 800, fontSize: 14, cursor: 'pointer', opacity: busy ? 0.6 : 1,
              }}>{busy ? 'Starting…' : 'Start today'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
