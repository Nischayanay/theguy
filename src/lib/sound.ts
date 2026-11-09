// Opt-in sound, synthesized with Web Audio so there are no audio files to load.
// Placeholder voices: replace with sounds generated/checked via earshot before launch.

type Listener = (on: boolean) => void

class Sound {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private humGain: GainNode | null = null
  private chimes = 0
  private chimed = new Set<string>()
  private listeners = new Set<Listener>()
  on = false
  private humWanted = true

  subscribe(fn: Listener) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private setup() {
    if (this.ctx) return
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = 0.9
    master.connect(ctx.destination)

    // Cabin hum: brown noise through a low-pass filter.
    const len = ctx.sampleRate * 4
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    let last = 0
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 160
    const humGain = ctx.createGain()
    humGain.gain.value = 0
    src.connect(lp).connect(humGain).connect(master)
    src.start()

    this.ctx = ctx
    this.master = master
    this.humGain = humGain
  }

  toggle() {
    this.on = !this.on
    if (this.on) {
      this.setup()
      void this.ctx!.resume()
      this.applyHum()
    } else if (this.ctx) {
      this.humGain!.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15)
    }
    this.listeners.forEach((l) => l(this.on))
  }

  /** Hero tells us whether it is on screen. */
  setHum(wanted: boolean) {
    this.humWanted = wanted
    this.applyHum()
  }

  private applyHum() {
    if (!this.ctx || !this.humGain) return
    const target = this.on && this.humWanted ? 0.22 : 0
    this.humGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.6)
  }

  /** Two-tone cabin chime. Once per section, at most three per visit. */
  chime(id: string) {
    if (!this.on || !this.ctx || this.chimed.has(id) || this.chimes >= 3) return
    this.chimed.add(id)
    this.chimes++
    const t = this.ctx.currentTime
    this.tone(932, t, 1.4)
    this.tone(740, t + 0.42, 1.8)
  }

  private tone(freq: number, at: number, decay: number) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(0.09, at + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay)
    o.connect(g).connect(this.master!)
    o.start(at)
    o.stop(at + decay + 0.05)
  }

  /** Soft paper stamp. */
  stamp() {
    if (!this.on || !this.ctx) return
    const ctx = this.ctx
    const t = ctx.currentTime
    const len = Math.floor(ctx.sampleRate * 0.08)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
    const n = ctx.createBufferSource()
    n.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 900
    const g = ctx.createGain()
    g.gain.value = 0.5
    n.connect(bp).connect(g).connect(this.master!)
    n.start(t)

    const o = ctx.createOscillator()
    o.frequency.setValueAtTime(120, t)
    o.frequency.exponentialRampToValueAtTime(50, t + 0.12)
    const og = ctx.createGain()
    og.gain.setValueAtTime(0.25, t)
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
    o.connect(og).connect(this.master!)
    o.start(t)
    o.stop(t + 0.2)
  }
}

export const sound = new Sound()
