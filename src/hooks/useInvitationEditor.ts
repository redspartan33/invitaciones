import { useEditorStore } from '../store/editorStore'

// Convenience facade — exposes the same store with a clearer name.
export function useInvitationEditor() {
  return useEditorStore()
}
