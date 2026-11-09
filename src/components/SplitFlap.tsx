import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '../lib/motion'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

type Props = {
  text: string
  /** Start flipping when true. Before that, cells show blanks. */
  play: boolean
  /** ms before the first cell settles, then +step per cell */
  settle?: number
  step?: number
  className?: string
  label?: string
}

/**
 * Departure-board flip. Rare / first-time moments only (loader, seats, destination),
 * so it sits in the "delight" tier of the animation gate.
 */
export function SplitFlap({ text, play, settle = 260, step = 70, className = '', label }: Props) {
  const [shown, setShown] = useState(() => text.replace(/\S/g, ' '))

  useEffect(() => {
    if (!play) return
    if (prefersReducedMotion()) {
      setShown(text)
      return
    }
    const start = performance.now()
    const id = window.setInterval(() => {
      const t = performance.now() - start
      let done = true
      const next = text
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' '
          if (t >= settle + i * step) return ch
          done = false
          return CHARS[(Math.random() * CHARS.length) | 0]
        })
        .join('')
      setShown(next)
      if (done) window.clearInterval(id)
    }, 45)
    return () => window.clearInterval(id)
  }, [play, text, settle, step])

  return (
    <span className={`flap ${className}`} aria-label={label ?? text} role="text">
      {shown.split('').map((c, i) => (
        <span key={i} className={c === ' ' ? 'flap-gap' : 'flap-cell'} aria-hidden>
          {c}
        </span>
      ))}
    </span>
  )
}
