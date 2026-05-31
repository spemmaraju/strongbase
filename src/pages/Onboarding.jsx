import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuth from '../hooks/useAuth'

// ── Shared style tokens ───────────────────────────────────────────────────────
const BG   = '#0F172A'
const SURF = '#1E293B'
const TEAL = '#14B8A6'
const MUTED = '#94A3B8'
const BORDER = 'rgba(255,255,255,0.06)'

const HEADING = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontWeight: 800,
  color: '#F8FAFC',
}

// ── Step 1: Welcome / Promise ─────────────────────────────────────────────────
function StepWelcome({ onNext }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 48 }}>
      {/* Logo mark */}
      <div style={{
        width: 80, height: 80, borderRadius: 24,
        background: 'linear-gradient(135deg, #0D9488 0%, #134E4A 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 32, boxShadow: '0 0 40px #14B8A630',
      }}>
        <span style={{ fontSize: 36 }}>💪</span>
      </div>

      <h1 style={{ ...HEADING, fontSize: 32, margin: 0, lineHeight: 1.2 }}>
        Built for real life<br />after 35
      </h1>
      <p style={{ color: MUTED, fontSize: 16, marginTop: 16, marginBottom: 0, lineHeight: 1.6, maxWidth: 280 }}>
        StrongBase gives you a smart 7-day home workout plan — no gym, no guesswork, just results.
      </p>

      {/* Value props */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 40, width: '100%' }}>
        {[
          { icon: '⏱', text: '20 minutes a day, 5 days a week' },
          { icon: '🏠', text: 'Home or gym — your plan adapts to where you train' },
          { icon: '📈', text: 'Designed around your real movement patterns' },
        ].map(({ icon, text }) => (
          <div key={text} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            backgroundColor: SURF, borderRadius: 12, padding: '14px 16px',
            border: `1px solid ${BORDER}`,
          }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.4 }}>{text}</span>
          </div>
        ))}
      </div>

      <PrimaryButton onClick={onNext} style={{ marginTop: 40 }}>
        Let's build your plan →
      </PrimaryButton>
    </div>
  )
}

// ── Step 2: Fitness Level ─────────────────────────────────────────────────────
const FITNESS_OPTIONS = [
  {
    id: 'beginner',
    label: 'Just getting started',
    sub: 'Little or no current exercise routine',
    icon: '🌱',
  },
  {
    id: 'intermediate',
    label: 'Some experience',
    sub: 'Exercise a few times a month',
    icon: '🔥',
  },
  {
    id: 'active',
    label: 'Fairly active',
    sub: 'I work out 1–2 times a week',
    icon: '⚡',
  },
]

function StepFitness({ value, onChange, onNext }) {
  return (
    <div>
      <h2 style={{ ...HEADING, fontSize: 26, margin: 0 }}>How active are you right now?</h2>
      <p style={{ color: MUTED, fontSize: 14, marginTop: 8, marginBottom: 32 }}>
        We'll tailor your plan to meet you where you are.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FITNESS_OPTIONS.map(opt => {
          const selected = value === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                backgroundColor: selected ? '#134E4A' : SURF,
                border: `2px solid ${selected ? TEAL : BORDER}`,
                borderRadius: 16, padding: '16px 18px',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 28 }}>{opt.icon}</span>
              <div>
                <p style={{ ...HEADING, fontSize: 15, margin: 0, color: selected ? '#2DD4BF' : '#F8FAFC' }}>
                  {opt.label}
                </p>
                <p style={{ fontSize: 13, color: MUTED, margin: 0, marginTop: 2 }}>{opt.sub}</p>
              </div>
              {selected && (
                <span style={{ marginLeft: 'auto', color: TEAL, fontSize: 18 }}>✓</span>
              )}
            </button>
          )
        })}
      </div>

      <PrimaryButton onClick={onNext} disabled={!value} style={{ marginTop: 32 }}>
        Continue →
      </PrimaryButton>
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
    if (id === 'bodyweight') return // always selected
    onChange(
      value.includes(id)
        ? value.filter(e => e !== id)
        : [...value, id]
    )
  }

  return (
    <div>
      <h2 style={{ ...HEADING, fontSize: 26, margin: 0 }}>What do you have at home?</h2>
      <p style={{ color: MUTED, fontSize: 14, marginTop: 8, marginBottom: 32 }}>
        Select everything you have access to. The plan works with any combination.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {EQUIP_OPTIONS.map(opt => {
          const selected = value.includes(opt.id)
          const locked = opt.id === 'bodyweight'
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                backgroundColor: selected ? '#134E4A' : SURF,
                border: `2px solid ${selected ? TEAL : BORDER}`,
                borderRadius: 14, padding: '14px 16px',
                cursor: locked ? 'default' : 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.15s ease',
                opacity: 1,
              }}
            >
              <span style={{ fontSize: 24 }}>{opt.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ ...HEADING, fontSize: 14, margin: 0, color: selected ? '#2DD4BF' : '#F8FAFC' }}>
                  {opt.label}
                  {locked && <span style={{ fontSize: 11, color: MUTED, fontWeight: 400, marginLeft: 8 }}>always included</span>}
                </p>
                <p style={{ fontSize: 12, color: MUTED, margin: 0, marginTop: 1 }}>{opt.sub}</p>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                border: `2px solid ${selected ? TEAL : '#334155'}`,
                backgroundColor: selected ? TEAL : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {selected && <span style={{ color: '#0F172A', fontSize: 13, fontWeight: 700 }}>✓</span>}
              </div>
            </button>
          )
        })}
      </div>

      <PrimaryButton onClick={onNext} style={{ marginTop: 32 }}>
        Continue →
      </PrimaryButton>
    </div>
  )
}

// ── Step 4: Commitment ────────────────────────────────────────────────────────
const TIME_OPTIONS = [
  { id: 'morning',   icon: '🌅', label: 'Morning', sub: 'Before the day starts' },
  { id: 'afternoon', icon: '☀️', label: 'Afternoon', sub: 'Midday break' },
  { id: 'evening',   icon: '🌙', label: 'Evening', sub: 'Wind down with intention' },
]

function StepCommitment({ value, onChange, onNext }) {
  return (
    <div>
      <h2 style={{ ...HEADING, fontSize: 26, margin: 0 }}>When do you like to work out?</h2>
      <p style={{ color: MUTED, fontSize: 14, marginTop: 8, marginBottom: 28 }}>
        Pick the time that fits your day most naturally.
      </p>

      <div style={{ display: 'flex', gap: 10 }}>
        {TIME_OPTIONS.map(opt => {
          const selected = value === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 6, padding: '16px 8px',
                backgroundColor: selected ? '#134E4A' : SURF,
                border: `2px solid ${selected ? TEAL : BORDER}`,
                borderRadius: 16, cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 26 }}>{opt.icon}</span>
              <p style={{ ...HEADING, fontSize: 13, margin: 0, color: selected ? '#2DD4BF' : '#F8FAFC' }}>
                {opt.label}
              </p>
              <p style={{ fontSize: 11, color: MUTED, margin: 0, textAlign: 'center', lineHeight: 1.3 }}>
                {opt.sub}
              </p>
            </button>
          )
        })}
      </div>

      {/* Commitment pledge */}
      <div style={{
        marginTop: 28, backgroundColor: SURF, borderRadius: 16, padding: 20,
        border: `1px solid ${BORDER}`,
      }}>
        <p style={{ ...HEADING, fontSize: 15, margin: 0 }}>The StrongBase commitment</p>
        <p style={{ color: MUTED, fontSize: 13, marginTop: 8, marginBottom: 0, lineHeight: 1.6 }}>
          20 minutes a day. 5 days a week. 7 days to build a habit that lasts. That's all it takes.
        </p>
      </div>

      <PrimaryButton onClick={onNext} disabled={!value} style={{ marginTop: 28 }}>
        I'm in →
      </PrimaryButton>
    </div>
  )
}

// ── Step 5: Plan Ready ────────────────────────────────────────────────────────
function StepReady({ answers, onStart, saving }) {
  const timeLabel = TIME_OPTIONS.find(t => t.id === answers.preferredTime)?.label || 'your preferred time'
  const fitnessLabel = FITNESS_OPTIONS.find(f => f.id === answers.fitnessLevel)?.label || 'your level'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      {/* Animated checkmark ring */}
      <div style={{
        width: 96, height: 96, borderRadius: '50%',
        background: 'linear-gradient(135deg, #0D9488 0%, #134E4A 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 28, boxShadow: '0 0 50px #14B8A640',
        animation: 'pulse 2s ease-in-out infinite',
      }}>
        <span style={{ fontSize: 44 }}>🎯</span>
      </div>

      <h2 style={{ ...HEADING, fontSize: 30, margin: 0 }}>Your plan is ready.</h2>
      <p style={{ color: MUTED, fontSize: 15, marginTop: 12, marginBottom: 0, lineHeight: 1.6 }}>
        Personalised for <span style={{ color: '#2DD4BF', fontWeight: 600 }}>{fitnessLabel.toLowerCase()}</span>,
        scheduled for <span style={{ color: '#2DD4BF', fontWeight: 600 }}>{timeLabel.toLowerCase()}</span>.
      </p>

      {/* Summary pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 24 }}>
        {[
          '7-day program',
          '20 min/session',
          'Home-based',
          'Beginner-friendly',
        ].map(tag => (
          <span key={tag} style={{
            paddingLeft: 14, paddingRight: 14, paddingTop: 7, paddingBottom: 7,
            borderRadius: 999, fontSize: 13, fontWeight: 600,
            backgroundColor: '#134E4A', color: '#2DD4BF',
            border: '1px solid #14B8A640',
          }}>
            {tag}
          </span>
        ))}
      </div>

      <div style={{ width: '100%', marginTop: 36 }}>
        <PrimaryButton onClick={onStart} disabled={saving}>
          {saving ? 'Setting up…' : 'Start Day 1 →'}
        </PrimaryButton>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 50px #14B8A640; }
          50%       { box-shadow: 0 0 70px #14B8A660; }
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
        backgroundColor: disabled ? '#334155' : TEAL,
        color: disabled ? '#64748B' : '#0F172A',
        borderRadius: 16, border: 'none',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 700, fontSize: 15,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background-color 0.15s ease',
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
        <div
          key={i}
          style={{
            height: 4, borderRadius: 999,
            width: i === current ? 24 : 8,
            backgroundColor: i <= current ? TEAL : '#334155',
            transition: 'all 0.3s ease',
          }}
        />
      ))}
    </div>
  )
}

// ── Main Onboarding component ─────────────────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [answers, setAnswers] = useState({
    fitnessLevel: '',
    equipment: ['bodyweight'],
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
          fitnessLevel: answers.fitnessLevel,
          equipment: answers.equipment,
          preferredTime: answers.preferredTime,
          programStartDate: today,
          onboardingComplete: true,
        },
      })
      if (error) throw error
    } catch (e) {
      console.error('Failed to save onboarding data:', e)
      // Supabase save failed — write a localStorage flag so AuthGuard doesn't
      // loop the user back to onboarding on the next page visit. The data will
      // re-sync next time they open the app and Supabase is reachable.
      try {
        localStorage.setItem('strongbase_onboarding_complete', 'true')
      } catch {}
    }

    setSaving(false)
    navigate('/', { replace: true })
  }

  const screens = [
    <StepWelcome key="welcome" onNext={next} />,
    <StepFitness
      key="fitness"
      value={answers.fitnessLevel}
      onChange={v => setAnswers(a => ({ ...a, fitnessLevel: v }))}
      onNext={next}
    />,
    <StepEquipment
      key="equipment"
      value={answers.equipment}
      onChange={v => setAnswers(a => ({ ...a, equipment: v }))}
      onNext={next}
    />,
    <StepCommitment
      key="commitment"
      value={answers.preferredTime}
      onChange={v => setAnswers(a => ({ ...a, preferredTime: v }))}
      onNext={next}
    />,
    <StepReady
      key="ready"
      answers={answers}
      onStart={handleFinish}
      saving={saving}
    />,
  ]

  return (
    <div
      style={{
        minHeight: '100svh',
        backgroundColor: BG,
        display: 'flex',
        flexDirection: 'column',
        padding: '0 24px',
        paddingTop: 'max(env(safe-area-inset-top), 48px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 32px)',
        boxSizing: 'border-box',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      {/* Back arrow (hidden on step 0 and last step) */}
      <div style={{ height: 44, display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            style={{
              background: 'none', border: 'none', color: MUTED,
              cursor: 'pointer', padding: '8px 0', fontSize: 15,
            }}
          >
            ← Back
          </button>
        )}
      </div>

      {/* Step dots (hidden on welcome and ready screens) */}
      {step > 0 && step < TOTAL_STEPS - 1 && (
        <StepIndicator current={step - 1} total={TOTAL_STEPS - 2} />
      )}

      {/* Screen content */}
      <div style={{ flex: 1 }}>
        {screens[step]}
      </div>
    </div>
  )
}
