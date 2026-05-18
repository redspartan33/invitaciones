import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { generateHtmlContent } from '../blocks';

interface InvitationRow {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  guests: { id: string }[];
}

function Admin() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InvitationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const res = await axios.get('/api/invitations');
    setItems(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createNew = async () => {
    setCreating(true);
    try {
      const title = 'Nueva invitación';
      const res = await axios.post('/api/invitations', {
        title,
        htmlContent: generateHtmlContent(title, []),
        config: { blocks: [] },
      });
      navigate(`/editor/${res.data.id}`);
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar esta invitación? Esta acción no se puede deshacer.')) return;
    await axios.delete(`/api/invitations/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/invitations/${id}`);
    alert('Link copiado al portapapeles');
  };

  const fmt = (s: string) =>
    new Date(s).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between border-b border-gray-200 pb-5 mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Mis invitaciones</h1>
            <p className="text-sm text-gray-500 mt-1">
              {items.length} invitación{items.length !== 1 ? 'es' : ''}
            </p>
          </div>
          <button
            onClick={createNew}
            disabled={creating}
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {creating ? 'Creando…' : '＋ Nueva invitación'}
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-md p-10 text-center text-gray-500">
            Aún no tienes invitaciones. Crea la primera.
          </div>
        ) : (
          <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
            {items.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{inv.title}</span>
                    <span
                      className={`text-[11px] uppercase tracking-wide px-2 py-0.5 rounded ${
                        inv.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {inv.status === 'published' ? 'Publicada' : 'Borrador'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {fmt(inv.createdAt)} · {inv.guests?.length || 0} confirmados
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm shrink-0">
                  <button
                    onClick={() => navigate(`/editor/${inv.id}`)}
                    className="px-3 py-1.5 rounded-md hover:bg-gray-100 text-gray-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => navigate(`/invitations/${inv.id}`)}
                    className="px-3 py-1.5 rounded-md hover:bg-gray-100 text-gray-700"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => copyLink(inv.id)}
                    className="px-3 py-1.5 rounded-md hover:bg-gray-100 text-gray-700"
                  >
                    Copiar link
                  </button>
                  <button
                    onClick={() => remove(inv.id)}
                    className="px-3 py-1.5 rounded-md hover:bg-red-50 text-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
