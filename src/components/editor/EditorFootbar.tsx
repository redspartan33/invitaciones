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
    <footer className="relative flex flex-wrap items-center justify-between gap-2 border-t border-ink-200 bg-ink-50 px-3 py-2 md:flex-nowrap md:px-4">
      <div className="order-2 flex w-full items-center gap-1 overflow-x-auto md:order-1 md:w-auto md:overflow-visible">
        <FootbarBtn label="Detalles" active={activePanel === 'details'} onClick={() => setActivePanel(activePanel === 'details' ? null : 'details')} />
        <FootbarBtn label="Colores" active={activePanel === 'colors'} onClick={() => setActivePanel(activePanel === 'colors' ? null : 'colors')} />
        <FootbarBtn label="Fuentes" active={activePanel === 'fonts'} onClick={() => setActivePanel(activePanel === 'fonts' ? null : 'fonts')} />
        <FootbarBtn label="Música" active={activePanel === 'music'} onClick={() => setActivePanel(activePanel === 'music' ? null : 'music')} />
        <span className="mx-2 hidden h-5 w-px bg-ink-200 md:inline-block" />
        <FootbarBtn label="Guía" onClick={onShowGuide} />
      </div>

      <div className="order-3 hidden items-center gap-1 rounded border border-ink-200 bg-white p-0.5 md:order-2 md:flex">
        {VIEWPORT_TABS.map((v) => (
          <button
            key={v.value}
            onClick={() => setViewport(v.value)}
            title={`${v.label} · ${v.size}`}
            className={`flex items-center gap-1.5 rounded px-3 py-1 text-[11px] font-medium uppercase tracking-widest transition-colors ${
              viewport === v.value ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-50'
            }`}
          >
            <ViewportIcon kind={v.value} active={viewport === v.value} />
            <span>{v.label}</span>
          </button>
        ))}
      </div>

      <div className="relative order-1 ml-auto md:order-3 md:ml-0">
        <button onClick={() => setAddOpen((v) => !v)} className="btn-primary">
          <PlusIcon className="h-4 w-4" /> <span className="hidden sm:inline">Añadir bloque</span><span className="sm:hidden">+ Bloque</span>
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

const VIEWPORT_TABS: { value: ViewportMode; label: string; size: string }[] = [
  { value: 'mobile', label: 'Mobile', size: '390 × 760' },
  { value: 'tablet', label: 'Tablet', size: '820 × 1080' },
  { value: 'desktop', label: 'Desktop', size: '1100 ancho' },
]

function ViewportIcon({ kind, active }: { kind: ViewportMode; active: boolean }) {
  const cls = `h-3.5 w-3.5 ${active ? 'text-white' : 'text-ink-500'}`
  if (kind === 'mobile') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
        <line x1="11" y1="18.5" x2="13" y2="18.5" />
      </svg>
    )
  }
  if (kind === 'tablet') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <line x1="11" y1="18" x2="13" y2="18" />
      </svg>
    )
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="4" width="19" height="12.5" rx="1.5" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="16.5" x2="12" y2="20" />
    </svg>
  )
}
