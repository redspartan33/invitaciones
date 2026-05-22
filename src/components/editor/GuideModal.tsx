export function GuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded border border-ink-200 bg-white p-6 anim-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Cómo usar el editor</h2>
          <button onClick={onClose} className="btn-ghost">Cerrar</button>
        </div>
        <ol className="space-y-3 text-sm text-ink-700">
          <li><b>1.</b> Haz clic en cualquier bloque del lienzo para editarlo en el panel derecho.</li>
          <li><b>2.</b> Usa <b>+ Añadir bloque</b> para insertar nuevas secciones (portada, itinerario, RSVP, etc.).</li>
          <li><b>3.</b> Arrastra los bloques desde el ícono <code>⋮⋮</code> para reordenarlos.</li>
          <li><b>4.</b> Configura colores, fuentes y música desde la barra inferior.</li>
          <li><b>5.</b> Tu trabajo se guarda automáticamente en este navegador.</li>
          <li><b>6.</b> Pulsa <b>Compartir</b> para obtener un link de la invitación.</li>
        </ol>
        <div className="mt-5 rounded border border-ink-200 bg-ink-50 p-3 text-xs text-ink-600">
          Tip: cambia el viewport (móvil / tablet / escritorio) para ver cómo se verá tu invitación en distintos dispositivos.
        </div>
      </div>
    </div>
  )
}
