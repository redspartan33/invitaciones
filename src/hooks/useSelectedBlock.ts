import { useEditorStore } from '../store/editorStore'
import type { InvitationBlock } from '../types/invitation.types'

export function useSelectedBlock(): InvitationBlock | null {
  const selectedId = useEditorStore((s) => s.selectedBlockId)
  const blocks = useEditorStore((s) => s.invitation.blocks)
  if (!selectedId) return null
  return blocks.find((b) => b.id === selectedId) ?? null
}
