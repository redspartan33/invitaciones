import { useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import type { BlockType, ViewportMode } from '../../types/invitation.types'
import { blockCatalogFor } from '../../utils/blockDefaults'
import { PlusIcon } from '../blocks/icons'

export function EditorFootbar({ onShowGuide }: { onShowGuide: () => void }) {
  const activePanel = useEditorStore((s) => s.activePanel)
  const setActivePanel = useEditorStore((s) => s.setActivePanel)
  const viewport = useEditorStore((s) => s.viewport)
  const setViewport = useEditorStore((s) => s.setViewport)
  const addBlock = useEditorStore((s) => s.addBlock)
  const kind = useEditorStore((s) => s.invitation.kind ?? 'invitation')
  const catalog = blockCatalogFor(kind)
  const [addOpen, setAddOpen] = useState(false)

  const onAdd = (type: BlockType) => {
    addBlock(type)
    setAddOpen(false)
  }

  return (
    <footer className="relative flex items-center justify-between border-t border-ink-200 bg-ink-50 px-4 py-2">
      <div className="flex items-center gap-1">
        <FootbarBtn label="Detalles" active={activePanel === 'details'} onClick={() => setActivePanel(activePanel === 'details' ? null : 'details')} />
        <FootbarBtn label="Colores" active={activePanel === 'colors'} onClick={() => setActivePanel(activePanel === 'colors' ? null : 'colors')} />
        <FootbarBtn label="Fuentes" active={activePanel === 'fonts'} onClick={() => setActivePanel(activePanel === 'fonts' ? null : 'fonts')} />
        <FootbarBtn label="Música" active={activePanel === 'music'} onClick={() => setActivePanel(activePanel === 'music' ? null : 'music')} />
        <span className="mx-2 h-5 w-px bg-ink-200" />
        <FootbarBtn label="Guía" onClick={onShowGuide} />
      </div>

      <div className="flex items-center gap-1 rounded border border-ink-200 bg-white p-0.5">
        {(['mobile', 'tablet', 'desktop'] as ViewportMode[]).map((v) => (
          <button
            key={v}
            onClick={() => setViewport(v)}
            className={`rounded px-3 py-1 text-xs uppercase tracking-widest ${
              viewport === v ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-50'
            }`}
          >
            {v === 'mobile' ? '📱' : v === 'tablet' ? '▭' : '🖥'} {v}
          </button>
        ))}
      </div>

      <div className="relative">
        <button onClick={() => setAddOpen((v) => !v)} className="btn-primary">
          <PlusIcon className="h-4 w-4" /> Añadir bloque
        </button>
        {addOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setAddOpen(false)} />
            <div className="absolute bottom-12 right-0 z-20 w-72 rounded border border-ink-200 bg-white p-2 anim-fade-in">
              <p className="px-2 py-1.5 text-[11px] uppercase tracking-widest text-ink-400">
                {kind === 'menu' ? 'Bloques de menú' : 'Bloques de invitación'}
              </p>
              <div className="grid grid-cols-1 gap-0.5">
                {catalog.map((b) => (
                  <button
                    key={b.type}
                    onClick={() => onAdd(b.type)}
                    className="flex items-start gap-3 rounded px-2 py-2 text-left transition-colors hover:bg-ink-50"
                  >
                    <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded bg-ink-100 text-ink-700">{b.icon}</span>
                    <span>
                      <span className="block text-sm font-medium text-ink-900">{b.label}</span>
                      <span className="block text-xs text-ink-500">{b.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </footer>
  )
}

function FootbarBtn({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-3 py-1.5 text-xs font-medium uppercase tracking-widest transition-colors ${
        active ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-white'
      }`}
    >
      {label}
    </button>
  )
}
