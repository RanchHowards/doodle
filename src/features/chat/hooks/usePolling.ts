import { useEffect, useRef } from 'react'

/**
 * Repeatedly invokes `callback` on a chained setTimeout (never overlapping calls),
 * pausing while the tab is hidden and aborting any in-flight call on cleanup.
 */
export function usePolling(
  callback: (signal: AbortSignal) => void | Promise<void>,
  intervalMs: number,
  enabled: boolean,
) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    let timeoutId: number
    let cancelled = false

    const scheduleNext = () => {
      timeoutId = window.setTimeout(tick, intervalMs)
    }

    async function tick() {
      if (document.hidden) {
        scheduleNext()
        return
      }
      const controller = new AbortController()
      try {
        await callbackRef.current(controller.signal)
      } catch {
        // Errors are surfaced by the callback itself via its own state, not here.
      }
      if (!cancelled) scheduleNext()
    }

    scheduleNext()

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [intervalMs, enabled])
}
