import { useEffect, useRef } from 'react'

// Keeps the screen awake while `active` is true (e.g. during a workout).
// Safari on iPadOS 16.4+ supports navigator.wakeLock. The lock is released
// automatically when the tab is hidden, so we re-acquire on visibilitychange.
export default function useWakeLock(active) {
  const lockRef = useRef(null)

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let cancelled = false

    async function acquire() {
      try {
        lockRef.current = await navigator.wakeLock.request('screen')
      } catch {
        // Denied (e.g. low battery mode) — fail silently, the app still works
      }
    }

    function onVisibility() {
      if (!cancelled && document.visibilityState === 'visible') acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      lockRef.current?.release().catch(() => {})
      lockRef.current = null
    }
  }, [active])
}
