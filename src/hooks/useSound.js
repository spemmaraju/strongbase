import { useRef, useState, useEffect } from 'react'

const AUDIO_KEY = 'strongbase_audio_mode' // 'voice' | 'sound' | 'mute'
const LEGACY_SOUND_KEY = 'strongbase_sound'

// Play a single oscillator tone into an existing AudioContext
function oscTone(ac, freq, startTime, duration, gain = 0.12, type = 'sine') {
  try {
    const osc = ac.createOscillator()
    const gainNode = ac.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, startTime)
    gainNode.gain.setValueAtTime(gain, startTime)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
    osc.connect(gainNode)
    gainNode.connect(ac.destination)
    osc.start(startTime)
    osc.stop(startTime + duration + 0.05)
  } catch (e) { /* fail silently */ }
}

function loadInitialMode() {
  try {
    const stored = localStorage.getItem(AUDIO_KEY)
    if (stored === 'voice' || stored === 'sound' || stored === 'mute') return stored
    // Migrate from the old on/off sound setting
    return localStorage.getItem(LEGACY_SOUND_KEY) === 'off' ? 'mute' : 'voice'
  } catch { return 'voice' }
}

export function useSound() {
  const acRef = useRef(null)
  // Refs so playSound/speak always read the current value (no stale closures)
  const modeRef = useRef('voice')
  const [audioMode, setAudioMode] = useState(() => {
    const mode = loadInitialMode()
    modeRef.current = mode
    return mode
  })

  // iOS Safari fix: resume AudioContext on first user touch before any sound plays
  useEffect(() => {
    function handleFirstTouch() {
      if (acRef.current && acRef.current.state === 'suspended') {
        acRef.current.resume().catch(() => {})
      }
      document.removeEventListener('touchstart', handleFirstTouch)
    }
    document.addEventListener('touchstart', handleFirstTouch, { passive: true })
    return () => document.removeEventListener('touchstart', handleFirstTouch)
  }, [])

  // Stop any queued speech when leaving the page that uses this hook
  useEffect(() => () => {
    try { window.speechSynthesis?.cancel() } catch {}
  }, [])

  function getAC() {
    if (!acRef.current) {
      try {
        acRef.current = new (window.AudioContext || window.webkitAudioContext)()
      } catch (e) { return null }
    }
    // Resume if suspended (browser autoplay policy)
    if (acRef.current.state === 'suspended') {
      acRef.current.resume().catch(() => {})
    }
    return acRef.current
  }

  function playSound(type) {
    if (modeRef.current === 'mute') return
    const ac = getAC()
    if (!ac) return
    try {
      const t = ac.currentTime
      switch (type) {
        case 'start':
          // Rising two-note chime — C5 then E5
          oscTone(ac, 523, t, 0.18)
          oscTone(ac, 659, t + 0.13, 0.2)
          break
        case 'rest':
          // Soft single low tone — F#4
          oscTone(ac, 370, t, 0.25, 0.1)
          break
        case 'complete':
          // Three-note ascending chime — C5, E5, G5
          oscTone(ac, 523, t, 0.2)
          oscTone(ac, 659, t + 0.22, 0.2)
          oscTone(ac, 784, t + 0.46, 0.32)
          break
        case 'tick':
          // Crisp soft click
          oscTone(ac, 1000, t, 0.04, 0.07, 'square')
          break
        case 'halfway':
          // Soft double-tone notification — D5, F5
          oscTone(ac, 587, t, 0.12)
          oscTone(ac, 698, t + 0.18, 0.14)
          break
        default: break
      }
    } catch (e) { /* fail silently */ }
  }

  // Voice coach — only speaks in 'voice' mode. Interrupts any previous line so
  // announcements never queue up behind each other.
  function speak(text) {
    if (modeRef.current !== 'voice') return
    if (!('speechSynthesis' in window)) return
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.05
      window.speechSynthesis.speak(utterance)
    } catch { /* fail silently */ }
  }

  function cycleAudioMode() {
    setAudioMode(prev => {
      const next = prev === 'voice' ? 'sound' : prev === 'sound' ? 'mute' : 'voice'
      modeRef.current = next
      if (next !== 'voice') {
        try { window.speechSynthesis?.cancel() } catch {}
      }
      try { localStorage.setItem(AUDIO_KEY, next) } catch {}
      return next
    })
  }

  return {
    playSound,
    speak,
    audioMode,
    cycleAudioMode,
    // Backward-compatible alias (sounds are on unless muted)
    soundEnabled: audioMode !== 'mute',
    toggleSound: cycleAudioMode,
  }
}
