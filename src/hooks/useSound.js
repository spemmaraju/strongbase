import { useRef, useState } from 'react'

const SOUND_KEY = 'strongbase_sound'

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

export function useSound() {
  const acRef = useRef(null)
  // Use a ref so playSound always reads the current value (no stale closure)
  const enabledRef = useRef(true)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(SOUND_KEY)
      const val = stored !== 'off'
      enabledRef.current = val
      return val
    } catch { return true }
  })

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
    if (!enabledRef.current) return
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

  function toggleSound() {
    setSoundEnabled(prev => {
      const next = !prev
      enabledRef.current = next
      try { localStorage.setItem(SOUND_KEY, next ? 'on' : 'off') } catch {}
      return next
    })
  }

  return { playSound, soundEnabled, toggleSound }
}
