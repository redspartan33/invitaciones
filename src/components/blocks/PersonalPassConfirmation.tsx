import { useState } from 'react'
import { confirmPass } from '../../utils/personalPass'
import type { PersonalPassState } from './PersonalPassContext'

// Theme-neutral hairlines: the RSVP block inherits the invitation's text
// color, so borders/fills are derived from currentColor instead of fixed UI
// tokens. That keeps the pass legible on light AND dark invitation designs.
const hairline = { borderColor: 'color-mix(in srgb, currentColor 22%, transparent)' }
const tint = { backgroundColor: 'color-mix(in srgb, currentColor 6%, transparent)' }

function seatsLabel(n: number) {
  return n === 1 ? '1 lugar reservado' : `${n} lugares reservados`
}

/**
 * Replaces the regular RSVP controls when the invitation is opened through a
 * personal pass link (`?pase=`). The guest's name, seats and the host's note
 * are fixed; the guest can only add an optional message and confirm.
 */
export function PersonalPassConfirmation({
  state,
  isEditorView,
}: {
  state: Extract<PersonalPassState, { status: 'loading' | 'ready' }>
  isEditorView: boolean
}) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (state.status === 'loading') {
    return (
      <div className="mx-auto mt-6 max-w-md animate-pulse rounded-3xl border px-6 py-8" style={hairline}>
        <div className="mx-auto h-3 w-24 rounded-full" style={tint} />
        <div className="mx-auto mt-4 h-6 w-48 rounded-full" style={tint} />
        <div className="mx-auto mt-3 h-4 w-32 rounded-full" style={tint} />
      </div>
    )
  }

  const { pass, guestListSlug } = state
  const confirmed = done || (state.alreadyConfirmed && !isEditorView)

  const onConfirm = async () => {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    const result = await confirmPass(guestListSlug, pass, message)
    setSubmitting(false)
    if (result.ok) {
      setDone(true)
    } else {
      setError(
        result.reason === 'network'
          ? 'No hay conexión con el servidor. Verifica tu internet y vuelve a intentar.'
          : 'No pudimos registrar tu confirmación. Intenta de nuevo en un momento.',
      )
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-md rounded-3xl border px-6 py-7 text-center anim-fade-in" style={hairline}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] opacity-60">Pase personalizado</p>
      <p className="mt-3 font-serif text-2xl leading-tight">{pass.name}</p>
      <p className="mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium" style={hairline}>
        {seatsLabel(pass.guests)}
      </p>
      {pass.note && (
        <p className="mx-auto mt-4 max-w-sm whitespace-pre-line text-sm italic opacity-80">“{pass.note}”</p>
      )}

      <div className="my-6 border-t" style={hairline} />

      {confirmed ? (
        <div className="space-y-2">
          <p className="font-medium">¡Gracias, {pass.name}!</p>
          <p className="text-sm opacity-80">
            Tu asistencia quedó confirmada{pass.guests > 1 ? ` para ${pass.guests} personas` : ''}.
          </p>
          {!done && state.confirmedMessage && (
            <p className="text-sm italic opacity-70">“{state.confirmedMessage}”</p>
          )}
        </div>
      ) : (
        <div className="space-y-4 text-left">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide opacity-60">
              Mensaje (opcional)
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe unas palabras para los anfitriones…"
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-2xl border bg-transparent px-4 py-3 text-sm outline-none placeholder:opacity-50 focus:border-current"
              style={hairline}
            />
          </label>
          {error && (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-900">{error}</p>
          )}
          <div className="text-center">
            <button type="button" onClick={onConfirm} disabled={submitting} className="invitation-btn disabled:opacity-60">
              {submitting ? 'Confirmando…' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
