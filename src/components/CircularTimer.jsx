// Animated SVG ring countdown timer.
// Ring color shifts to amber when ≤ 3 seconds remain.
// `size` scales the whole component (200 = phone default, ~280 for tablet).

export default function CircularTimer({ secondsRemaining, totalSeconds, ringColor = '#c084fc', size = 200 }) {
  const stroke = Math.max(6, Math.round(size * 0.04))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  const progress = totalSeconds > 0 ? secondsRemaining / totalSeconds : 0
  const dashOffset = circumference * (1 - progress)

  // Amber when 3 seconds or fewer remain (and timer is actually running)
  const activeColor =
    secondsRemaining > 0 && secondsRemaining <= 3 ? '#F59E0B' : ringColor

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* SVG ring */}
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={activeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
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
            fontSize: Math.round(size * 0.26),
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
            fontSize: Math.max(12, Math.round(size * 0.065)),
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
