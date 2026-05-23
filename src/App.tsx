import { useEffect, useState } from 'react'
import { InvitationBuilder } from './components/editor/InvitationBuilder'
import { PublicInvitationView } from './components/public/PublicInvitationView'
import { AdminView, ForbiddenView } from './admin/AdminView'
import { ADMIN_TOKEN, isAdminUrl } from './admin/adminAuth'
import { loadFromRegistry } from './utils/inviteRegistry'
import type { Invitation } from './types/invitation.types'

type Route =
  | { kind: 'forbidden' }
  | { kind: 'admin' }
  | { kind: 'editor' }
  | { kind: 'public-id'; id: string }

function resolveRoute(url: URL): Route {
  // Accept both `?id=` (new short-slug format) and `?inv=` (legacy).
  const inv = url.searchParams.get('id') || url.searchParams.get('inv') || undefined
  if (inv) return { kind: 'public-id', id: inv }

  // Admin auth gate (currently relaxed; flip ADMIN_AUTH_ENABLED back to true
  // before production to require the token).
  const ADMIN_AUTH_ENABLED = false
  if (!ADMIN_AUTH_ENABLED || isAdminUrl(url)) {
    if (url.searchParams.get('edit') || url.searchParams.get('new')) return { kind: 'editor' }
    return { kind: 'admin' }
  }

  return { kind: 'forbidden' }
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => resolveRoute(new URL(window.location.href)))
  const [publicInvitation, setPublicInvitation] = useState<Invitation | null | undefined>(
    route.kind === 'public-id' ? undefined : null,
  )

  useEffect(() => {
    const onPop = () => setRoute(resolveRoute(new URL(window.location.href)))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (route.kind !== 'public-id') return
    let cancelled = false
    setPublicInvitation(undefined)
    loadFromRegistry(route.id).then((inv) => {
      if (!cancelled) setPublicInvitation(inv)
    })
    return () => {
      cancelled = true
    }
  }, [route])

  if (route.kind === 'public-id') {
    if (publicInvitation === undefined) {
      return (
        <div className="flex min-h-screen items-center justify-center text-sm text-ink-500">
          Cargando invitación…
        </div>
      )
    }
    return publicInvitation ? <PublicInvitationView invitation={publicInvitation} /> : <ForbiddenView />
  }

  if (route.kind === 'admin') {
    return (
      <AdminView
        onOpenEditor={(id) => {
          const params = new URLSearchParams()
          params.set('admin', ADMIN_TOKEN)
          if (id) params.set('edit', id)
          else params.set('new', '1')
          window.history.pushState({}, '', `/?${params.toString()}`)
          setRoute({ kind: 'editor' })
        }}
      />
    )
  }

  if (route.kind === 'editor') return <InvitationBuilder />

  return <ForbiddenView />
}
