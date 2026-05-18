import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Guest {
  id: string;
  name: string;
  message?: string;
  confirmedAt: string;
}

function GuestsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch invitation info
        const invResponse = await axios.get(`/api/invitations/${id}`);
        setTitle(invResponse.data.title);

        // Fetch guests
        const guestsResponse = await axios.get(`/api/invitations/${id}/guests`);
        setGuests(guestsResponse.data);
      } catch (error: any) {
        setError('Error al cargar la información');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">
        Cargando invitados…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="border border-gray-200 rounded-md p-8 text-center max-w-md">
          <h1 className="text-xl font-semibold text-red-600 mb-4">{error}</h1>
          <button
            onClick={() => navigate('/admin')}
            className="bg-gray-900 text-white px-5 py-2 rounded-md hover:bg-gray-800 text-sm"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center border-b border-gray-200 pb-5 mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Invitados confirmados</h1>
            <p className="text-sm text-gray-500 mt-1">{title}</p>
          </div>
          <button
            onClick={() => navigate(`/invitations/${id}`)}
            className="text-sm text-gray-700 hover:text-gray-900"
          >
            ← Atrás
          </button>
        </div>

        {guests.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-md p-10 text-center text-gray-500">
            Aún no hay confirmaciones. Aparecerán aquí cuando los invitados confirmen.
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {guests.length} confirmado{guests.length !== 1 ? 's' : ''}
            </p>
            <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
              {guests.map((guest) => (
                <div key={guest.id} className="px-4 py-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h3 className="font-medium">{guest.name}</h3>
                      {guest.message && (
                        <p className="text-gray-600 italic text-sm mt-1">"{guest.message}"</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">
                      {formatTime(guest.confirmedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default GuestsPage;
