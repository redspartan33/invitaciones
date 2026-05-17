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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando invitados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ {error}</h1>
          <button
            onClick={() => navigate('/editor')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-800">👥 Invitados Confirmados</h1>
            <button
              onClick={() => navigate(`/invitations/${id}`)}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition text-sm"
            >
              ← Atrás
            </button>
          </div>
          <p className="text-gray-600">{title}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-12 px-4">
        {guests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 text-lg">
              Aún no hay confirmaciones. 👀
            </p>
            <p className="text-gray-500 mt-2">
              Los invitados aparecerán aquí cuando confirmen asistencia
            </p>
            <button
              onClick={() => navigate(`/invitations/${id}`)}
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Volver a la Invitación
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Card */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-2">
                {guests.length} Confirmado{guests.length !== 1 ? 's' : ''}
              </h2>
              <p className="text-blue-100">
                Últimas confirmaciones
              </p>
            </div>

            {/* Guests List */}
            <div className="grid gap-4">
              {guests.map((guest) => (
                <div
                  key={guest.id}
                  className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-1">
                        ✓ {guest.name}
                      </h3>
                      {guest.message && (
                        <p className="text-gray-600 italic mb-2">
                          "{guest.message}"
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Confirmó el: {formatTime(guest.confirmedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        Confirmado
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Export Info */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 Tip: Esta página se actualiza en tiempo real. Comparte el link con los invitados para que confirmen.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GuestsPage;
