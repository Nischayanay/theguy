import { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  before: string
  after: string
  beforeAlt: string
  afterAlt: string
  beforeLabel: string
  afterLabel: string
}

/**
 * Before / after slider (Emil's comparison recipe): the top image is clipped with
 * clip-path inset; the handle follows the finger 1:1 with no easing. Pointer capture
 * keeps the drag alive outside the bounds. Arrow keys move it instantly (no animation
 * on keyboard actions).
 */
export function Compare({ before, after, beforeAlt, afterAlt, beforeLabel, afterLabel }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const top = useRef<HTMLImageElement>(null)
  const handle = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const [pos, setPos] = useState(50)

  const paint = useCallback((p: number) => {
    if (top.current) top.current.style.clipPath = `inset(0 ${100 - p}% 0 0)`
    if (handle.current) handle.current.style.transform = `translateX(${p}%)`
  }, [])

  useEffect(() => paint(pos), [pos, paint])

  const fromEvent = (x: number) => {
    const r = box.current!.getBoundingClientRect()
    return Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100))
  }

  return (
    <div
      ref={box}
      className="compare"
      onPointerDown={(e) => {
        if (dragging.current) return // multi-touch protection
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        const p = fromEvent(e.clientX)
        paint(p)
        setPos(p)
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return
        const p = fromEvent(e.clientX)
        paint(p) // direct style write, no React render per frame
      }}
      onPointerUp={(e) => {
        dragging.current = false
        setPos(fromEvent(e.clientX))
      }}
      onPointerCancel={() => (dragging.current = false)}
    >
      <img src={after} alt={afterAlt} className="compare-img" draggable={false} loading="lazy" />
      <img ref={top} src={before} alt={beforeAlt} className="compare-img compare-top" draggable={false} loading="lazy" />
      <span className="compare-tag compare-tag-l label">{beforeLabel}</span>
      <span className="compare-tag compare-tag-r label">{afterLabel}</span>
      <div ref={handle} className="compare-handle-track">
        <div
          className="compare-handle"
          role="slider"
          tabIndex={0}
          aria-label="Compare before and now"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 5))
            if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 5))
          }}
        >
          <span aria-hidden>‹ ›</span>
        </div>
      </div>
    </div>
  )
}
