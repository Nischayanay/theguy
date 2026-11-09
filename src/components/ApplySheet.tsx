import { useState } from 'react'
import { Drawer } from 'vaul'
import { toast } from 'sonner'
import { lockScroll } from '../lib/scroll'

type Props = { open: boolean; onOpenChange: (o: boolean) => void }

/**
 * Seat request — Vaul drawer (Emil Kowalski's library: drag-to-dismiss with velocity,
 * focus trap, scroll lock, iOS drawer curve all built in).
 * PROTOTYPE: submission is simulated — not wired to email/CRM yet.
 */
export function ApplySheet({ open, onOpenChange }: Props) {
  const [state, setState] = useState<'idle' | 'sending'>('idle')
  const [error, setError] = useState('')

  const change = (o: boolean) => {
    lockScroll(o)
    if (o) {
      setState('idle')
      setError('')
    }
    onOpenChange(o)
  }

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (!String(data.get('instagram') || '').trim()) {
      setError('Add your Instagram handle so we can see where you are now.')
      return
    }
    setError('')
    setState('sending')
    setTimeout(() => {
      change(false)
      toast('Seat request sent.')
    }, 900)
  }

  return (
    <Drawer.Root open={open} onOpenChange={change}>
      <Drawer.Portal>
        <Drawer.Overlay className="sheet-backdrop" />
        <Drawer.Content className="sheet" aria-describedby="sheet-desc">
          <Drawer.Handle className="sheet-grip" />
          <div className="sheet-head">
            <span className="label">CA 001 — Seat request</span>
            <Drawer.Title className="sheet-title">Ask about a seat</Drawer.Title>
            <Drawer.Description id="sheet-desc" className="sheet-desc">
              Four questions. About a minute.
            </Drawer.Description>
          </div>
          <form className="sheet-form" onSubmit={submit} noValidate={false}>
            <Field name="name" label="Your name" autoComplete="name" required />
            <Field name="work" label="What you do" placeholder="Holistic coach, founder, surgeon…" required />
            <Field name="city" label="Your city" autoComplete="address-level2" required />
            <label className="field">
              <span className="label">Instagram</span>
              <input
                name="instagram"
                placeholder="@"
                aria-invalid={!!error || undefined}
                aria-describedby={error ? 'ig-err' : undefined}
              />
              {error && (
                <span id="ig-err" className="field-error">
                  {error}
                </span>
              )}
            </label>
            <button className="cta cta-wide" type="submit" disabled={state === 'sending'}>
              <span className="btn-swap" data-state={state}>
                <span>Ask about a seat</span>
                <span aria-hidden={state !== 'sending'}>Sending…</span>
              </span>
              <span className="cta-arrow" aria-hidden>
                →
              </span>
            </button>
          </form>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

function Field(props: { name: string; label: string; placeholder?: string; autoComplete?: string; required?: boolean }) {
  const { label, ...rest } = props
  return (
    <label className="field">
      <span className="label">{label}</span>
      <input {...rest} />
    </label>
  )
}
