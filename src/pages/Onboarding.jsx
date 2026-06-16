import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuth from '../hooks/useAuth'
import { Icon } from '../components/Icons'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"
const K = {
  bg: '#0a0e1a', card: '#101828', inset: '#16233a',
  border: 'rgba(255,255,255,0.06)', borderSt: 'rgba(255,255,255,0.10)',
  violet: '#c084fc', pink: '#ec4899', purple: '#8b5cf6',
  grad: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
  gradH: 'linear-gradient(130deg,#fb923c 0%,#ec4899 48%,#8b5cf6 100%)',
  text: '#f8fafc', muted: '#94a3b8', dim: '#64748b',
  selBg: 'rgba(192,132,252,0.10)', selBorder: 'rgba(192,132,252,0.45)',
}

const HEADING = { fontFamily: FONT, fontWeight: 800, color: K.text }

// ── Step 1: Welcome ───────────────────────────────────────────────────────────
function StepWelcome({ onNext }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 48 }}>
      <div style={{ width: 80, height: 80, borderRadius: 24, background: K.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, color: '#fff', boxShadow: '0 0 40px rgba(236,72,153,0.3)' }}>
        <Icon name="strength" size={40} strokeWidth={1.5} />
      </div>

      <h1 style={{ ...HEADING, fontSize: 32, margin: 0, lineHeight: 1.2 }}>
        Built for real life<br />after 35
      </h1>
      <p style={{ color: K.muted, fontSize: 16, marginTop: 16, marginBottom: 0, lineHeight: 1.6, maxWidth: 280 }}>
        StrongBase gives you a smart 7-day home workout plan — no gym, no guesswork, just results.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 40, width: '100%' }}>
        {[
          { iconName: 'clock',    text: '20 minutes a day, 5 days a week' },
          { iconName: 'home',     text: 'Home or gym — your plan adapts to where you train' },
          { iconName: 'target',   text: 'Designed around your real movement patterns' },
        ].map(({ iconName, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14, backgroundColor: K.card, borderRadius: 12, padding: '14px 16px', border: `1px solid ${K.border}` }}>
            <span style={{ color: K.violet, flexShrink: 0 }}><Icon name={iconName} size={20} /></span>
            <span style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.4 }}>{text}</span>
          </div>
        ))}
      </div>

      <PrimaryButton onClick={onNext} style={{ marginTop: 40 }}>Let's build your plan →</PrimaryButton>
    </div>
  )
}

// ── Step 2: Fitness Level ─────────────────────────────────────────────────────
const FITNESS_OPTIONS = [
  { id: 'beginner',     label: 'Just getting started', sub: 'Little or no current exercise routine', icon: '🌱' },
  { id: 'intermediate', label: 'Some experience',      sub: 'Exercise a few times a month',          icon: '🔥' },
  { id: 'active',       label: 'Fairly active',        sub: 'I work out 1–2 times a week',           icon: '⚡' },
]

function StepFitness({ value, onChange, onNext }) {
  return (
    <div>
      <h2 style={{ ...HEADING, fontSize: 26, margin: 0 }}>How active are you right now?</h2>
      <p style={{ color: K.muted, fontSize: 14, marginTop: 8, marginBottom: 32 }}>We'll tailor your plan to meet you where you are.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FITNESS_OPTIONS.map(opt => {
          const sel = value === opt.id
          return (
            <button key={opt.id} onClick={() => onChange(opt.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, backgroundColor: sel ? K.selBg : K.card, border: `2px solid ${sel ? K.selBorder : K.border}`, borderRadius: 16, padding: '16px 18px', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s ease' }}>
              <span style={{ fontSize: 28 }}>{opt.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ ...HEADING, fontSize: 15, margin: 0, color: sel ? K.violet : K.text }}>{opt.label}</p>
                <p style={{ fontSize: 13, color: K.muted, margin: 0, marginTop: 2 }}>{opt.sub}</p>
              </div>
              {sel && <Icon name="check" size={18} strokeWidth={2.5} style={{ color: K.violet, flexShrink: 0 }} />}
            </button>
          )
        })}
      </div>

      <PrimaryButton onClick={onNext} disabled={!value} style={{ marginTop: 32 }}>Continue →</PrimaryButton>
    </div>
  )
}

// ── Step 3: Equipment ─────────────────────────────────────────────────────────
const EQUIP_OPTIONS = [
  { id: 'bodyweight',      icon: '💪', label: 'Just my body',            sub: 'Always available' },
  { id: 'yoga-mat',        icon: '🧘', label: 'Exercise mat',            sub: 'For floor work' },
  { id: 'resistance-band', icon: '🎗️', label: 'Resistance bands',        sub: 'Loop bands or long band' },
  { id: 'trx',             icon: '🪢', label: 'TRX / Suspension trainer', sub: 'Anchored to wall or door' },
  { id: '10lb-dumbbells',  icon: '🏋️', label: '10 lb dumbbells',         sub: 'Pair' },
  { id: '15lb-dumbbells',  icon: '🏋️', label: '15 lb dumbbells',         sub: 'Pair' },
]

function StepEquipment({ value, onChange, onNext }) {
  function toggle(id) {
    if (id === 'bodyweight') return
    onChange(value.includes(id) ? value.filter(e => e !== id) : [...value, id])
  }

  return (
    <div>
      <h2 style={{ ...HEADING, fontSize: 26, margin: 0 }}>What do you have at home?</h2>
      <p style={{ color: K.muted, fontSize: 14, marginTop: 8, marginBottom: 32 }}>Select everything you have access to. The plan works with any combination.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {EQUIP_OPTIONS.map(opt => {
          const sel   = value.includes(opt.id)
          const locked = opt.id === 'bodyweight'
          return (
            <button key={opt.id} onClick={() => toggle(opt.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, backgroundColor: sel ? K.selBg : K.card, border: `2px solid ${sel ? K.selBorder : K.border}`, borderRadius: 14, padding: '14px 16px', cursor: locked ? 'default' : 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s ease' }}>
              <span style={{ fontSize: 24 }}>{opt.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ ...HEADING, fontSize: 14, margin: 0, color: sel ? K.violet : K.text }}>
                  {opt.label}
                  {locked && <span style={{ fontSize: 11, color: K.dim, fontWeight: 400, marginLeft: 8 }}>always included</span>}
                </p>
                <p style={{ fontSize: 12, color: K.muted, margin: 0, marginTop: 1 }}>{opt.sub}</p>
              </div>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${sel ? K.violet : K.dim}`, backgroundColor: sel ? K.violet : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {sel && <Icon name="check" size={13} strokeWidth={3} style={{ color: '#0a0e1a' }} />}
              </div>
            </button>
          )
        })}
      </div>

      <PrimaryButton onClick={onNext} style={{ marginTop: 32 }}>Continue →</PrimaryButton>
    </div>
  )
}

// ── Step 4: Commitment ────────────────────────────────────────────────────────
const TIME_OPTIONS = [
  { id: 'morning',   icon: '🌅', label: 'Morning',   sub: 'Before the day starts' },
  { id: 'afternoon', icon: '☀️', label: 'Afternoon', sub: 'Midday break' },
  { id: 'evening',   icon: '🌙', label: 'Evening',   sub: 'Wind down with intention' },
]

function StepCommitment({ value, onChange, onNext }) {
  return (
    <div>
      <h2 style={{ ...HEADING, fontSize: 26, margin: 0 }}>When do you like to work out?</h2>
      <p style={{ color: K.muted, fontSize: 14, marginTop: 8, marginBottom: 28 }}>Pick the time that fits your day most naturally.</p>

      <div style={{ display: 'flex', gap: 10 }}>
        {TIME_OPTIONS.map(opt => {
          const sel = value === opt.id
          return (
            <button key={opt.id} onClick={() => onChange(opt.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px 8px', backgroundColor: sel ? K.selBg : K.card, border: `2px solid ${sel ? K.selBorder : K.border}`, borderRadius: 16, cursor: 'pointer', transition: 'all 0.15s ease' }}>
              <span style={{ fontSize: 26 }}>{opt.icon}</span>
              <p style={{ ...HEADING, fontSize: 13, margin: 0, color: sel ? K.violet : K.text }}>{opt.label}</p>
              <p style={{ fontSize: 11, color: K.muted, margin: 0, textAlign: 'center', lineHeight: 1.3 }}>{opt.sub}</p>
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 28, backgroundColor: K.card, borderRadius: 16, padding: 20, border: `1px solid ${K.border}` }}>
        <p style={{ ...HEADING, fontSize: 15, margin: 0 }}>The StrongBase commitment</p>
        <p style={{ color: K.muted, fontSize: 13, marginTop: 8, marginBottom: 0, lineHeight: 1.6 }}>
          20 minutes a day. 5 days a week. 7 days to build a habit that lasts. That's all it takes.
        </p>
      </div>

      <PrimaryButton onClick={onNext} disabled={!value} style={{ marginTop: 28 }}>I'm in →</PrimaryButton>
    </div>
  )
}

// ── Step 5: Plan Ready ────────────────────────────────────────────────────────
function StepReady({ answers, onStart, saving }) {
  const timeLabel    = TIME_OPTIONS.find(t => t.id === answers.preferredTime)?.label || 'your preferred time'
  const fitnessLabel = FITNESS_OPTIONS.find(f => f.id === answers.fitnessLevel)?.label || 'your level'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ width: 96, height: 96, borderRadius: '50%', background: K.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, color: '#fff', boxShadow: '0 0 50px rgba(236,72,153,0.35)', animation: 'kPulse 2s ease-in-out infinite' }}>
        <Icon name="target" size={48} strokeWidth={1.3} />
      </div>

      <h2 style={{ ...HEADING, fontSize: 30, margin: 0 }}>Your plan is ready.</h2>
      <p style={{ color: K.muted, fontSize: 15, marginTop: 12, marginBottom: 0, lineHeight: 1.6 }}>
        Personalised for <span style={{ color: K.violet, fontWeight: 600 }}>{fitnessLabel.toLowerCase()}</span>,{' '}
        scheduled for <span style={{ color: K.violet, fontWeight: 600 }}>{timeLabel.toLowerCase()}</span>.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 24 }}>
        {['7-day program', '20 min/session', 'Home-based', 'Beginner-friendly'].map(tag => (
          <span key={tag} style={{ padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, backgroundColor: 'rgba(192,132,252,0.12)', color: K.violet, border: '1px solid rgba(192,132,252,0.25)' }}>
            {tag}
          </span>
        ))}
      </div>

      <div style={{ width: '100%', marginTop: 36 }}>
        <PrimaryButton onClick={onStart} disabled={saving}>{saving ? 'Setting up…' : 'Start Day 1 →'}</PrimaryButton>
      </div>

      <style>{`
        @keyframes kPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(236,72,153,0.3); }
          50%       { box-shadow: 0 0 70px rgba(139,92,246,0.5); }
        }
      `}</style>
    </div>
  )
}

// ── Shared components ─────────────────────────────────────────────────────────
function PrimaryButton({ onClick, disabled, children, style }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', minHeight: 52,
        background: disabled ? K.inset : K.grad,
        color: disabled ? K.dim : '#fff',
        borderRadius: 16, border: 'none',
        fontFamily: FONT, fontWeight: 700, fontSize: 15,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'opacity 0.15s ease',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

function StepIndicator({ current, total }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 40 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ height: 4, borderRadius: 999, width: i === current ? 24 : 8, background: i <= current ? K.grad : K.inset, transition: 'all 0.3s ease' }} />
      ))}
    </div>
  )
}

// ── Main Onboarding component ─────────────────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [step,   setStep]   = useState(0)
  const [saving, setSaving] = useState(false)

  const [answers, setAnswers] = useState({
    fitnessLevel:  '',
    equipment:     ['bodyweight'],
    preferredTime: '',
  })

  const TOTAL_STEPS = 5
  function next() { setStep(s => Math.min(s + 1, TOTAL_STEPS - 1)) }

  async function handleFinish() {
    setSaving(true)
    const today = new Date().toISOString().slice(0, 10)

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          fitnessLevel:       answers.fitnessLevel,
          equipment:          answers.equipment,
          preferredTime:      answers.preferredTime,
          programStartDate:   today,
          onboardingComplete: true,
        },
      })
      if (error) throw error
    } catch (e) {
      console.error('Failed to save onboarding data:', e)
      try { localStorage.setItem('strongbase_onboarding_complete', 'true') } catch {}
    }

    setSaving(false)
    navigate('/', { replace: true })
  }

  const screens = [
    <StepWelcome key="welcome" onNext={next} />,
    <StepFitness    key="fitness"    value={answers.fitnessLevel}  onChange={v => setAnswers(a => ({ ...a, fitnessLevel: v }))}  onNext={next} />,
    <StepEquipment  key="equipment"  value={answers.equipment}      onChange={v => setAnswers(a => ({ ...a, equipment: v }))}      onNext={next} />,
    <StepCommitment key="commitment" value={answers.preferredTime} onChange={v => setAnswers(a => ({ ...a, preferredTime: v }))} onNext={next} />,
    <StepReady      key="ready"      answers={answers}              onStart={handleFinish}                                          saving={saving} />,
  ]

  return (
    <div style={{ minHeight: '100svh', backgroundColor: K.bg, display: 'flex', flexDirection: 'column', padding: '0 24px', paddingTop: 'max(env(safe-area-inset-top), 48px)', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)', boxSizing: 'border-box', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ height: 44, display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <button onClick={() => setStep(s => s - 1)} style={{ background: 'none', border: 'none', color: K.muted, cursor: 'pointer', padding: '8px 0', fontSize: 15 }}>
            ← Back
          </button>
        )}
      </div>

      {step > 0 && step < TOTAL_STEPS - 1 && (
        <StepIndicator current={step - 1} total={TOTAL_STEPS - 2} />
      )}

      <div style={{ flex: 1 }}>{screens[step]}</div>
    </div>
  )
}
