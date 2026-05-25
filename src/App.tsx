import { useEffect, useState } from 'react'
import { InvitationBuilder } from './components/editor/InvitationBuilder'
import { PublicInvitationView } from './components/public/PublicInvitationView'
import { PageBackgroundLayer } from './components/public/PageBackgroundLayer'
import { GuestListView } from './components/public/GuestListView'
import { PublicSkeleton, readKindCache, writeKindCache } from './components/public/skeletons'
import { AdminView, ForbiddenView } from './admin/AdminView'
import { ADMIN_TOKEN, isAdminUrl } from './admin/adminAuth'
import { loadFromRegistry } from './utils/inviteRegistry'
import type { Invitation } from './types/invitation.types'

type Route =
  | { kind: 'forbidden' }
  | { kind: 'admin' }
  | { kind: 'editor' }
  | { kind: 'public-id'; id: string }
  | { kind: 'public-guestlist'; slug: string }

function resolveRoute(url: URL): Route {
  // Accept both `?id=` (new short-slug format) and `?inv=` (legacy).
  const guestlist = url.searchParams.get('guestlist') || undefined
  if (guestlist) return { kind: 'public-guestlist', slug: guestlist }
  const inv = url.searchParams.get('id') || url.searchParams.get('inv') || undefined
  if (inv) return { kind: 'public-id', id: inv }

  if (isAdminUrl(url)) {
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
      if (cancelled) return
      if (inv) {
        const kind = inv.kind ?? (inv.blocks?.some((b) => b.type.startsWith('menu-')) ? 'menu' : 'invitation')
        writeKindCache(route.id, kind)
      }
      setPublicInvitation(inv)
    })
    return () => {
      cancelled = true
    }
  }, [route])

  if (route.kind === 'public-id') {
    if (publicInvitation === undefined) {
      return <PublicSkeleton kind={readKindCache(route.id)} />
    }
    if (!publicInvitation) return <ForbiddenView />
    return (
      <>
        {/* Render the page background at root level so it sits outside every
            stacking context and its fixed/absolute positioning reaches the
            actual viewport — not the clipped area of a relative ancestor. */}
        <PageBackgroundLayer bg={publicInvitation.globalSettings.pageBackground} />
        <PublicInvitationView invitation={publicInvitation} />
      </>
    )
  }

  if (route.kind === 'public-guestlist') {
    return <GuestListView slug={route.slug} />
  }

  if (route.kind === 'admin') {
    return (
      <AdminView
        onOpenEditor={(id, kind) => {
          const params = new URLSearchParams()
          params.set('admin', ADMIN_TOKEN)
          if (id) params.set('edit', id)
          else params.set('new', kind === 'menu' ? 'menu' : 'invitation')
          window.history.pushState({}, '', `/?${params.toString()}`)
          setRoute({ kind: 'editor' })
        }}
      />
    )
  }

  if (route.kind === 'editor') return <InvitationBuilder />

  return <AccessDeniedView />
}

function AccessDeniedView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 p-8 text-center">
      <div>
        <p className="font-serif text-5xl leading-none text-ink-900">Acceso no permitido</p>
        <p className="mt-6 max-w-md text-sm text-ink-500">
          No tienes autorización para ver esta página.
        </p>
      </div>
    </div>
  )
}
