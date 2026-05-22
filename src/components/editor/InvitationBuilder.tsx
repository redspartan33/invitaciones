import { useState } from 'react'
import { Canvas } from './Canvas'
import { ConfigPanel } from './ConfigPanel'
import { EditorFootbar } from './EditorFootbar'
import { EditorHeader } from './EditorHeader'
import { GuideModal } from './GuideModal'

export function InvitationBuilder() {
  const [showGuide, setShowGuide] = useState(false)
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
