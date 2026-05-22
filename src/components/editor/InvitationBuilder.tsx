import { useEffect, useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { Canvas } from './Canvas'
import { ConfigPanel } from './ConfigPanel'
import { EditorFootbar } from './EditorFootbar'
import { EditorHeader } from './EditorHeader'
import { GuideModal } from './GuideModal'

export function InvitationBuilder() {
  const accent = useEditorStore((s) => s.invitation.globalSettings.colorAccent)
  const [showGuide, setShowGuide] = useState(false)

  // Push the accent color into a CSS variable so flat buttons can use it.
  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent', accent)
  }, [accent])

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
