import { useRef } from 'react'
import { v4 as uuid } from 'uuid'
import { useEditorStore } from '../../store/editorStore'
import type { GalleryData, GalleryImage, InvitationBlock } from '../../types/invitation.types'
import { PlusIcon, TrashIcon } from '../blocks/icons'
import { DragHandle, SortableItem, SortableList } from './SortableItem'

export function GalleryImagesForm({ block }: { block: InvitationBlock<'gallery'> }) {
  const updateBlockData = useEditorStore((s) => s.updateBlockData)
  const data = block.data as GalleryData
  const setImages = (images: GalleryImage[]) => updateBlockData(block.id, { images })
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const onPickFile = (imgId: string, file: File) => {
    if (file.size > 3 * 1024 * 1024) {
      alert(`La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB (máx 3 MB). Usa una más ligera o pega una URL pública.`)
      return
    }
    const reader = new FileReader()
    reader.onload = () =>
      setImages(data.images.map((x) => (x.id === imgId ? { ...x, url: String(reader.result) } : x)))
    reader.readAsDataURL(file)
  }

  const reorder = (fromId: string, toId: string) => {
    const from = data.images.findIndex((it) => it.id === fromId)
    const to = data.images.findIndex((it) => it.id === toId)
    if (from === -1 || to === -1) return
    const copy = [...data.images]
    const [m] = copy.splice(from, 1)
    copy.splice(to, 0, m)
    setImages(copy)
  }

  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Imágenes</h3>
      <SortableList ids={data.images.map((img) => img.id)} onReorder={reorder}>
        <div className="space-y-2">
          {data.images.map((img) => (
            <SortableItem key={img.id} id={img.id}>
              {({ handleProps }) => (
                <div className="space-y-2 rounded border border-ink-200 bg-white p-3">
                  <div className="flex items-center gap-2">
                    <DragHandle handleProps={handleProps} />
                    <input
                      type="url"
                      value={img.url.startsWith('data:') ? '' : img.url}
                      onChange={(e) => setImages(data.images.map((x) => (x.id === img.id ? { ...x, url: e.target.value } : x)))}
                      placeholder="URL o sube archivo →"
                      className="input-flat flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => fileRefs.current[img.id]?.click()}
                      className="rounded border border-ink-200 bg-white px-3 py-2 text-xs uppercase tracking-widest text-ink-600 hover:border-ink-400"
                    >
                      Subir
                    </button>
                    <input
                      ref={(el) => (fileRefs.current[img.id] = el)}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) onPickFile(img.id, f)
                        e.target.value = ''
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setImages(data.images.filter((x) => x.id !== img.id))}
                      className="btn-ghost text-rose-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {img.url && (
                    <div className="overflow-hidden rounded border border-ink-200 bg-ink-50">
                      <img src={img.url} alt="" className="block h-24 w-full object-cover" />
                    </div>
                  )}
                </div>
              )}
            </SortableItem>
          ))}
        </div>
      </SortableList>
      <button
        type="button"
        onClick={() => setImages([...data.images, { id: uuid(), url: '' }])}
        className="btn-flat w-full"
      >
        <PlusIcon className="h-4 w-4" /> Añadir imagen
      </button>
    </section>
  )
}
