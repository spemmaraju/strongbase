import { useState, useEffect, useRef } from 'react'
import exerciseData from '../data/exercises.json'
import weeklyPlan from '../data/weeklyPlan.json'
import { supabase } from '../lib/supabase'
import { logToRow } from './useWorkoutLogs'

export default function useWorkoutPlayer(dayNumber) {
  const day = weeklyPlan.days.find(d => d.day === parseInt(dayNumber))
  const exMap = Object.fromEntries(exerciseData.map(e => [e.id, e]))
  const dayExercises = day ? day.exerciseIds.map(id => exMap[id]).filter(Boolean) : []

  // ── Core phase state ──────────────────────────────────────────────────────
  const [phase, setPhase] = useState('idle') // idle|transition|exercise|rest|complete
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(1)

  // ── Progress state ────────────────────────────────────────────────────────
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [completedExerciseIds, setCompletedExerciseIds] = useState([])
  const [totalSetsCompleted, setTotalSetsCompleted] = useState(0)
  const [logSaveStatus, setLogSaveStatus] = useState('idle') // idle|saving|done|error

  // ── Rest metadata ─────────────────────────────────────────────────────────
  const [isBetweenExercises, setIsBetweenExercises] = useState(false)
  const [nextExIdx, setNextExIdx] = useState(0)

  // ── Refs (stable across renders, no stale-closure risk) ───────────────────
  const countdownRef = useRef(null)        // setInterval id for countdown
  const transitionRef = useRef(null)       // setTimeout id for transition
  const onCompleteRef = useRef(null)       // what to call when countdown hits 0
  const isModalOpenRef = useRef(false)     // pause countdown when modal is open
  const phaseRef = useRef('idle')
  const wasCountingRef = useRef(false)     // paused by visibility change?
  const totalSetsRef = useRef(0)           // mutable copy (avoids stale state in callbacks)
  const completedIdsRef = useRef([])
  const elapsedRef = useRef(0)             // mutable elapsed (avoids stale in saveLog)

  useEffect(() => { phaseRef.current = phase }, [phase])

  // ── Elapsed timer: counts up while workout is active ─────────────────────
  useEffect(() => {
    if (phase !== 'idle' && phase !== 'complete') {
      const id = setInterval(() => {
        elapsedRef.current += 1
        setElapsedSeconds(elapsedRef.current)
      }, 1000)
      return () => clearInterval(id)
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Visibility change: pause countdown when tab is hidden ─────────────────
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        wasCountingRef.current = !!countdownRef.current
        clearInterval(countdownRef.current)
        countdownRef.current = null
      } else if (wasCountingRef.current) {
        // tickCountdown only uses refs + functional updates → safe to re-use
        countdownRef.current = setInterval(tickCountdown, 1000)
        wasCountingRef.current = false
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, []) // safe: tickCountdown has no stale-closure dependencies

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => {
    clearInterval(countdownRef.current)
    clearTimeout(transitionRef.current)
  }, [])

  // ── Core timer tick ───────────────────────────────────────────────────────
  function tickCountdown() {
    if (isModalOpenRef.current) return   // paused while modal is open
    setSecondsRemaining(prev => {
      if (prev <= 1) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
        setTimeout(() => onCompleteRef.current?.(), 0)
        return 0
      }
      return prev - 1
    })
  }

  function startCountdown(seconds, onComplete) {
    clearInterval(countdownRef.current)
    countdownRef.current = null
    const secs = Math.max(seconds || 1, 1)
    onCompleteRef.current = onComplete
    setSecondsRemaining(secs)
    setTotalSeconds(secs)
    countdownRef.current = setInterval(tickCountdown, 1000)
  }

  function stopAllTimers() {
    clearInterval(countdownRef.current)
    clearTimeout(transitionRef.current)
    countdownRef.current = null
    transitionRef.current = null
    onCompleteRef.current = null
  }

  // ── Phase entry functions ─────────────────────────────────────────────────
  function enterExercise(exIdx, set) {
    const ex = dayExercises[exIdx]
    if (!ex) return
    setExerciseIndex(exIdx)
    setCurrentSet(set)
    setPhase('exercise')
    if (ex.durationSeconds) {
      startCountdown(ex.durationSeconds, () => completeSet(exIdx, set))
    } else {
      stopAllTimers()
      setSecondsRemaining(0)
      setTotalSeconds(1)
    }
  }

  function enterRest(restSecs, betweenEx, targetExIdx, targetSet) {
    stopAllTimers()
    setPhase('rest')
    setIsBetweenExercises(betweenEx)
    setNextExIdx(targetExIdx)
    startCountdown(restSecs > 0 ? restSecs : 20, () => enterExercise(targetExIdx, targetSet))
  }

  // directToExercise=true  → transition → exercise  (used for very first exercise)
  // directToExercise=false → transition → rest → exercise  (used between exercises)
  function enterTransition(targetExIdx, directToExercise) {
    stopAllTimers()
    setPhase('transition')
    setNextExIdx(targetExIdx)
    transitionRef.current = setTimeout(() => {
      if (directToExercise) {
        enterExercise(targetExIdx, 1)
      } else {
        const nextEx = dayExercises[targetExIdx]
        enterRest(nextEx?.restSeconds || 20, true, targetExIdx, 1)
      }
    }, 1500)
  }

  // ── Set completion logic ──────────────────────────────────────────────────
  function completeSet(exIdx, set) {
    const ex = dayExercises[exIdx]
    if (!ex) return

    // Update via refs first (avoids stale closures in subsequent async calls)
    const newTotalSets = totalSetsRef.current + 1
    totalSetsRef.current = newTotalSets
    setTotalSetsCompleted(newTotalSets)

    if (set < ex.sets) {
      // More sets of same exercise
      enterRest(ex.restSeconds, false, exIdx, set + 1)
    } else {
      // Last set of this exercise
      const newIds = [...completedIdsRef.current, ex.id]
      completedIdsRef.current = newIds
      setCompletedExerciseIds(newIds)

      if (exIdx < dayExercises.length - 1) {
        // More exercises → show transition card → rest → next exercise
        enterTransition(exIdx + 1, false)
      } else {
        // All done!
        stopAllTimers()
        setPhase('complete')
        saveWorkoutLog(newIds, newTotalSets)
      }
    }
  }

  // ── Public actions ────────────────────────────────────────────────────────
  function startWorkout() {
    totalSetsRef.current = 0
    completedIdsRef.current = []
    elapsedRef.current = 0
    setElapsedSeconds(0)
    setCompletedExerciseIds([])
    setTotalSetsCompleted(0)
    setExerciseIndex(0)
    setCurrentSet(1)
    enterTransition(0, true) // first exercise: direct to exercise (no pre-rest)
  }

  function skipRest() {
    // Capture callback before clearing timers
    const fn = onCompleteRef.current
    clearInterval(countdownRef.current)
    countdownRef.current = null
    onCompleteRef.current = null
    fn?.()
  }

  function goBack() {
    // Restart current exercise from set 1.
    // If already at set 1 of first exercise, do nothing (caller handles UI).
    if (exerciseIndex === 0 && currentSet === 1) return
    if (currentSet > 1) {
      enterExercise(exerciseIndex, 1)
    } else {
      enterExercise(exerciseIndex - 1, 1)
    }
  }

  function pauseTimer() { isModalOpenRef.current = true }
  function resumeTimer() { isModalOpenRef.current = false }

  // ── Persist workout log (Supabase with offline fallback) ─────────────────
  async function saveWorkoutLog(completedIds, totalSets) {
    if (!day) return
    setLogSaveStatus('saving')

    const log = {
      dayNumber: day.day,
      date: new Date().toISOString().slice(0, 10),
      theme: day.theme,
      completedExerciseIds: completedIds,
      totalSets,
      totalTimeSeconds: elapsedRef.current,
      completedAt: new Date().toISOString(),
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('not authenticated')

      const { error } = await supabase
        .from('workout_logs')
        .insert(logToRow(log, user.id))

      if (error) throw error

      setLogSaveStatus('done')
    } catch (e) {
      console.error('Supabase save failed — storing offline:', e)
      // Offline fallback: queue in localStorage
      try {
        const pending = JSON.parse(localStorage.getItem('strongbase_pending_logs') || '[]')
        pending.push(log)
        localStorage.setItem('strongbase_pending_logs', JSON.stringify(pending))
      } catch {}
      setLogSaveStatus('error')
    }
  }

  return {
    // Data
    day,
    dayExercises,
    currentExercise: dayExercises[exerciseIndex],
    nextExercise: dayExercises[nextExIdx],
    // State
    phase,
    exerciseIndex,
    currentSet,
    secondsRemaining,
    totalSeconds,
    elapsedSeconds,
    completedExerciseIds,
    totalSetsCompleted,
    isBetweenExercises,
    logSaveStatus,
    // Actions
    startWorkout,
    completeSet: () => completeSet(exerciseIndex, currentSet),
    skipRest,
    goBack,
    pauseTimer,
    resumeTimer,
  }
}
