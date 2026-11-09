import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { Toaster } from 'sonner'
import NumberFlow, { type Format } from '@number-flow/react'
import { Sky } from './components/Sky'
import { Loader, shouldShowIntro } from './components/Loader'
import { SplitFlap } from './components/SplitFlap'
import { Compare } from './components/Compare'
import { BoardingPass } from './components/BoardingPass'
import { ApplySheet } from './components/ApplySheet'
import { Reel } from './components/Reel'
import { sound } from './lib/sound'
import { useInViewOnce } from './lib/useInView'
import { gsap, ScrollTrigger, SplitText, scrollToId, startSmoothScroll } from './lib/scroll'

const IG = 'https://www.instagram.com/'

/* Visitor's local time comes from their timezone; the destination is always "your city". */
function visitorPlace() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  return { tz, city: 'YOUR CITY' }
}

function useClock(tz: string) {
  const fmt = () =>
    new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz || undefined }).format(new Date())
  const [t, setT] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 20_000)
    return () => clearInterval(id)
  })
  return t
}

export default function App() {
  const [intro, setIntro] = useState(shouldShowIntro)
  const [sheet, setSheet] = useState(false)
  const place = useRef(visitorPlace()).current
  const root = useRef<HTMLDivElement>(null)
  const ready = !intro

  useEffect(() => {
    startSmoothScroll()
  }, [])

  useGSAP(
    () => {
      if (!ready) return
      const mm = gsap.matchMedia()
      mm.add(
        { motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 1000px)' },
        (ctx) => {
          const { motion, desktop } = ctx.conditions as { motion: boolean; desktop: boolean }
          if (!motion) return

          // Hero: lines rise out of their masks, once.
          gsap.from('.hero .line', { yPercent: 112, duration: 1.1, ease: 'out', stagger: 0.09, delay: 0.05 })
          gsap.from('.hero [data-fade]', { opacity: 0, y: 12, duration: 0.8, ease: 'out', stagger: 0.06, delay: 0.45 })

          // Headings split into masked lines on scroll (Signal-A / Dylan pattern), once each.
          gsap.utils.toArray<HTMLElement>('[data-split]').forEach((el) => {
            SplitText.create(el, {
              type: 'lines',
              mask: 'lines',
              autoSplit: true,
              onSplit: (self) =>
                gsap.from(self.lines, {
                  yPercent: 110,
                  duration: 1,
                  ease: 'out',
                  stagger: 0.08,
                  scrollTrigger: { trigger: el, start: 'top 88%', once: true },
                }),
            })
          })

          gsap.utils.toArray<HTMLElement>('[data-fade]:not(.hero [data-fade])').forEach((el) => {
            gsap.from(el, {
              opacity: 0,
              y: 16,
              duration: 0.9,
              ease: 'out',
              scrollTrigger: { trigger: el, start: 'top 90%', once: true },
            })
          })

          // Flight path draws with scroll; the plane rides it. Explanation, so it's scrubbed.
          const route = document.querySelector('.route')
          if (route) {
            const tl = gsap.timeline({
              scrollTrigger: { trigger: route, start: 'top 75%', end: 'bottom 45%', scrub: 0.6 },
            })
            tl.from('.route-path', { drawSVG: '0%', ease: 'none' }, 0).to(
              '.route-plane',
              {
                motionPath: { path: '.route-path', align: '.route-path', alignOrigin: [0.5, 0.5], autoRotate: true },
                ease: 'none',
              },
              0,
            )
          }

          // Itinerary: sticky counter scrambles to each day as its panel arrives.
          const counter = document.querySelector('.it-counter')
          const title = document.querySelector('.it-title')
          gsap.utils.toArray<HTMLElement>('.it-panel').forEach((p) => {
            const go = () => {
              gsap.to(counter, { duration: 0.6, scrambleText: { text: p.dataset.day!, chars: '0123456789–', speed: 0.8 } })
              gsap.to(title, { duration: 0.6, scrambleText: { text: p.dataset.title!, chars: 'upperCase', speed: 0.8 } })
              document.querySelectorAll('.it-panel').forEach((x) => x.classList.toggle('is-active', x === p))
            }
            ScrollTrigger.create({ trigger: p, start: 'top 55%', end: 'bottom 55%', onEnter: go, onEnterBack: go })
          })

          // Arrivals: Onseis-style staggered columns drifting at different speeds.
          if (desktop) {
            const speeds = [-40, 70, 10]
            gsap.utils.toArray<HTMLElement>('.arr-col').forEach((col, i) => {
              gsap.fromTo(
                col,
                { y: speeds[i] },
                { y: -speeds[i], ease: 'none', scrollTrigger: { trigger: '.arr-grid', start: 'top bottom', end: 'bottom top', scrub: true } },
              )
            })
          }

          // Footer wordmark rises into place as the page lands.
          gsap.from('.wordmark span', {
            yPercent: 60,
            ease: 'none',
            stagger: 0.02,
            scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
          })
        },
      )
      ScrollTrigger.refresh()
      return () => mm.revert()
    },
    { scope: root, dependencies: [ready] },
  )

  return (
    <div ref={root}>
      <Sky />
      {intro && <Loader onDone={() => setIntro(false)} />}
      <Nav onApply={() => setSheet(true)} />
      <main>
        <Hero place={place} onApply={() => setSheet(true)} />
        <Before />
        <EnRoute city={place.city} />
        <Itinerary />
        <Arrivals />
        <Captain />
        <Fit />
        <Fare onApply={() => setSheet(true)} />
        <Questions />
        <Final city={place.city} onApply={() => setSheet(true)} />
      </main>
      <Footer />
      <ApplySheet open={sheet} onOpenChange={setSheet} />
      <Toaster position="bottom-center" toastOptions={{ unstyled: true, className: 'toast' }} />
    </div>
  )
}

/* ───────── Marquee (Onseis) ───────── */

function Marquee() {
  const item = (
    <>
      <span>Now boarding</span>
      <i>✦</i>
      <span>3 seats at this fare</span>
      <i>✦</i>
      <span>We fly to your city every month</span>
      <i>✦</i>
    </>
  )
  return (
    <div className="marquee" aria-label="Now boarding. 3 seats at this fare.">
      <div className="marquee-track" aria-hidden>
        {item}
        {item}
        {item}
        {item}
      </div>
    </div>
  )
}

/* ───────── Nav: Signal-A grid of mono labels, blend-inverted over any sky ───────── */

function Nav({ onApply }: { onApply: () => void }) {
  const [on, setOn] = useState(sound.on)
  useEffect(() => {
    const off = sound.subscribe(setOn)
    return () => void off()
  }, [])
  const link = (id: string, label: string) => (
    <a
      href={`#${id}`}
      className="nav-link hide-sm"
      onClick={(e) => {
        e.preventDefault()
        scrollToId(id)
      }}
    >
      {label}
    </a>
  )
  return (
    <>
      <nav className="nav" aria-label="Main">
        <a
          href="#top"
          className="nav-link nav-home"
          onClick={(e) => {
            e.preventDefault()
            scrollToId('top')
          }}
        >
          <span className="dot" aria-hidden /> CA 001
        </a>
        {link('itinerary', 'Itinerary')}
        {link('arrivals', 'Arrivals')}
        {link('fare', 'Fare')}
        <button className="nav-link nav-sound" aria-pressed={on} onClick={() => sound.toggle()}>
          Sound {on ? 'on' : 'off'}
        </button>
      </nav>
      <button className="nav-cta" onClick={onApply}>
        Seat <span aria-hidden>→</span>
      </button>
    </>
  )
}

/* ───────── 01 Hero ───────── */

function Hero({ place, onApply }: { place: { tz: string; city: string }; onApply: () => void }) {
  const time = useClock(place.tz)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => sound.setHum(e.isIntersecting), { threshold: 0.25 })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return (
    <section id="top" ref={ref} className="hero on-dark" data-sky="0">
      <div className="meta-row grid">
        <span className="label c-1-4" data-fade>
          Local {time} — {place.city === 'YOUR CITY' ? 'your city' : place.city.toLowerCase()}
        </span>
        <span className="label c-5-8 hide-sm" data-fade>
          CA 001 — overnight
        </span>
        <span className="label c-9-12 right" data-fade>
          Run by <a href={IG + 'theguy/'} target="_blank" rel="noreferrer">@theguy</a> — 1.9M followers
        </span>
      </div>

      <h1 className="display hero-title">
        <span className="mask">
          <span className="line cond">You’re very good</span>
        </span>
        <span className="mask">
          <span className="line cond">at what you do.</span>
        </span>
        <span className="mask">
          <span className="line wide">Almost nobody knows.</span>
        </span>
      </h1>

      <div className="hero-foot grid">
        <p className="lede c-1-6" data-fade>
          Once a month a crew flies to you. Two or three days of filming. Then thirty days of you, posted, while you get on with
          your work.
        </p>
        <div className="hero-actions c-8-12" data-fade>
          <button className="cta" onClick={onApply}>
            Ask about a seat <span className="cta-arrow" aria-hidden>→</span>
          </button>
          <a
            className="text-link"
            href="#arrivals"
            onClick={(e) => {
              e.preventDefault()
              scrollToId('arrivals')
            }}
          >
            See who’s landed
          </a>
        </div>
      </div>
      <Marquee />
    </section>
  )
}

/* ───────── 02 Before ───────── */

function Before() {
  return (
    <section className="sec before on-dark" data-sky="0">
      <div className="grid">
        <p className="label c-1-3" data-fade>
          Before takeoff
        </p>
        <div className="c-4-12 before-body">
          <p className="statement" data-split>
            The people winning your deals aren’t better than you. <b>They’re just better known.</b>
          </p>
          <p className="statement" data-split>
            AI will replace whoever is replaceable. <b>A name people trust isn’t.</b>
          </p>
          <p className="statement soft" data-split>
            You already know this. You just haven’t had the time.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ───────── 03 En route ───────── */

function EnRoute({ city }: { city: string }) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>('0px 0px -35% 0px')
  useEffect(() => {
    if (seen) sound.chime('enroute')
  }, [seen])
  return (
    <section className="sec enroute on-dark" data-sky="1">
      <div className="grid">
        <p className="label c-1-3" data-fade>
          CRZ — En route
        </p>
        <h2 className="display-2 c-4-12" data-split>
          Most agencies send you a brief. <b>We send a crew.</b>
        </h2>
      </div>
      <div className="route" ref={ref}>
        <span className="label route-from">Base</span>
        <svg className="route-svg" viewBox="0 0 1000 220" preserveAspectRatio="xMidYMid meet" aria-hidden>
          <path className="route-ghost" d="M10 200 C 260 -40, 740 -40, 990 200" />
          <path className="route-path" d="M10 200 C 260 -40, 740 -40, 990 200" />
          <g className="route-plane">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" transform="scale(1.7) rotate(90 12 12)" />
          </g>
        </svg>
        <div className="route-to">
          <span className="label">Destination</span>
          <SplitFlap className="route-city" text={city} play={seen} settle={700} step={70} />
        </div>
      </div>
      <div className="grid">
        <p className="lede c-4-9" data-fade>
          No briefs to write. No back-and-forth over email. No waiting on an agency to send you something. You show up, and they
          film everything.
        </p>
      </div>
    </section>
  )
}

/* ───────── 04 Itinerary — sticky counter + panels ───────── */

const DAYS = [
  { k: 'DAY 1', t: 'LAND', d: 'They arrive, sit with you, and find what only you can say.', img: 'what-we-do', alt: 'TheGuy explaining the process to camera' },
  { k: 'DAY 2–3', t: 'FILM', d: 'You show up. They film everything: your work, your city, your opinions.', img: 'behind-scenes', alt: 'Behind the scenes of a client shoot by a pool' },
  { k: 'DAY 4–30', t: 'POST', d: 'A full month is edited and packaged. It goes out while you work.', img: 'post-everything', alt: 'TheGuy saying “post everything” to camera' },
  { k: 'NEXT', t: 'FLY BACK', d: 'The crew returns. Each month builds on the one before.', img: 'thank-me-later', alt: 'TheGuy on camera, recording a reel' },
]

function Itinerary() {
  return (
    <section id="itinerary" className="sec itinerary on-dark" data-sky="2">
      <div className="grid it-grid">
        <div className="it-sticky c-1-5">
          <p className="label" data-fade>
            Itinerary — every month
          </p>
          <p className="it-counter" aria-hidden>
            DAY 1
          </p>
          <p className="it-title" aria-hidden>
            LAND
          </p>
          <p className="it-sum" data-fade>
            Three days of your time. Thirty days of you.
          </p>
        </div>
        <ol className="it-list c-7-12">
          {DAYS.map((d) => (
            <li key={d.k} className="it-panel" data-day={d.k} data-title={d.t}>
              <Reel name={d.img} alt={d.alt} />
              <div className="it-cap">
                <span className="label">
                  {d.k} — {d.t}
                </span>
                <p>{d.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ───────── 05 Arrivals — staggered columns ───────── */

function Stat({ value, format, suffix }: { value: number; format?: Format; suffix?: string }) {
  const [ref, seen] = useInViewOnce<HTMLSpanElement>('0px 0px -10% 0px')
  return (
    <span ref={ref} className="stat">
      <NumberFlow value={seen ? value : 0} format={format} suffix={suffix} />
    </span>
  )
}

function Arrivals() {
  const [ref, seen] = useInViewOnce<HTMLDivElement>()
  useEffect(() => {
    if (seen) sound.chime('arrivals')
  }, [seen])
  const compact: Format = { notation: 'compact', maximumFractionDigits: 1 }
  return (
    <section id="arrivals" className="sec arrivals on-dark" data-sky="2">
      <div className="grid">
        <p className="label c-1-3" data-fade>
          ARR — Arrivals
        </p>
        <h2 className="display-2 c-4-12" data-split>
          Where they were. <b>Where they are.</b>
        </h2>
      </div>

      <div className="arr-grid" ref={ref}>
        <div className="arr-col">
          <article className="entry">
            <Compare
              before="/ig/mira-before.jpg"
              after="/ig/mira-win.jpg"
              beforeAlt="Mira's profile two months earlier: 9,725 followers"
              afterAlt="Insights from one of Mira's reels after: 357,655 viewers"
              beforeLabel="Before"
              afterLabel="Now"
            />
            <Caption handle="gujaratiholisticcoach" who="Mira — holistic healing">
              <span className="stat-row">
                <span className="stat dim">9,725</span>
                <span className="arrow">→</span>
                <Stat value={46000} format={compact} />
                <span className="label">followers</span>
              </span>
              <span className="note">One reel: 357,655 viewers, 8.3K shares.</span>
            </Caption>
          </article>
        </div>

        <div className="arr-col">
          <article className="entry">
            <figure className="frame">
              <img src="/ig/clients-30-days.jpg" alt="Insights: 15,224,497 views and 5,949,548 views in 30 days" loading="lazy" />
            </figure>
            <Caption who="Two clients — last 30 days">
              <span className="stat-row">
                <Stat value={15224497} format={compact} />
                <span className="label">views, +792%</span>
              </span>
              <span className="note">The second: 5.9M views, +521%.</span>
            </Caption>
          </article>
          <article className="entry">
            <Reel name="100k-gained" alt="Client on camera: 100k followers gained" />
            <Caption handle="contentautopilot" who="Client result">
              <span className="stat-row">
                <Stat value={100000} format={compact} />
                <span className="label">followers in 47 days</span>
              </span>
            </Caption>
          </article>
        </div>

        <div className="arr-col">
          <article className="entry">
            <figure className="frame">
              <img src="/ig/giannis-win.jpg" alt="One of Giannis's reels: 1.1K comments, 4.1K reposts, 2.7K shares" loading="lazy" />
            </figure>
            <Caption handle="giannisvarou" who="Giannis Varouxakis">
              <span className="stat-row">
                <Stat value={35000} format={compact} />
                <span className="label">followers</span>
              </span>
              <span className="note">One reel: 4.1K reposts, 2.7K shares.</span>
            </Caption>
          </article>
        </div>
      </div>
    </section>
  )
}

function Caption({ handle, who, children }: { handle?: string; who: string; children: React.ReactNode }) {
  return (
    <div className="caption">
      <div className="cap-row">
        {handle ? (
          <a className="label strong" href={IG + handle + '/'} target="_blank" rel="noreferrer">
            @{handle}
          </a>
        ) : (
          <span className="label strong">{who}</span>
        )}
        <span className="label">● 2026</span>
      </div>
      {handle && <div className="cap-row label">{who}</div>}
      <div className="cap-body">{children}</div>
    </div>
  )
}

/* ───────── 06 Who's flying ───────── */

function Captain() {
  const [ref, seen] = useInViewOnce<HTMLDivElement>('0px 0px -30% 0px')
  return (
    <section className="sec captain on-light" data-sky="3">
      <div className="grid">
        <p className="label c-1-3" data-fade>
          Who’s flying
        </p>
        <div className="c-4-12 captain-body">
          <p className="indent-para" data-split>
            <span className="indent" aria-hidden />
            The kid in the Superman shirt grew up to make other people famous. That photo is still his profile picture. 1.9
            million people follow him now.
          </p>
        </div>
      </div>
      <div className="grid captain-lower">
        <div className="c-4-7 passport" ref={ref} data-aged={seen || undefined}>
          <img className="pp pp-then" src="/ig/theguy-avatar.jpg" alt="TheGuy as a kid, in a Superman shirt" width={150} height={150} />
          <img className="pp pp-now" src="/ig/what-we-do.jpg" alt="TheGuy today, on camera" loading="lazy" />
          <span className="label pp-cap">
            <span className="pp-then-l">Then</span>
            <span className="pp-now-l">Now</span>
          </span>
        </div>
        <div className="c-9-12 captain-side" data-fade>
          <p>
            He built Content Autopilot to do in person what most agencies try to do over email: sit across from you, find what
            you actually think, and put it in front of the people who should hear it.
          </p>
          <a className="label strong" href={IG + 'theguy/'} target="_blank" rel="noreferrer">
            TheGuy — @theguy ↗
          </a>
        </div>
      </div>
    </section>
  )
}

/* ───────── 07 Fit ───────── */

function Fit() {
  return (
    <section className="sec fit on-light" data-sky="3">
      <div className="grid">
        <p className="label c-1-3" data-fade>
          Before you book
        </p>
        <h2 className="display-2 c-4-12" data-split>
          This is for a few people. <b>It might be you.</b>
        </h2>
      </div>
      <div className="grid fit-cols">
        <div className="c-4-8" data-fade>
          <p className="label rule">For you if</p>
          <ul className="list">
            <li>You’re excellent at your work, and your reputation stops at the people who’ve met you.</li>
            <li>You’d rather give three days a month to a camera than thirty days to thinking about content.</li>
            <li>You’re ready to be seen saying what you actually think.</li>
          </ul>
        </div>
        <div className="c-9-12" data-fade>
          <p className="label rule">Not for you if</p>
          <ul className="list muted">
            <li>You want someone to post for you without you on camera.</li>
            <li>You want a guaranteed follower number. Nobody honest can promise one.</li>
            <li>You aren’t ready to commit to a year.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ───────── 08 Fare — manifest ───────── */

function Fare({ onApply }: { onApply: () => void }) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>()
  useEffect(() => {
    if (seen) sound.chime('seats')
  }, [seen])
  return (
    <section id="fare" className="sec fare on-light" data-sky="3">
      <div className="grid">
        <p className="label c-1-3" data-fade>
          Fare
        </p>
        <div className="c-4-12 manifest" ref={ref}>
          <div className="m-row">
            <span className="label">Monthly</span>
            <span className="m-val">$25,000</span>
            <span className="m-note">a month, one-year commitment</span>
          </div>
          <div className="m-row">
            <span className="label">Paid in full</span>
            <span className="m-val">$250,000</span>
            <span className="m-note">for the year, two months included</span>
          </div>
          <div className="m-row m-gone">
            <span className="label">Founding</span>
            <span className="m-val">
              <s>$100,000</s>
            </span>
            <span className="m-note">six months — sold out</span>
          </div>
          <div className="m-row m-seats">
            <span className="label">Seats at this fare</span>
            <SplitFlap className="seats-num" text="03" play={seen} settle={300} step={160} label="3 seats" />
            <span className="m-note">When these are filled, the next seats cost more.</span>
          </div>
          <div className="m-cta">
            <button className="cta" onClick={onApply}>
              Ask about a seat <span className="cta-arrow" aria-hidden>→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ───────── 09 Questions ───────── */

const QA = [
  ['Do I need to write scripts?', 'No. On day one they sit with you and pull out what you already think. On camera days, you talk; they handle the rest.'],
  ['How much of my time does it take?', 'Two to three days a month on camera. Editing, packaging and posting happen without you.'],
  ['Do you really come to me?', 'Yes. The crew flies to your city every month. That is the whole idea.'],
  ['Can you guarantee followers?', 'No, and be wary of anyone who does. What we can show you is what has happened for the people we work with.'],
  ['How do I start?', 'Ask about a seat here, or DM the word SEAT to @theguy on Instagram.'],
]

function Questions() {
  return (
    <section className="sec questions on-light" data-sky="3">
      <div className="grid">
        <p className="label c-1-3" data-fade>
          Questions
        </p>
        <div className="qa c-4-12">
          {QA.map(([q, a]) => (
            <details key={q} className="qa-item">
              <summary>
                <span>{q}</span>
                <span className="qa-icon" aria-hidden />
              </summary>
              <div className="qa-body">
                <p>{a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───────── 10 Final ───────── */

function Final({ city, onApply }: { city: string; onApply: () => void }) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>('0px 0px -30% 0px')
  const [stamped, setStamped] = useState(false)
  useEffect(() => {
    if (!seen) return
    const t = setTimeout(() => {
      setStamped(true)
      sound.stamp()
    }, 900)
    return () => clearTimeout(t)
  }, [seen])
  return (
    <section className="sec final on-light" data-sky="3">
      <h2 className="display final-title" data-split>
        <span className="cond">{city === 'YOUR CITY' ? 'Your city.' : `${city.charAt(0)}${city.slice(1).toLowerCase()}.`}</span>{' '}
        <span className="wide">Next month.</span>
      </h2>
      <div className="grid final-row">
        <div className="c-1-6 final-pass" ref={ref}>
          <BoardingPass play={seen} stamped={stamped} />
        </div>
        <div className="c-8-12 final-actions" data-fade>
          <button className="cta" onClick={onApply}>
            Ask about a seat <span className="cta-arrow" aria-hidden>→</span>
          </button>
          <a className="text-link" href={IG + 'theguy/'} target="_blank" rel="noreferrer">
            Or DM “SEAT” to @theguy
          </a>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const word = 'CONTENT AUTOPILOT'
  return (
    <footer className="footer on-light">
      <div className="grid footer-row">
        <span className="label c-1-3">© 2026 Content Autopilot</span>
        <a className="label c-4-6" href={IG + 'theguy/'} target="_blank" rel="noreferrer">
          @theguy ↗
        </a>
        <a className="label c-7-9" href={IG + 'contentautopilot/'} target="_blank" rel="noreferrer">
          @contentautopilot ↗
        </a>
        <a className="label c-10-12 right credit" href="https://anaybauskar.me" target="_blank" rel="noreferrer">
          Made by Anay ↗
        </a>
      </div>
      <p className="wordmark" aria-label={word}>
        {word.split('').map((c, i) => (
          <span key={i} aria-hidden>
            {c === ' ' ? '\u00A0' : c}
          </span>
        ))}
      </p>
    </footer>
  )
}
