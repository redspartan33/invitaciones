import { useMemo } from 'react'
import { v4 as uuid } from 'uuid'
import { useEditorStore } from '../../store/editorStore'
import type {
  InvitationBlock,
  MenuHeaderData,
  MenuNavItem,
  MenuSectionData,
} from '../../types/invitation.types'
import { menuSectionAnchor } from '../../utils/menuNav'
import { PlusIcon, TrashIcon } from '../blocks/icons'
import { DragHandle, SortableItem, SortableList } from './SortableItem'

/**
 * Editor for the menu-header sticky nav. When `navItems` is undefined or
 * empty, the nav auto-populates from the visible menu-section blocks. When
 * set, only the listed items render — allowing rename, hide, reorder, and
 * custom links to any section by anchor.
 */
export function MenuNavItemsForm({ block }: { block: InvitationBlock<'menu-header'> }) {
  const updateBlockData = useEditorStore((s) => s.updateBlockData)
  const sectionBlocks = useEditorStore((s) =>
    s.invitation.kind === 'menu'
      ? s.invitation.blocks
          .filter((b) => b.type === 'menu-section' && b.visible)
          .sort((a, b) => a.order - b.order)
      : [],
  )
  const data = block.data as MenuHeaderData

  // Build the list of all available section targets (anchor + display title).
  const sectionTargets = useMemo(
    () =>
      sectionBlocks.map((b) => {
        const d = b.data as MenuSectionData
        const anchor = menuSectionAnchor(b.id, d.title, d.customAnchor)
        return { anchor, title: d.title || 'Sección', isCustom: !!d.customAnchor?.trim() }
      }),
    [sectionBlocks],
  )

  const navItems: MenuNavItem[] | undefined = data.navItems
  const isCustom = Array.isArray(navItems) && navItems.length > 0

  const setItems = (items: MenuNavItem[] | undefined) =>
    updateBlockData(block.id, { navItems: items })

  // Switch from auto → custom by seeding the list from current sections.
  const enableCustom = () => {
    const seed: MenuNavItem[] = sectionTargets.map((t) => ({
      id: uuid(),
      label: t.title,
      targetAnchor: t.anchor,
    }))
    setItems(seed)
  }
  const restoreAuto = () => setItems(undefined)

  const update = (id: string, patch: Partial<MenuNavItem>) => {
    if (!navItems) return
    setItems(navItems.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  const remove = (id: string) => {
    if (!navItems) return
    setItems(navItems.filter((it) => it.id !== id))
  }

  const addCustom = () => {
    const first = sectionTargets[0]
    const item: MenuNavItem = {
      id: uuid(),
      label: 'Nueva opción',
      targetAnchor: first?.anchor ?? '',
    }
    setItems([...(navItems ?? []), item])
  }

  const reorder = (fromId: string, toId: string) => {
    if (!navItems) return
    const from = navItems.findIndex((it) => it.id === fromId)
    const to = navItems.findIndex((it) => it.id === toId)
    if (from === -1 || to === -1) return
    const copy = [...navItems]
    const [m] = copy.splice(from, 1)
    copy.splice(to, 0, m)
    setItems(copy)
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">
          Navegación
        </h3>
        {isCustom ? (
          <button
            type="button"
            onClick={() => {
              if (confirm('¿Restaurar la navegación automática? Se perderán los items personalizados.')) {
                restoreAuto()
              }
            }}
            className="text-[11px] font-medium uppercase tracking-widest text-ink-500 hover:text-rose-600"
          >
            Restaurar auto
          </button>
        ) : (
          <button
            type="button"
            onClick={enableCustom}
            className="text-[11px] font-medium uppercase tracking-widest text-ink-500 hover:text-ink-900"
          >
            Personalizar
          </button>
        )}
      </div>

      {!isCustom ? (
        <div className="rounded border border-dashed border-ink-300 bg-ink-50 p-3">
          <p className="text-[11px] leading-snug text-ink-600">
            La navegación se genera automáticamente con las{' '}
            <span className="font-semibold text-ink-900">{sectionTargets.length}</span> sección
            {sectionTargets.length === 1 ? '' : 'es'} visible{sectionTargets.length === 1 ? '' : 's'} del menú.
            Pulsa <span className="font-medium">Personalizar</span> para renombrar, ocultar, reordenar
            o añadir opciones que apunten a secciones específicas (por ID).
          </p>
          {sectionTargets.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {sectionTargets.map((t) => (
                <li
                  key={t.anchor}
                  className="rounded-full border border-ink-200 bg-white px-2 py-0.5 text-[11px] text-ink-600"
                  title={`#${t.anchor}`}
                >
                  {t.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          {navItems!.length === 0 ? (
            <p className="rounded border border-dashed border-ink-300 bg-ink-50 px-3 py-2 text-[11px] text-ink-500">
              No hay items en la navegación. Añade uno o pulsa <em>Restaurar auto</em>.
            </p>
          ) : (
            <SortableList ids={navItems!.map((it) => it.id)} onReorder={reorder}>
              <div className="space-y-2">
                {navItems!.map((item) => {
                  const matchedTarget = sectionTargets.find((t) => t.anchor === item.targetAnchor)
                  const targetMissing = !matchedTarget && !!item.targetAnchor
                  return (
                    <SortableItem key={item.id} id={item.id}>
                      {({ handleProps }) => (
                        <div className="space-y-2 rounded border border-ink-200 bg-white p-3">
                          <div className="flex items-center gap-2">
                            <DragHandle handleProps={handleProps} />
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) => update(item.id, { label: e.target.value })}
                              placeholder="Etiqueta de la nav"
                              className="input-flat flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => remove(item.id)}
                              className="btn-ghost text-rose-600 shrink-0"
                              title="Quitar de la navegación"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] uppercase tracking-widest text-ink-400 shrink-0">
                              → Sección
                            </label>
                            <select
                              value={item.targetAnchor}
                              onChange={(e) => update(item.id, { targetAnchor: e.target.value })}
                              className="input-flat flex-1"
                            >
                              {sectionTargets.length === 0 && (
                                <option value="">(no hay secciones)</option>
                              )}
                              {sectionTargets.map((t) => (
                                <option key={t.anchor} value={t.anchor}>
                                  {t.title} — #{t.anchor}
                                  {t.isCustom ? ' (ID propio)' : ''}
                                </option>
                              ))}
                              {targetMissing && (
                                <option value={item.targetAnchor}>
                                  ⚠ #{item.targetAnchor} (sección no encontrada)
                                </option>
                              )}
                            </select>
                          </div>
                          {targetMissing && (
                            <p className="text-[11px] text-rose-600">
                              Esta opción apunta a <code>#{item.targetAnchor}</code> pero ninguna
                              sección visible tiene ese ID. Asigna ese ID a una sección o cambia el target.
                            </p>
                          )}
                        </div>
                      )}
                    </SortableItem>
                  )
                })}
              </div>
            </SortableList>
          )}
          <button type="button" onClick={addCustom} className="btn-flat w-full">
            <PlusIcon className="h-4 w-4" /> Añadir opción a la nav
          </button>
          <p className="text-[11px] text-ink-400">
            Tip: para apuntar a una sección por nombre estable, ponle un{' '}
            <span className="font-medium">ID personalizado</span> en el panel de esa sección.
          </p>
        </>
      )}
    </section>
  )
}
