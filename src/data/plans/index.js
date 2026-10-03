// The plan library.
// ---------------------------------------------------------------------------
// Every plan is a 7-day cycle with the same day shape the app has always used
// ({ day, theme, emoji, focusArea, durationMinutes, homeExerciseIds,
// gymExerciseIds, exerciseIds }), so the program-day maths, the week strip,
// streaks and badges keep working unchanged whichever plan is active.
//
// Extra day fields:
//   focus     { label, kind?, regions?, includeCategory? } — what "best for
//             today" means in the exercise browser (see matchesFocus)
//   optional  true for recovery days; they don't block "program complete"
//
// The active plan id lives in user_metadata.planId (beside programStartDate).
// ---------------------------------------------------------------------------

import foundations from '../weeklyPlan.json'
import { DAY_FOCUS } from '../../utils/exerciseMeta'

const FOUNDATIONS = {
  id: 'foundations',
  name: 'StrongBase Foundations',
  tagline: 'The original 7-day mix of strength, power and back care.',
  whoFor: 'Anyone starting out or coming back. Every day has a session, with a recovery day mid-week.',
  why: 'Push, pull, hinge and core each get their own day, power work keeps you quick, and every session ends with back-care moves.',
  daysPerWeek: 6,
  level: 'All levels',
  days: foundations.days.map(d => ({
    ...d,
    focus: DAY_FOCUS[d.day],
    optional: d.day === 4,
  })),
}

// Further plans are plain JSON next to this file, registered here.
const EXTRA = Object.values(import.meta.glob('./*.json', { eager: true, import: 'default' }))

export const PLANS = [FOUNDATIONS, ...EXTRA]
export const DEFAULT_PLAN_ID = FOUNDATIONS.id

export function getPlan(id) {
  return PLANS.find(p => p.id === id) || FOUNDATIONS
}

export function getActivePlan(user) {
  return getPlan(user?.user_metadata?.planId)
}
