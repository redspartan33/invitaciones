import { useEffect, useState } from 'react'
import { Canvas } from './Canvas'
import { ConfigPanel } from './ConfigPanel'
import { EditorFootbar } from './EditorFootbar'
import { EditorHeader } from './EditorHeader'
import { GuideModal } from './GuideModal'
import { INVITATION_PREFIX, useEditorStore } from '../../store/editorStore'
import { createExampleInvitation } from '../../utils/blockDefaults'

export function InvitationBuilder() {
  const [showGuide, setShowGuide] = useState(false)
  const loadInvitation = useEditorStore((s) => s.loadInvitation)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const editId = params.get('edit')

    if (editId) {
      const key = INVITATION_PREFIX + editId
      const raw = window.localStorage.getItem(key)
      if (raw) {
        try {
          const inv = JSON.parse(raw)
          loadInvitation(inv)
        } catch (e) {
          console.error('Failed to parse invitation', e)
        }
      } else {
        // Compatibilidad: buscar en publicadas antiguas por si acaso
        const pubKey = 'invitation-builder:published:' + editId
        const rawPub = window.localStorage.getItem(pubKey)
        if (rawPub) {
          try {
            const inv = JSON.parse(rawPub)
            // Guardar como master y cargar
            window.localStorage.setItem(key, JSON.stringify(inv))
            loadInvitation(inv)
          } catch (e) {
            console.error('Failed to parse published invitation', e)
          }
        } else {
          // Si no existe en ningún lado, crear una nueva con ese ID para evitar errores
          const newInv = createExampleInvitation()
          newInv.id = editId
          window.localStorage.setItem(key, JSON.stringify(newInv))
          loadInvitation(newInv)
        }
      }
    } else {
      // No hay ID en la URL: estamos creando una nueva invitación
      const newInv = createExampleInvitation()
      const key = INVITATION_PREFIX + newInv.id
      window.localStorage.setItem(key, JSON.stringify(newInv))
      loadInvitation(newInv)

      // Actualizar la URL de forma transparente para que si recargan continúe en esta sesión
      const nextParams = new URLSearchParams(window.location.search)
      nextParams.set('edit', newInv.id)
      nextParams.delete('new') // quitar 'new' si existía
      window.history.replaceState({}, '', `/?${nextParams.toString()}`)
    }
    setLoading(false)
  }, [loadInvitation])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-sm text-ink-500 font-medium">
        <span className="animate-pulse">Cargando editor de invitaciones…</span>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      <EditorHeader />
      <div className="flex flex-1 overflow-hidden">
        <Canvas />
        <ConfigPanel />
      </div>
      <EditorFootbar onShowGuide={() => setShowGuide(true)} />
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
    </div>
  )
}
