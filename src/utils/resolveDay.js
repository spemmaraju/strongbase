// Turns a /day/:dayNumber or /workout/:dayNumber route param into a day
// object — a day of the active plan ("3") or a saved custom workout ("c-…").

import { getActivePlan } from '../data/plans'
import { getProgramDayNumber } from './workoutStats'
import { isCustomDayParam, getCustomWorkout, customWorkoutToDay, CUSTOM_PREFIX } from './customWorkouts'

export function resolveDay(param, user) {
  if (isCustomDayParam(param)) {
    const w = getCustomWorkout(String(param).slice(CUSTOM_PREFIX.length))
    return w ? customWorkoutToDay(w, getProgramDayNumber(user)) : undefined
  }
  return getActivePlan(user).days.find(d => d.day === parseInt(param))
}
