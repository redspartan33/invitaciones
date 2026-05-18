import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  type Block,
  type BlockType,
  BLOCK_LABELS,
  makeBlock,
  generateHtmlContent,
} from '../blocks';

function CanvasBlock({
  block,
  selected,
  onSelect,
}: {
  block: Block;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`relative cursor-pointer ${
        selected ? 'outline outline-2 outline-blue-500' : 'hover:outline hover:outline-1 hover:outline-blue-300'
      }`}
    >
      {(selected || isDragging) && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="absolute -left-7 top-0 text-gray-400 hover:text-gray-700 cursor-grab active:cursor-grabbing select-none"
          aria-label="Reordenar"
        >
          ⠿
        </button>
      )}
      {block.type === 'heading' && (
        <h2 style={{ fontSize: '2em', lineHeight: 1.2, margin: '28px 0 12px' }}>
          {block.text || <span className="text-gray-300">Título…</span>}
        </h2>
      )}
      {block.type === 'text' && (
        <p style={{ fontSize: '1.05em', lineHeight: 1.7, margin: '14px 0', whiteSpace: 'pre-wrap' }}>
          {block.text || <span className="text-gray-300">Texto…</span>}
        </p>
      )}
      {block.type === 'image' && (
        <figure style={{ margin: '22px 0' }}>
          {block.url ? (
            <img src={block.url} alt={block.caption} style={{ width: '100%', display: 'block' }} />
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-300 text-gray-400 text-sm py-10 text-center">
              Imagen sin subir
            </div>
          )}
          {block.caption && (
            <figcaption style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.9em', marginTop: 8 }}>
              {block.caption}
            </figcaption>
          )}
        </figure>
      )}
      {block.type === 'video' && (
        <div style={{ margin: '22px 0' }}>
          {block.url ? (
            <video src={block.url} controls style={{ width: '100%', display: 'block' }} />
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-300 text-gray-400 text-sm py-10 text-center">
              Video sin subir
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound'>('loading');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    axios
      .get(`/api/invitations/${id}`)
      .then((res) => {
        setTitle(res.data.title);
        setBlocks(res.data.config?.blocks ?? []);
        setStatus('ready');
      })
      .catch(() => setStatus('notfound'));
  }, [id]);

  const selected = blocks.find((b) => b.id === selectedId) || null;

  const addBlock = (type: BlockType) => {
    const b = makeBlock(type);
    setBlocks((prev) => [...prev, b]);
    setSelectedId(b.id);
  };

  const updateSelected = (patch: Partial<Block>) =>
    setBlocks((prev) => prev.map((b) => (b.id === selectedId ? { ...b, ...patch } : b)));

  const deleteSelected = () => {
    setBlocks((prev) => prev.filter((b) => b.id !== selectedId));
    setSelectedId(null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setBlocks((prev) => {
        const from = prev.findIndex((x) => x.id === active.id);
        const to = prev.findIndex((x) => x.id === over.id);
        return arrayMove(prev, from, to);
      });
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await axios.post('/api/upload', data);
      updateSelected({ url: res.data.url });
    } catch {
      alert('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await axios.put(`/api/invitations/${id}`, {
        title,
        htmlContent: generateHtmlContent(title, blocks),
        config: { blocks },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading')
    return <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">Cargando…</div>;
  if (status === 'notfound')
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-700">Invitación no encontrada</p>
        <button onClick={() => navigate('/admin')} className="text-blue-600 text-sm">
          ← Volver a mis invitaciones
        </button>
      </div>
    );

  return (
    <div className="h-screen flex bg-white text-gray-900">
      {/* Left panel */}
      <aside className="w-80 shrink-0 border-r border-gray-200 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <button onClick={() => navigate('/admin')} className="text-sm text-gray-500 hover:text-gray-800">
            ← Mis invitaciones
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar'}
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {!selected ? (
            <>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Título de la invitación
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-6 focus:outline-none focus:border-gray-900"
              />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Agregar widget
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(BLOCK_LABELS) as BlockType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => addBlock(t)}
                    className="border border-gray-200 rounded-md py-3 text-sm text-gray-700 hover:border-gray-900 hover:text-gray-900"
                  >
                    ＋ {BLOCK_LABELS[t]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-6">
                Haz clic en un elemento del lienzo para editarlo. Arrástralo con ⠿ para reordenarlo.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {BLOCK_LABELS[selected.type]}
                </span>
                <button onClick={() => setSelectedId(null)} className="text-xs text-gray-500 hover:text-gray-800">
                  ← Atrás
                </button>
              </div>

              {selected.type === 'heading' && (
                <input
                  type="text"
                  autoFocus
                  value={selected.text}
                  onChange={(e) => updateSelected({ text: e.target.value })}
                  placeholder="Escribe el título…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-gray-900"
                />
              )}
              {selected.type === 'text' && (
                <textarea
                  autoFocus
                  value={selected.text}
                  onChange={(e) => updateSelected({ text: e.target.value })}
                  placeholder="Escribe el texto…"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-gray-900"
                />
              )}
              {(selected.type === 'image' || selected.type === 'video') && (
                <div className="space-y-3">
                  <label className="block">
                    <span className="inline-block bg-gray-900 text-white text-sm px-3 py-2 rounded-md cursor-pointer hover:bg-gray-800">
                      {uploading
                        ? 'Subiendo…'
                        : selected.url
                        ? 'Reemplazar archivo'
                        : `Subir ${selected.type === 'image' ? 'imagen' : 'video'}`}
                    </span>
                    <input
                      type="file"
                      accept={selected.type === 'image' ? 'image/*' : 'video/*'}
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(f);
                      }}
                    />
                  </label>
                  {selected.type === 'image' && (
                    <input
                      type="text"
                      value={selected.caption}
                      onChange={(e) => updateSelected({ caption: e.target.value })}
                      placeholder="Pie de foto (opcional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-gray-900"
                    />
                  )}
                </div>
              )}

              <button
                onClick={deleteSelected}
                className="mt-6 text-sm text-red-600 hover:text-red-700"
              >
                Eliminar elemento
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Canvas */}
      <main className="flex-1 overflow-y-auto bg-gray-50" onClick={() => setSelectedId(null)}>
        <div
          className="bg-white max-w-[640px] mx-auto my-10 px-10 py-8 min-h-[70vh]"
          onClick={(e) => e.stopPropagation()}
          style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
        >
          {blocks.length === 0 ? (
            <div className="text-center text-gray-400 py-20 text-sm">
              Lienzo vacío. Agrega un widget desde el panel izquierdo.
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                {blocks.map((b) => (
                  <CanvasBlock
                    key={b.id}
                    block={b}
                    selected={b.id === selectedId}
                    onSelect={() => setSelectedId(b.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </main>
    </div>
  );
}

export default Editor;
