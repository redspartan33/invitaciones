import { useEffect, useState } from 'react'
import { InvitationBuilder } from './components/editor/InvitationBuilder'
import { PublicInvitationView } from './components/public/PublicInvitationView'
import { AdminView, ForbiddenView } from './admin/AdminView'
import { ADMIN_TOKEN, isAdminUrl } from './admin/adminAuth'
import {
  decodeInvitation,
  decodeInvitationCompressed,
  loadPublishedById,
} from './store/editorStore'
import { fetchFromJsonBlob, isJsonBlobId } from './utils/jsonblob'
import { loadFromRegistry } from './utils/inviteRegistry'
import type { Invitation } from './types/invitation.types'

type Route =
  | { kind: 'forbidden' }
  | { kind: 'admin' }
  | { kind: 'editor' }
  | { kind: 'public-hash'; encoded: string; compressed: boolean; slug?: string }
  | { kind: 'public-id'; id: string }

function resolveRoute(url: URL): Route {
  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
  const hashParams = new URLSearchParams(hash)
  // Accept both `?id=` (new short-slug format) and `?inv=` (legacy).
  const inv = url.searchParams.get('id') || url.searchParams.get('inv') || undefined
  const compressed = hashParams.get('d')
  if (compressed) return { kind: 'public-hash', encoded: compressed, compressed: true, slug: inv }
  const data = hashParams.get('data')
  if (data) return { kind: 'public-hash', encoded: data, compressed: false, slug: inv }

  if (inv) return { kind: 'public-id', id: inv }

  if (isAdminUrl(url)) {
    if (url.searchParams.get('edit') || url.searchParams.get('new')) return { kind: 'editor' }
    return { kind: 'admin' }
  }

  return { kind: 'forbidden' }
}

async function resolvePublic(route: Route): Promise<Invitation | null> {
  if (route.kind === 'public-hash') {
    return route.compressed
      ? await decodeInvitationCompressed(route.encoded)
      : decodeInvitation(route.encoded)
  }
  if (route.kind === 'public-id') {
    // Primary: shared registry indexed by short slug.
    if (!isJsonBlobId(route.id)) {
      const remote = await loadFromRegistry(route.id)
      if (remote) return remote
    }
    // Legacy: previous JSONBlob UUID slugs.
    if (isJsonBlobId(route.id)) {
      const remote = await fetchFromJsonBlob(route.id)
      if (remote) return remote
    }
    return loadPublishedById(route.id)
  }
  return null
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => resolveRoute(new URL(window.location.href)))
  const [publicInvitation, setPublicInvitation] = useState<Invitation | null | undefined>(
    route.kind === 'public-hash' || route.kind === 'public-id' ? undefined : null,
  )

  useEffect(() => {
    const onPop = () => setRoute(resolveRoute(new URL(window.location.href)))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (route.kind !== 'public-hash' && route.kind !== 'public-id') return
    let cancelled = false
    setPublicInvitation(undefined)
    resolvePublic(route).then((inv) => {
      if (!cancelled) setPublicInvitation(inv)
    })
    return () => {
      cancelled = true
    }
  }, [route])

  if (route.kind === 'public-hash' || route.kind === 'public-id') {
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
