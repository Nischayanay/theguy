import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../lib/motion'

type Props = { name: string; alt: string; className?: string }

/**
 * A reel slot. Shows the poster (/ig/<name>.jpg) until /reels/<name>.mp4 exists,
 * then plays it muted, looped, only while on screen (saves data + battery on the
 * Instagram in-app browser). No autoplay for reduced-motion users; they get the poster.
 * Missing file → stays on the poster, no broken player.
 */
export function Reel({ name, alt, className = '' }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v || failed || prefersReducedMotion()) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (v.preload === 'none') v.preload = 'auto'
          v.play().catch(() => {})
        } else v.pause()
      },
      { threshold: 0.35 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [failed])

  return (
    <figure className={`frame reel ${className}`} data-playing={playing || undefined}>
      <img src={`/ig/${name}.jpg`} alt={alt} loading="lazy" width={360} height={640} />
      {!failed && (
        <video
          ref={ref}
          src={`/reels/${name}.mp4`}
          poster={`/ig/${name}.jpg`}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
          onPlaying={() => setPlaying(true)}
          onError={() => setFailed(true)}
        />
      )}
    </figure>
  )
}
