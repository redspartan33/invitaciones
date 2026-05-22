import { useMemo } from 'react'
import { InvitationBuilder } from './components/editor/InvitationBuilder'
import { NotFoundView, PublicInvitationView } from './components/public/PublicInvitationView'
import { decodeInvitation, loadPublishedById } from './store/editorStore'
import type { Invitation } from './types/invitation.types'

function readPublicInvitation(): Invitation | null {
  const url = new URL(window.location.href)
  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
  const hashParams = new URLSearchParams(hash)
  const data = hashParams.get('data')
  if (data) {
    const decoded = decodeInvitation(data)
    if (decoded) return decoded
  }
  const id = url.searchParams.get('inv')
  if (id) return loadPublishedById(id)
  return null
}

export default function App() {
  const url = new URL(window.location.href)
  const isPublicView = url.searchParams.has('inv') || url.hash.includes('data=')

  const publicInvitation = useMemo<Invitation | null>(() => {
    return isPublicView ? readPublicInvitation() : null
  }, [isPublicView])

  if (isPublicView) {
    return publicInvitation ? <PublicInvitationView invitation={publicInvitation} /> : <NotFoundView />
  }
  return <InvitationBuilder />
}
