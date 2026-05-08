import { useEffect } from 'react'

export default function ExerciseModal({ exercise, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Prevent background scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!exercise) return null

  const setsRepsLabel = exercise.durationSeconds
    ? `${exercise.sets} × ${exercise.durationSeconds} sec hold`
    : `${exercise.sets} × ${exercise.reps} reps`

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: '#0F172A' }}
    >
      <div
        className="relative flex flex-col w-full h-full overflow-y-auto"
        style={{ backgroundColor: '#0F172A', maxWidth: 600, margin: '0 auto' }}
      >
        {/* Sticky Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#0F172A',
            zIndex: 10,
            borderBottom: '1px solid #1E293B',
            paddingBottom: 16,
            paddingLeft: 20,
            paddingRight: 20,
            paddingTop: 16,
          }}
        >
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 20,
              color: '#F8FAFC',
              paddingRight: 60,
              margin: 0,
            }}
          >
            {exercise.name}
          </h2>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 20,
              width: 44,
              height: 44,
              backgroundColor: '#1E293B',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* YouTube Embed */}
        <div style={{ paddingLeft: 20, paddingRight: 20, marginTop: 16 }}>
          <div
            style={{
              position: 'relative',
              paddingTop: '56.25%',
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid #1E293B',
            }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${exercise.youtubeId}?rel=0&modestbranding=1&playsinline=1`}
              title={exercise.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 40 }}>
          {/* Sets/Reps */}
          <p style={{ fontSize: 14, fontWeight: 600, color: '#14B8A6', marginTop: 16 }}>
            {setsRepsLabel}
          </p>

          {/* Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {exercise.targetMuscles.map((m) => (
              <span
                key={m}
                style={{
                  backgroundColor: '#1E293B',
                  borderRadius: 999,
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 4,
                  paddingBottom: 4,
                  fontSize: 12,
                  color: '#94A3B8',
                }}
              >
                {m}
              </span>
            ))}
            {exercise.equipment.map((eq) => (
              <span
                key={eq}
                style={{
                  backgroundColor: '#134E4A',
                  borderRadius: 999,
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 4,
                  paddingBottom: 4,
                  fontSize: 12,
                  color: '#2DD4BF',
                }}
              >
                {eq.replace(/-/g, ' ')}
              </span>
            ))}
          </div>

          {/* HOW TO DO IT */}
          <p
            style={{
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#64748B',
              marginTop: 24,
              marginBottom: 12,
              borderLeft: '2px solid #14B8A6',
              paddingLeft: 8,
            }}
          >
            HOW TO DO IT
          </p>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {exercise.instructions.map((step, i) => (
              <li key={i} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#14B8A6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 11,
                    color: '#fff',
                    marginTop: 1,
                  }}
                >
                  {i + 1}
                </span>
                <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                  {step}
                </p>
              </li>
            ))}
          </ol>

          {/* COACHING CUES */}
          <p
            style={{
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#64748B',
              marginTop: 24,
              marginBottom: 12,
              borderLeft: '2px solid #14B8A6',
              paddingLeft: 8,
            }}
          >
            COACHING CUES
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {exercise.cues.map((cue, i) => (
              <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#14B8A6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginTop: 2 }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.6, margin: 0 }}>
                  {cue}
                </p>
              </li>
            ))}
          </ul>

          {/* EASIER MODIFICATION */}
          {exercise.modification && (
            <div
              style={{
                backgroundColor: '#451A03',
                border: '1px solid rgba(217,119,6,0.3)',
                borderRadius: 16,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 16,
                paddingBottom: 16,
                marginTop: 24,
                marginBottom: 32,
              }}
            >
              <p
                style={{
                  fontWeight: 600,
                  fontSize: 11,
                  color: '#FCD34D',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 8,
                }}
              >
                EASIER MODIFICATION
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(253,230,138,0.8)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {exercise.modification}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
