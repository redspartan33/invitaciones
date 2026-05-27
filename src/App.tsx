import { useEffect, useState } from 'react'
import { InvitationBuilder } from './components/editor/InvitationBuilder'
import { PublicInvitationView } from './components/public/PublicInvitationView'
import { PageBackgroundLayer } from './components/public/PageBackgroundLayer'
import { GuestListView } from './components/public/GuestListView'
import { MetricsView } from './components/public/MetricsView'
import { LandingPage } from './components/public/LandingPage'
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
  | { kind: 'public-metrics'; slug: string }

function resolveRoute(url: URL): Route {
  // Accept both `?id=` (new short-slug format) and `?inv=` (legacy).
  const guestlist = url.searchParams.get('guestlist') || undefined
  if (guestlist) return { kind: 'public-guestlist', slug: guestlist }
  const metrics = url.searchParams.get('metrics') || undefined
  if (metrics) return { kind: 'public-metrics', slug: metrics }
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

  if (route.kind === 'public-metrics') {
    return <MetricsView slug={route.slug} />
  }

  if (route.kind === 'admin') {
    return (
      <AdminView
        onOpenEditor={(id, kind, template) => {
          const params = new URLSearchParams()
          params.set('admin', ADMIN_TOKEN)
          if (id) params.set('edit', id)
          else {
            // `template` (e.g. 'hannah-michael', 'cocinoteca') wins over the
            // generic kind so the boot picks the right factory in
            // InvitationBuilder.
            params.set('new', template || (kind === 'menu' ? 'menu' : 'invitation'))
          }
          window.history.pushState({}, '', `/?${params.toString()}`)
          setRoute({ kind: 'editor' })
        }}
      />
    )
  }

  if (route.kind === 'editor') return <InvitationBuilder />

  return <LandingPage />
}
