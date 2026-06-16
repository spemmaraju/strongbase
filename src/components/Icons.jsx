// StrongBase — Kinetic icon set
// ---------------------------------------------------------------------------
// Drop-in replacement for every emoji in the current app. One geometric grid,
// 1.7px stroke, rounded joins, monochrome. Every icon uses `currentColor` so it
// inherits the surrounding text/accent color — no per-icon color hardcoding.
//
// Usage:
//   import { Icon } from './Icons'
//   <Icon name="streak" size={20} />                       // inherits color
//   <Icon name="xp" size={16} style={{ color: '#c084fc' }} />
//   <Icon name="strength" size={30} className="badge-icon" />
//
// These are the exact marks chosen during design review:
//   home=Doorway(B)  gym=Barbell(B)  push=Press(A)  streak=Calendar-flame(D)
//   xp=Bolt(A)  target=Dart-hit(C)  badge=Medal(A)  strength=Power-shield(C)
//   trophy=Cup(A)  sunrise=Sunrise(A)  warmup=Thermometer(A)
//   cooldown=Breath(C)  celebration=Party(A)  clock + check are utility marks.
// ---------------------------------------------------------------------------

import React from 'react'

// Each entry is the inner markup of a 24x24 viewBox icon.
const PATHS = {
  // Navigation / modes
  home: (
    <>
      <path d="M3 10.6 12 3.5l9 7.1" />
      <path d="M5.2 9.4V20a1 1 0 0 0 1 1h11.6a1 1 0 0 0 1-1V9.4" />
      <path d="M9.6 21v-6.2h4.8V21" />
    </>
  ),
  gym: <path d="M3 10v4M5.5 8v8M18.5 8v8M21 10v4M5.5 12h13" />,

  // Workout type
  push: (
    <>
      <path d="M4 12h11" />
      <path d="m11 7.5 4.5 4.5L11 16.5" />
      <path d="M19.5 5v14" />
    </>
  ),

  // Gamification
  streak: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <path d="M4 9h16M8 3.5v3M16 3.5v3" />
      <path d="M12 11.8c.3 1.4 1.6 1.9 1.6 3.3a1.6 1.6 0 0 1-3.2 0c0-.6.3-1 .3-1-.8.3-1.3 1.2-1.3 2.1a2.6 2.6 0 0 0 5.2 0c0-2-1.5-3-2.6-4.4z" />
    </>
  ),
  xp: <path d="M13.5 3 6 13h5l-1.5 8L18 11h-5z" />,
  target: (
    <>
      <circle cx="11" cy="13" r="7.5" />
      <circle cx="11" cy="13" r="3.3" />
      <path d="m13.5 6 1.7-3 1.3 2.5 2.5 1.3-3 1.7" />
      <path d="M11 13 16 8" />
    </>
  ),
  badge: (
    <>
      <path d="M8.5 3 12 9M15.5 3 12 9" />
      <circle cx="12" cy="15" r="6" />
      <path d="M12 12.5 13 14.4l2 .3-1.4 1.4.3 2-1.9-1-1.9 1 .3-2L9 14.7l2-.3z" />
    </>
  ),
  strength: (
    <>
      <path d="M12 2.5 5 5.5v5c0 4.5 3 8 7 9.5 4-1.5 7-5 7-9.5v-5z" />
      <path d="m12.6 8-2.4 3.4h2.8L10.8 15" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 5.5H4.5V8a2.5 2.5 0 0 0 2.5 2.5M17 5.5h2.5V8a2.5 2.5 0 0 1-2.5 2.5" />
      <path d="M12 14v3M9 20h6M10 17h4v3h-4z" />
    </>
  ),
  sunrise: (
    <>
      <path d="M3 18h18" />
      <path d="M8 18a4 4 0 0 1 8 0" />
      <path d="M12 5.5V8M5.5 9 7 10.5M18.5 9 17 10.5M3.5 14h2M18.5 14h2" />
    </>
  ),

  // Session phases / categories
  warmup: (
    <>
      <path d="M10 13.5V6a2 2 0 0 1 4 0v7.5a4 4 0 1 1-4 0z" />
      <path d="M12 14.5v-5" />
    </>
  ),
  cooldown: (
    <>
      <path d="M3 10c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" />
      <path d="M3 15c2-2.5 4-2.5 6 0s4 2.5 6 0 4-2.5 6 0" />
    </>
  ),
  celebration: (
    <>
      <path d="M4 20 9 8l7 7z" />
      <path d="M9 8c2-2 5-1.5 6 .5M15 4c1.5 0 2.5 1 2.5 2.5M18 9.5c1-1 2.5-1 3.5 0" />
      <path d="M14 3.5 14.5 5M20 6l-1.3.6M19.5 13l-1.3-.4" />
    </>
  ),

  // Utility marks used in the prototype
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  check: <polyline points="20 6 9 17 4 12" />,
}

export function Icon({ name, size = 24, strokeWidth = 1.7, style, className, title }) {
  const inner = PATHS[name]
  if (!inner) {
    console.warn(`<Icon> unknown name: "${name}"`)
    return null
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {inner}
    </svg>
  )
}

export const ICON_NAMES = Object.keys(PATHS)
export default Icon
