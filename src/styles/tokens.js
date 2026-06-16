/**
 * StrongBase design tokens
 * Single source of truth for colors, typography, spacing, and component styles.
 * Import from here — never hardcode design values in components.
 */

// ── Color palette ─────────────────────────────────────────────────────────────
export const C = {
  // Backgrounds
  bg:         '#0F172A',   // page background (legacy screens)
  surface:    '#1E293B',   // card / elevated surface
  surfaceHi:  '#243147',   // hover / pressed surface

  // Borders
  border:     'rgba(255,255,255,0.07)',
  borderMid:  'rgba(51,65,85,0.5)',    // slightly stronger separator

  // Primary accent — teal (legacy screens keep this)
  teal:       '#14B8A6',
  tealDim:    '#0D9488',   // hover / pressed
  tealSoft:   '#134E4A',   // teal-tinted background fill
  tealBright: '#2DD4BF',   // high-contrast teal text

  // Semantic accents
  amber:      '#F59E0B',
  amberDim:   '#D97706',
  amberSoft:  '#2C1A00',
  purple:     '#7C3AED',
  purpleSoft: '#1E0A50',
  green:      '#22C55E',
  greenSoft:  '#042D10',
  blue:       '#3B82F6',
  blueSoft:   '#071840',
  red:        '#EF4444',

  // Text
  white:      '#F8FAFC',   // primary text
  muted:      '#94A3B8',   // secondary text
  subtle:     '#64748B',   // tertiary text
  dim:        '#475569',   // very subtle / disabled
  navy:       '#334155',   // border / divider

  // ── Kinetic Momentum palette (new screens) ─────────────────────────────────
  // Surfaces
  kBg:        '#0a0e1a',   // app background
  kRail:      '#0c1322',   // left nav rail
  kPanel:     '#0a111e',   // left panel / modal column
  kCard:      '#101828',   // standard cards
  kCardAlt:   '#121a2b',   // week pills, secondary cards
  kInset:     '#16233a',   // control buttons, inset wells

  // Borders
  kBorder:    'rgba(255,255,255,0.06)',
  kBorderStr: 'rgba(255,255,255,0.10)',

  // Brand accent — pink→purple
  accentPink:   '#ec4899',
  accentPurple: '#8b5cf6',
  accentViolet: '#c084fc',  // text/icon tint on dark
  gradPrimary:  'linear-gradient(90deg, #ec4899, #8b5cf6)',
  gradPrimaryD: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
  gradHero:     'linear-gradient(130deg, #fb923c 0%, #ec4899 48%, #8b5cf6 100%)',

  // Category semantic colors
  catWarmup:    '#f59e0b',   // warm-up (amber)
  catStrength:  '#ec4899',   // strength (pink)
  catFlex:      '#2dd4bf',   // cool-down / flexibility (teal)
  catStability: '#8b5cf6',   // stability (purple)
  catSuccess:   '#22c55e',   // improved vs last session
}

// ── Typography ────────────────────────────────────────────────────────────────
export const FONT = "'Plus Jakarta Sans', sans-serif"

// Pre-composed type styles — spread into style objects
export const T = {
  hero:  { fontFamily: FONT, fontWeight: 800, fontSize: 28, color: C.white, lineHeight: 1.15 },
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
