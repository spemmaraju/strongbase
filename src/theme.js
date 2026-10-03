/**
 * StrongBase theme — calm, minimal, premium.
 * Near-black neutral surfaces, ONE accent colour, solid fills (no gradients).
 * Every screen imports its colours and fonts from here.
 */

export const K = {
  // Surfaces
  bg:       '#0e0f11',
  rail:     '#121417',
  card:     '#16181c',
  panel:    '#121417',
  inset:    '#1e2126',

  // Borders
  border:   'rgba(255,255,255,0.07)',
  borderSt: 'rgba(255,255,255,0.12)',

  // The one accent
  accent:     '#3a78e0',
  accentSoft: 'rgba(58,120,224,0.16)',
  accentText: '#9cc2ff',

  // Legacy names — all point at the single accent (solid colours, no gradients)
  pink:   '#3a78e0',
  purple: '#3a78e0',
  violet: '#9cc2ff',
  grad:   '#3a78e0',
  gradD:  '#3a78e0',
  gradH:  '#3a78e0',
  gradT:  '#3a78e0',
  gradHero: '#3a78e0',
  hero:   '#3a78e0',

  // Selection (onboarding option cards)
  selBg:     'rgba(58,120,224,0.14)',
  selBorder: 'rgba(58,120,224,0.45)',

  // Supporting colours
  amber:   '#d9a441',
  teal:    '#4fb3a5',
  success: '#4fb38a',
  green:   '#4fb38a',
  danger:  '#e06c6c',
  red:     '#e06c6c',

  // Text
  text:   '#f2f3f5',
  muted:  '#a1a6ae',
  subtle: '#7a8089',
  dim:    '#737882',
}

export const FONT = "'Inter', system-ui, sans-serif"
export const MONO = "'JetBrains Mono', 'Courier New', monospace"

export const CATEGORY_COLORS = {
  'warm-up':   '#d9a441',
  strength:    '#3a78e0',
  stability:   '#8f8cf0',
  flexibility: '#4fb3a5',
  power:       '#d98a5b',
  cardio:      '#5bb0d9',
}
