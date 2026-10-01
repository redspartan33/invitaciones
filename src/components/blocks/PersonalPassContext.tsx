import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  findPassConfirmation,
  hasConfirmedPassOnDevice,
  loadPass,
  parseConfirmation,
  parsePassToken,
  type PersonalPass,
} from '../../utils/personalPass'
import { loadGuestList } from '../../utils/guestlistClient'

export type PersonalPassState =
  | { status: 'none' }
  | { status: 'loading' }
  | { status: 'invalid' }
  | {
      status: 'ready'
      pass: PersonalPass
      guestListSlug: string
      /** Guest message of an earlier confirmation, when this pass was already used. */
      confirmedMessage?: string
      alreadyConfirmed: boolean
    }

const PersonalPassContext = createContext<PersonalPassState>({ status: 'none' })

export function usePersonalPass(): PersonalPassState {
  return useContext(PersonalPassContext)
}

/**
 * Reads `?pase=<guestListSlug>.<passId>` from the URL and loads the pass so
 * the RSVP block can render the personalized confirmation. Everything else
 * in the invitation renders exactly as usual.
 */
export function PersonalPassProvider({ token, children }: { token: string | null; children: ReactNode }) {
  const [state, setState] = useState<PersonalPassState>(() =>
    parsePassToken(token) ? { status: 'loading' } : token ? { status: 'invalid' } : { status: 'none' },
  )

  useEffect(() => {
    const parsed = parsePassToken(token)
    if (!parsed) {
      setState(token ? { status: 'invalid' } : { status: 'none' })
      return
    }
    let cancelled = false
    setState({ status: 'loading' })
    Promise.all([loadPass(parsed.guestListSlug, parsed.passId), loadGuestList(parsed.guestListSlug)]).then(
      ([pass, list]) => {
        if (cancelled) return
        if (!pass || pass === 'error') {
          setState({ status: 'invalid' })
          return
        }
        const existing = list.ok ? findPassConfirmation(list.entries, pass.id) : undefined
        setState({
          status: 'ready',
          pass,
          guestListSlug: parsed.guestListSlug,
          alreadyConfirmed: !!existing || hasConfirmedPassOnDevice(pass.id),
          confirmedMessage: existing ? parseConfirmation(existing).message : undefined,
        })
      },
    )
    return () => {
      cancelled = true
    }
  }, [token])

  return <PersonalPassContext.Provider value={state}>{children}</PersonalPassContext.Provider>
}
