import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { CustomEase } from 'gsap/CustomEase'
import Lenis from 'lenis'
import { prefersReducedMotion } from './motion'

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, MotionPathPlugin, CustomEase)

// Emil's curves as GSAP eases, so CSS and GSAP motion share one vocabulary.
CustomEase.create('out', '0.23, 1, 0.32, 1')
CustomEase.create('inOut', '0.77, 0, 0.175, 1')

let lenis: Lenis | null = null

/** Lenis smooth scroll driving ScrollTrigger (same pairing as all three reference sites). Off for reduced motion. */
export function startSmoothScroll() {
  if (lenis || prefersReducedMotion()) return lenis
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis?.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
  if (import.meta.env.DEV) (window as unknown as { lenis: Lenis }).lenis = lenis
  return lenis
}

export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { offset: -8, duration: 1.4 })
  else el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

export function lockScroll(locked: boolean) {
  if (!lenis) return
  if (locked) lenis.stop()
  else lenis.start()
}

export { gsap, ScrollTrigger, SplitText }

// Dev-only handle so a hidden preview pane (no rAF) can be stepped during QA.
if (import.meta.env.DEV) (window as unknown as { gsap: typeof gsap }).gsap = gsap
