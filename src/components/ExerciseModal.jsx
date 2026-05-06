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
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative flex flex-col w-full h-full overflow-y-auto"
        style={{ backgroundColor: '#0F172A', maxWidth: 600, margin: '0 auto' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-full font-bold text-xl transition-all active:scale-95"
          style={{
            width: 44,
            height: 44,
            backgroundColor: '#334155',
            color: '#F8FAFC',
            border: 'none',
            cursor: 'pointer'
          }}
          aria-label="Close modal"
        >
          ×
        </button>

        {/* YouTube Embed */}
        <div style={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#000', flexShrink: 0 }}>
          <iframe
            src={`https://www.youtube.com/embed/${exercise.youtubeId}`}
            title={exercise.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none'
            }}
          />
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 pb-10">
          {/* Exercise name + meta */}
          <div>
            <h2 className="text-2xl font-bold text-white">{exercise.name}</h2>
            <p className="text-sm mt-1 font-semibold" style={{ color: '#14B8A6' }}>
              {setsRepsLabel}
            </p>
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {exercise.targetMuscles.map((m) => (
                <span
                  key={m}
                  className="text-xs font-medium px-2 py-1 rounded-full"
                  style={{ backgroundColor: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }}
                >
                  {m}
                </span>
              ))}
              {exercise.equipment.map((eq) => (
                <span
                  key={eq}
                  className="text-xs font-medium px-2 py-1 rounded-full"
                  style={{ backgroundColor: '#14B8A630', color: '#14B8A6', border: '1px solid #14B8A650' }}
                >
                  {eq.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-base font-bold text-white mb-3">How to do it</h3>
            <ol className="space-y-3">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      width: 24,
                      height: 24,
                      backgroundColor: '#14B8A6',
                      color: '#fff',
                      marginTop: 1
                    }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: '#CBD5E1' }}>
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {/* Coaching Cues */}
          <div>
            <h3 className="text-base font-bold text-white mb-3">Coaching Cues</h3>
            <ul className="space-y-2">
              {exercise.cues.map((cue, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <span style={{ color: '#14B8A6', fontSize: 16, lineHeight: '20px', flexShrink: 0 }}>✓</span>
                  <p className="text-sm leading-relaxed" style={{ color: '#CBD5E1' }}>{cue}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Modification */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#92400E' }}>
              Easier Modification
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#92400E' }}>
              {exercise.modification}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
