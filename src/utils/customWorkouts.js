// Saved custom workouts — the synchronous side.
// ---------------------------------------------------------------------------
// The localStorage mirror is the source every screen reads from, so a custom
// workout resolves instantly (and offline) by its id. useCustomWorkouts keeps
// the mirror in step with the Supabase `custom_workouts` table.
//
// A workout is { id, name, focusId, exerciseIds: string[], createdAt, updatedAt }.
// ---------------------------------------------------------------------------

import { FOCUS_PRESETS } from './exerciseMeta'

export const CUSTOM_KEY = 'strongbase_custom_workouts'
export const CUSTOM_PREFIX = 'c-'

export function readCustomWorkouts() {
  try {
    const list = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch { return [] }
}

export function writeCustomWorkouts(list) {
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(list)) } catch { /* quota */ }
}

export function getCustomWorkout(id) {
  return readCustomWorkouts().find(w => w.id === id) || null
}

export const isCustomDayParam = param => String(param || '').startsWith(CUSTOM_PREFIX)

/**
 * A custom workout dressed as a plan day, so DayOverview, the guided player
 * and logging take it without special-casing.
 *
 * `logDayNumber` / `logTheme` are what get written to workout_logs: the log
 * schema needs an integer day, so — like Quick Burn — a custom session is
 * recorded against today's program day, under its own name.
 */
export function customWorkoutToDay(w, todayDayNumber) {
  const focus = FOCUS_PRESETS.find(f => f.id === w.focusId) || FOCUS_PRESETS[0]
  return {
    day: `${CUSTOM_PREFIX}${w.id}`,
    custom: true,
    workoutId: w.id,
    theme: w.name,
    emoji: '🛠️',
    focusArea: `Your workout · ${focus.label}`,
    focus,
    exerciseIds: w.exerciseIds,
    homeExerciseIds: w.exerciseIds,
    gymExerciseIds: w.exerciseIds,
    logDayNumber: todayDayNumber,
    logTheme: `Custom · ${w.name}`,
  }
}
