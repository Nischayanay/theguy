import { SplitFlap } from './SplitFlap'

type Props = {
  play: boolean
  stamped?: boolean
  gate?: 'loading' | 'done'
}

/** The boarding pass: opens the site (loader) and closes it (stamped KNOWN). */
export function BoardingPass({ play, stamped = false, gate = 'done' }: Props) {
  return (
    <div className="pass" data-stamped={stamped || undefined}>
      <div className="pass-main">
        <div className="pass-head">
          <span className="label">Boarding pass</span>
          <span className="label">CA 001</span>
        </div>
        <div className="pass-row">
          <div>
            <span className="label">Passenger</span>
            <span className="pass-val">You</span>
          </div>
          <div>
            <span className="label">Seat</span>
            <span className="pass-val">1A</span>
          </div>
        </div>
        <div className="pass-route">
          <div>
            <span className="label">From</span>
            <span className="pass-city">UNSEEN</span>
          </div>
          <svg className="pass-plane" viewBox="0 0 24 24" aria-hidden>
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor" />
          </svg>
          <div className="pass-to">
            <span className="label">To</span>
            <SplitFlap className="pass-city" text="KNOWN" play={play} settle={320} step={90} />
          </div>
        </div>
        <div className="pass-gate">
          <span className="label">Gate</span>
          <span className="gate-track">
            <span className="gate-fill" data-state={gate} />
          </span>
        </div>
      </div>
      <div className="pass-stub" aria-hidden>
        <span className="label">CA 001</span>
        <span className="label">1A</span>
      </div>
      {stamped && (
        <div className="stamp" role="img" aria-label="Stamped: known">
          KNOWN
        </div>
      )}
    </div>
  )
}
