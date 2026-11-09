import { useEffect, useRef } from 'react'

/**
 * The signature: four stacked skies (night → pre-dawn → sunrise → day).
 * Each section declares data-sky="0..3". Scroll position maps to a continuous
 * "level"; each layer's opacity is set directly on the element (no CSS-variable
 * fan-out, no background-color animation) so it stays on the compositor.
 */
export function Sky() {
  const layers = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    let raf = 0
    const meta = document.querySelector('meta[name="theme-color"]')
    const themes = ['#0E1330', '#16236A', '#1F3FBF', '#F5F7FB']

    const update = () => {
      raf = 0
      const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-sky]'))
      if (!sections.length) return
      const mid = window.scrollY + window.innerHeight * 0.55
      let level = Number(sections[0].dataset.sky)
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i]
        const top = s.offsetTop
        const h = s.offsetHeight
        if (mid >= top && mid < top + h) {
          const a = Number(s.dataset.sky)
          const b = Number(sections[i + 1]?.dataset.sky ?? a)
          const t = (mid - top) / h
          const w = Math.min(1, Math.max(0, (t - 0.86) / 0.14))
          level = a + (b - a) * w
          break
        }
        if (i === sections.length - 1 && mid >= top + h) level = Number(s.dataset.sky)
      }
      for (let k = 1; k < layers.current.length; k++) {
        const el = layers.current[k]
        if (el) el.style.opacity = String(Math.min(1, Math.max(0, level - k + 1)))
      }
      meta?.setAttribute('content', themes[Math.round(level)])
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="sky" aria-hidden>
      <div className="sky-layer sky-night" ref={(el) => { layers.current[0] = el }}>
        <div className="stars" />
        <div className="city-lights" />
      </div>
      <div className="sky-layer sky-predawn" ref={(el) => { layers.current[1] = el }} />
      <div className="sky-layer sky-sunrise" ref={(el) => { layers.current[2] = el }} />
      <div className="sky-layer sky-day" ref={(el) => { layers.current[3] = el }} />
    </div>
  )
}
