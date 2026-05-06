// Animated SVG ring countdown timer.
// Ring color shifts to amber when ≤ 3 seconds remain.

const SIZE = 200
const STROKE = 8
const RADIUS = (SIZE - STROKE) / 2                    // 96
const CIRCUMFERENCE = 2 * Math.PI * RADIUS            // ≈ 603.19

export default function CircularTimer({ secondsRemaining, totalSeconds, ringColor = '#14B8A6' }) {
  const progress = totalSeconds > 0 ? secondsRemaining / totalSeconds : 0
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  // Amber when 3 seconds or fewer remain (and timer is actually running)
  const activeColor =
    secondsRemaining > 0 && secondsRemaining <= 3 ? '#F59E0B' : ringColor

  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
      {/* SVG ring */}
      <svg
        width={SIZE}
        height={SIZE}
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
      >
        {/* Background track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#334155"
          strokeWidth={STROKE}
        />
        {/* Progress arc */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={activeColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 0.85s linear, stroke 0.3s ease',
          }}
        />
      </svg>

      {/* Center label */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: '#F8FAFC',
            lineHeight: 1,
            fontFamily: 'Inter, sans-serif',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {secondsRemaining}
        </span>
        <span
          style={{
            fontSize: 13,
            color: '#94A3B8',
            marginTop: 6,
            fontWeight: 600,
            letterSpacing: '0.05em',
          }}
        >
          sec
        </span>
      </div>
    </div>
  )
}
