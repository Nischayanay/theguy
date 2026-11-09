import { useEffect, useRef, useState } from 'react'
import { BoardingPass } from './BoardingPass'
import { prefersReducedMotion } from '../lib/motion'

const KEY = 'ca-boarded'

/** First visit per session only (or ?intro=1). Never on repeat visits. */
export function shouldShowIntro() {
  if (typeof window === 'undefined') return false
  if (new URLSearchParams(location.search).has('intro')) return true
  return !sessionStorage.getItem(KEY)
}

/**
 * Boarding intro. Pure CSS motion on purpose: it plays while the page is still
 * loading, and CSS transitions run off the main thread (rAF-driven JS animation
 * stalls under load or in background tabs). Timers, not transitionend, decide
 * when to unmount so it can never get stuck on screen.
 */
export function Loader({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'done' | 'out'>('in')
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    sessionStorage.setItem(KEY, '1')
    const reduce = prefersReducedMotion()
    const started = performance.now()
    const timers: number[] = []
    let cancelled = false

    const leave = () => {
      if (cancelled) return
      setPhase('out')
      timers.push(window.setTimeout(() => doneRef.current(), reduce ? 200 : 420))
    }

    // Tied to real loading (fonts), with a floor so the flip lands and a hard cap.
    const ready = document.fonts?.ready ?? Promise.resolve()
    const cap = new Promise((r) => setTimeout(r, 1600))
    Promise.race([ready, cap]).then(() => {
      if (cancelled) return
      const wait = Math.max(0, (reduce ? 500 : 900) - (performance.now() - started))
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return
          setPhase('done')
          timers.push(window.setTimeout(leave, reduce ? 120 : 240))
        }, wait),
      )
    })

    // Keyboard-initiated: no animation, the intro just goes (Emil's rule).
    const skip = () => {
      if (cancelled) return
      cancelled = true
      doneRef.current()
    }
    window.addEventListener('keydown', skip)
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      window.removeEventListener('keydown', skip)
    }
  }, [])

  return (
    <div
      className="loader"
      data-phase={phase}
      role="status"
      aria-label="Loading"
      onClick={() => {
        setPhase('out')
        window.setTimeout(() => doneRef.current(), 420)
      }}
    >
      <div className="loader-pass">
        <BoardingPass play gate={phase === 'in' ? 'loading' : 'done'} />
      </div>
      <p className="loader-hint label">Tap to skip</p>
    </div>
  )
}
