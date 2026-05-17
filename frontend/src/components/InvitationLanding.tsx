import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Guest {
  id: string;
  name: string;
  message?: string;
  confirmedAt: string;
}

interface Invitation {
  id: string;
  title: string;
  htmlContent: string;
  status: string;
  expiresAt?: string;
  guests: Guest[];
}

function InvitationLanding() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState('');
  const [guestCount, setGuestCount] = useState(0);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await axios.get(`/api/invitations/${id}`);
        setInvitation(response.data);
        setGuestCount(response.data.guests?.length || 0);
      } catch (error: any) {
        if (error.response?.status === 410) {
          setError('Esta invitación ha expirado');
        } else if (error.response?.status === 404) {
          setError('Invitación no encontrada');
        } else {
          setError('Error al cargar la invitación');
        }
      }
    };

    if (id) {
      fetchInvitation();
    }
  }, [id]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setConfirmMessage('Por favor ingresa tu nombre');
      return;
    }

    setLoading(true);
    setConfirmMessage('');

    try {
      const response = await axios.post(`/api/invitations/${id}/guests`, {
        name,
        message: message || null
      });

      // Generate WhatsApp message
      const whatsappMessage = `Hola! Confirmo mi asistencia a ${invitation?.title}\n${message ? `Mensaje: ${message}\n` : ''}De: ${name}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

      // Update guest count
      setGuestCount(prev => prev + 1);

      setConfirmMessage('✅ ¡Confirmado! Abriendo WhatsApp...');
      setName('');
      setMessage('');

      // Open WhatsApp
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 500);

    } catch (error: any) {
      setConfirmMessage(error.response?.data?.error || 'Error al confirmar asistencia');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ {error}</h1>
          <button
            onClick={() => navigate('/editor')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Crear Nueva Invitación
          </button>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando invitación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con contador */}
      <div className="sticky top-0 bg-white shadow-sm border-b border-gray-200 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h2 className="text-gray-700 font-semibold">
            👥 {guestCount} confirmado{guestCount !== 1 ? 's' : ''}
          </h2>
          <div className="space-x-2">
            <button
              onClick={() => navigate(`/invitations/${id}/guests`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
            >
              Ver Invitados
            </button>
            <button
              onClick={() => navigate('/editor')}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition text-sm"
            >
              Atrás
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Invitation Preview */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center">
            <h1 className="text-4xl font-bold mb-2">✨ {invitation.title}</h1>
            <p className="text-blue-100">Tienes una invitación especial</p>
          </div>

          <div className="p-8">
            {/* HTML Content Display */}
            <div className="mb-8 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <iframe
                srcDoc={invitation.htmlContent}
                style={{
                  width: '100%',
                  height: '600px',
                  border: 'none',
                  borderRadius: '8px'
                }}
                title="Invitation Preview"
              />
            </div>

            {/* Confirmation Form */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg border border-blue-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">✓ Confirmar Asistencia</h2>
              
              {confirmMessage && (
                <div className={`p-4 rounded-lg mb-6 ${confirmMessage.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {confirmMessage}
                </div>
              )}

              <form onSubmit={handleConfirm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje (opcional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Comparte tu mensaje de felicidades..."
                    rows={3}
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⏳ Confirmando...' : '📱 Confirmar y Enviar por WhatsApp'}
                </button>
              </form>

              <p className="text-xs text-gray-600 mt-4 text-center">
                Al confirmar, se abrirá WhatsApp para notificar al organizador
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvitationLanding;
