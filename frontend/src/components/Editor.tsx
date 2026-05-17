import { useState } from 'react';
import axios from 'axios';

interface InvitationData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  message: string;
}

function Editor() {
  const [formData, setFormData] = useState<InvitationData>({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [invitationId, setInvitationId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateHtmlContent = (data: InvitationData): string => {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
          .container { background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 600px; width: 100%; padding: 40px; overflow: hidden; }
          .header { text-align: center; margin-bottom: 30px; }
          h1 { font-size: 2.5em; color: #667eea; margin-bottom: 10px; }
          .subtitle { color: #666; font-size: 1.1em; margin-bottom: 30px; }
          .details { background: #f8f9ff; padding: 20px; border-radius: 10px; margin: 30px 0; }
          .detail-row { display: flex; align-items: center; margin: 15px 0; font-size: 1.05em; }
          .detail-row strong { color: #667eea; margin-right: 10px; min-width: 80px; }
          .message-box { background: #f0f4ff; padding: 20px; border-left: 4px solid #667eea; border-radius: 5px; margin: 30px 0; color: #333; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ ${data.title}</h1>
            <p class="subtitle">${data.description}</p>
          </div>
          
          <div class="details">
            <div class="detail-row">
              <strong>📅 Fecha:</strong>
              <span>${data.date}</span>
            </div>
            <div class="detail-row">
              <strong>🕐 Hora:</strong>
              <span>${data.time}</span>
            </div>
            <div class="detail-row">
              <strong>📍 Lugar:</strong>
              <span>${data.location}</span>
            </div>
          </div>
          
          ${data.message ? `<div class="message-box">${data.message}</div>` : ''}
        </div>
      </body>
      </html>
    `;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const htmlContent = generateHtmlContent(formData);
      
      const response = await axios.post('/api/invitations', {
        title: formData.title,
        htmlContent: htmlContent,
        config: {
          description: formData.description,
          date: formData.date,
          time: formData.time,
          location: formData.location
        }
      });

      setInvitationId(response.data.id);
      setMessage(`✅ Invitación creada! ID: ${response.data.id}`);
      setFormData({ title: '', description: '', date: '', time: '', location: '', message: '' });
    } catch (error) {
      setMessage('❌ Error al crear la invitación');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🎉 Crea tu Invitación Digital
          </h1>
          <p className="text-gray-600 mb-8">
            Llena los datos básicos y genera tu invitación hermosa al instante
          </p>

          {message && (
            <div className={`p-4 rounded-lg mb-6 ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
              {invitationId && (
                <div className="mt-3">
                  <a 
                    href={`/invitations/${invitationId}`}
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition mr-2"
                  >
                    Ver Invitación
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/invitations/${invitationId}`);
                      alert('Link copiado al portapapeles!');
                    }}
                    className="inline-block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                  >
                    Copiar Link
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título de la Invitación *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ej: Cumpleaños de María"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Ej: 25 años celebrando momentos felices"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora *
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lugar *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ej: Jardín del Centro, Veracruz"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje Adicional (opcional)
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Agrega un mensaje especial para los invitados..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : '✨ Crear Invitación'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-2">💡 Próximos pasos:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ En FASE 2 podrás subir fotos y videos</li>
              <li>✓ Personalizar fondos y colores en el editor visual</li>
              <li>✓ Agregar animaciones y audio de fondo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Editor;
