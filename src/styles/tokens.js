/**
 * StrongBase design tokens
 * Single source of truth for colors, typography, spacing, and component styles.
 * Import from here — never hardcode design values in components.
 */

// ── Color palette ─────────────────────────────────────────────────────────────
export const C = {
  // Backgrounds
  bg:         '#0e0f11',   // page background (legacy screens)
  surface:    '#1e2126',   // card / elevated surface
  surfaceHi:  '#262a31',   // hover / pressed surface

  // Borders
  border:     'rgba(255,255,255,0.07)',
  borderMid:  'rgba(51,65,85,0.5)',    // slightly stronger separator

  // Primary accent — teal (legacy screens keep this)
  teal:       '#4fb3a5',
  tealDim:    '#4fb3a5',   // hover / pressed
  tealSoft:   '#1e2126',   // teal-tinted background fill
  tealBright: '#4fb3a5',   // high-contrast teal text

  // Semantic accents
  amber:      '#d9a441',
  amberDim:   '#d9a441',
  amberSoft:  '#1e2126',
  purple:     '#8f8cf0',
  purpleSoft: '#1e2126',
  green:      '#4fb38a',
  greenSoft:  '#1e2126',
  blue:       '#5bb0d9',
  blueSoft:   '#1e2126',
  red:        '#e06c6c',

  // Text
  white:      '#f2f3f5',   // primary text
  muted:      '#a1a6ae',   // secondary text
  subtle:     '#7a8089',   // tertiary text
  dim:        '#737882',   // very subtle / disabled
  navy:       '#2a2d33',   // border / divider

  // ── Kinetic Momentum palette (new screens) ─────────────────────────────────
  // Surfaces
  kBg:        '#0e0f11',   // app background
  kRail:      '#121417',   // left nav rail
  kPanel:     '#121417',   // left panel / modal column
  kCard:      '#16181c',   // standard cards
  kCardAlt:   '#16181c',   // week pills, secondary cards
  kInset:     '#1e2126',   // control buttons, inset wells

  // Borders
  kBorder:    'rgba(255,255,255,0.06)',
  kBorderStr: 'rgba(255,255,255,0.10)',

  // Brand accent — single calm blue
  accentPink:   '#3a78e0',
  accentPurple: '#3a78e0',
  accentViolet: '#9cc2ff',  // text/icon tint on dark
  gradPrimary:  '#3a78e0',
  gradPrimaryD: '#3a78e0',
  gradHero:     '#3a78e0',

  // Category semantic colors
  catWarmup:    '#d9a441',   // warm-up (amber)
  catStrength:  '#3a78e0',   // strength
  catFlex:      '#4fb3a5',   // cool-down / flexibility (teal)
  catStability: '#8f8cf0',   // stability
  catSuccess:   '#4fb38a',   // improved vs last session
}

// ── Typography ────────────────────────────────────────────────────────────────
export const FONT = "'Inter', system-ui, sans-serif"

// Pre-composed type styles — spread into style objects
export const T = {
  hero:  { fontFamily: FONT, fontWeight: 700, fontSize: 28, color: C.white, lineHeight: 1.15 },
  title: { fontFamily: FONT, fontWeight: 700, fontSize: 20, color: C.white },
  body:  {                   fontWeight: 500, fontSize: 16, color: C.white },
  label: {                   fontWeight: 600, fontSize: 13, color: C.muted },
  micro: {
    fontWeight: 700, fontSize: 11,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: C.dim,
  },
}

// ── Spacing — 8px grid ────────────────────────────────────────────────────────
export const S = {
  s1: 8,
  s2: 16,
  s3: 24,
  s4: 32,
  s5: 48,
}

// ── Shared component styles ───────────────────────────────────────────────────

/** Standard card — no shadow, consistent radius */
export const CARD = {
  backgroundColor: C.surface,
  borderRadius: 16,
  border: `1px solid ${C.border}`,
}

/** Input field */
export const INPUT = {
  minHeight: 52,
  backgroundColor: C.bg,
  border: `1px solid ${C.navy}`,
  borderRadius: 14,
  caretColor: C.teal,
}

/** Primary CTA button */
export const BTN_PRIMARY = {
  minHeight: 52,
  backgroundColor: C.teal,
  color: C.bg,
  border: 'none',
  borderRadius: 14,
  fontFamily: FONT,
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
  width: '100%',
}

/** Ghost / text button */
export const BTN_GHOST = {
  minHeight: 44,
  background: 'none',
  border: 'none',
  color: C.teal,
  fontWeight: 600,
  fontSize: 15,
  cursor: 'pointer',
}

/**
 * Section label — replaces the old uppercase + teal left-border style.
 * Use as: <p style={LABEL}>SECTION NAME</p>
 */
export const LABEL = {
  ...T.micro,
  marginBottom: 12,
  display: 'block',
}

/**
 * Page header — compact, subtle separator, no heavy teal bottom border.
 */
export const PAGE_HEADER = {
  padding: `${S.s5}px ${S.s2}px ${S.s2}px`,
  borderBottom: `1px solid ${C.borderMid}`,
  backgroundColor: C.bg,
}
