// Turns a /day/:dayNumber or /workout/:dayNumber route param into a day
// object — a day of the active plan ("3") or a saved custom workout ("c-…").

import { getActivePlan } from '../data/plans'
import { getProgramDayNumber } from './workoutStats'
import { isCustomDayParam, getCustomWorkout, customWorkoutToDay, CUSTOM_PREFIX } from './customWorkouts'

// Callers resolve on every render and hand the day to memos and effects
// (useSessionDraft seeds from it), so the same workout must come back as the
// same object or the seed effect loops forever.
const customCache = new Map()

export function resolveDay(param, user) {
  if (isCustomDayParam(param)) {
    const w = getCustomWorkout(String(param).slice(CUSTOM_PREFIX.length))
    if (!w) return undefined
    const todayDayNumber = getProgramDayNumber(user)
    const key = `${param}|${w.updatedAt}|${todayDayNumber}`
    if (!customCache.has(key)) customCache.set(key, customWorkoutToDay(w, todayDayNumber))
    return customCache.get(key)
  }
  return getActivePlan(user).days.find(d => d.day === parseInt(param))
}
