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
      await axios.post(`/api/invitations/${id}/guests`, {
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
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="border border-gray-200 rounded-md p-8 text-center max-w-md">
          <h1 className="text-xl font-semibold text-red-600 mb-4">{error}</h1>
          <button
            onClick={() => navigate('/admin')}
            className="bg-gray-900 text-white px-5 py-2 rounded-md hover:bg-gray-800 text-sm"
          >
            Ir a mis invitaciones
          </button>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">
        Cargando invitación…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {guestCount} confirmado{guestCount !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => navigate(`/invitations/${id}/guests`)}
            className="text-sm text-gray-700 hover:text-gray-900"
          >
            Ver invitados
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <iframe
          srcDoc={invitation.htmlContent}
          style={{ width: '100%', height: '620px', border: 'none' }}
          title="Invitación"
        />

        <div className="border border-gray-200 rounded-md p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Confirmar asistencia</h2>

          {confirmMessage && (
            <div
              className={`p-3 rounded-md mb-5 text-sm ${
                confirmMessage.includes('✅')
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {confirmMessage}
            </div>
          )}

          <form onSubmit={handleConfirm} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje (opcional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Comparte tu mensaje…"
                rows={3}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-900 disabled:bg-gray-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white font-medium py-2.5 rounded-md hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Confirmando…' : 'Confirmar y enviar por WhatsApp'}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Al confirmar, se abrirá WhatsApp para notificar al organizador
          </p>
        </div>
      </div>
    </div>
  );
}

export default InvitationLanding;
