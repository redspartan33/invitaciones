import { useEffect, useState } from 'react'
import { InvitationBuilder } from './components/editor/InvitationBuilder'
import { NotFoundView, PublicInvitationView } from './components/public/PublicInvitationView'
import { decodeInvitation, fetchPublishedFromBackend, loadBackend, loadPublishedById } from './store/editorStore'
import type { Invitation } from './types/invitation.types'

async function readPublicInvitation(): Promise<Invitation | null> {
  const url = new URL(window.location.href)
  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
  const hashParams = new URLSearchParams(hash)
  const data = hashParams.get('data')
  if (data) {
    const decoded = decodeInvitation(data)
    if (decoded) return decoded
  }
  const id = url.searchParams.get('inv')
  if (!id) return null
  const backend = loadBackend()
  if (backend.baseUrl) {
    const remote = await fetchPublishedFromBackend(id, backend)
    if (remote) return remote
  }
  return loadPublishedById(id)
}

export default function App() {
  const url = new URL(window.location.href)
  const isPublicView = url.searchParams.has('inv') || url.hash.includes('data=')

  const [publicInvitation, setPublicInvitation] = useState<Invitation | null | undefined>(
    isPublicView ? undefined : null,
  )

  useEffect(() => {
    if (!isPublicView) return
    let cancelled = false
    readPublicInvitation().then((inv) => {
      if (!cancelled) setPublicInvitation(inv)
    })
    return () => {
      cancelled = true
    }
  }, [isPublicView])

  if (isPublicView) {
    if (publicInvitation === undefined) {
      return (
        <div className="flex min-h-screen items-center justify-center text-sm text-ink-500">
          Cargando invitación…
        </div>
      )
    }
    return publicInvitation ? <PublicInvitationView invitation={publicInvitation} /> : <NotFoundView />
  }
  return <InvitationBuilder />
}
