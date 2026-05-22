import { v4 as uuid } from 'uuid'
import { useEditorStore } from '../../store/editorStore'
import type { GalleryData, GalleryImage, InvitationBlock } from '../../types/invitation.types'
import { PlusIcon, TrashIcon } from '../blocks/icons'

export function GalleryImagesForm({ block }: { block: InvitationBlock<'gallery'> }) {
  const updateBlockData = useEditorStore((s) => s.updateBlockData)
  const data = block.data as GalleryData
  const setImages = (images: GalleryImage[]) => updateBlockData(block.id, { images })

  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink-400">Imágenes</h3>
      <div className="space-y-2">
        {data.images.map((img) => (
          <div key={img.id} className="space-y-2 rounded border border-ink-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={img.url}
                onChange={(e) => setImages(data.images.map((x) => (x.id === img.id ? { ...x, url: e.target.value } : x)))}
                placeholder="URL de la imagen"
                className="input-flat flex-1"
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
        ))}
      </div>
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
