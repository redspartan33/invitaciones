import type { BlockType } from '../types/invitation.types'

export interface BlockFormFieldBase {
  name: string
  label: string
  helper?: string
}

export type BlockFormField =
  | (BlockFormFieldBase & { kind: 'text' | 'textarea' | 'date' | 'time' | 'email' | 'url' | 'image' | 'color' })
  | (BlockFormFieldBase & { kind: 'select'; options: { value: string; label: string }[] })
  | (BlockFormFieldBase & { kind: 'toggle' })

export interface BlockFormSchema {
  sections: { title: string; fields: BlockFormField[] }[]
}

export const blockFormSchemas: Record<BlockType, BlockFormSchema> = {
  hero: {
    sections: [
      {
        title: 'Contenido',
        fields: [
          { name: 'title', label: 'Título', kind: 'text' },
          { name: 'subtitle', label: 'Subtítulo', kind: 'text' },
          { name: 'eventDate', label: 'Fecha del evento', kind: 'date' },
        ],
      },
      {
        title: 'Apariencia',
        fields: [
          {
            name: 'alignment',
            label: 'Alineación',
            kind: 'select',
            options: [
              { value: 'left', label: 'Izquierda' },
              { value: 'center', label: 'Centro' },
              { value: 'right', label: 'Derecha' },
            ],
          },
          {
            name: 'dateFormat',
            label: 'Formato de fecha',
            kind: 'select',
            options: [
              { value: 'DD/MM/YYYY', label: '15/06/2026' },
              { value: 'DD MMMM YYYY', label: '15 de junio de 2026' },
              { value: 'MMMM DD, YYYY', label: 'Junio 15, 2026' },
            ],
          },
          { name: 'backgroundImage', label: 'Imagen de fondo (URL)', kind: 'image' },
          { name: 'backgroundColor', label: 'Color de fondo', kind: 'color' },
        ],
      },
      {
        title: 'Visibilidad',
        fields: [
          { name: 'showTitle', label: 'Mostrar título', kind: 'toggle' },
          { name: 'showSubtitle', label: 'Mostrar subtítulo', kind: 'toggle' },
          { name: 'showDate', label: 'Mostrar fecha', kind: 'toggle' },
        ],
      },
    ],
  },
  'event-details': {
    sections: [
      {
        title: 'Cuándo y dónde',
        fields: [
          { name: 'date', label: 'Fecha', kind: 'date' },
          { name: 'time', label: 'Hora', kind: 'time' },
          { name: 'location', label: 'Lugar', kind: 'text' },
          { name: 'address', label: 'Dirección', kind: 'text' },
        ],
      },
      {
        title: 'Detalles',
        fields: [
          { name: 'description', label: 'Descripción', kind: 'textarea' },
          {
            name: 'icon',
            label: 'Tipo de evento',
            kind: 'select',
            options: [
              { value: 'wedding', label: 'Boda' },
              { value: 'birthday', label: 'Cumpleaños' },
              { value: 'corporate', label: 'Corporativo' },
              { value: 'baby', label: 'Baby shower' },
              { value: 'graduation', label: 'Graduación' },
              { value: 'generic', label: 'Otro' },
            ],
          },
        ],
      },
    ],
  },
  timeline: {
    sections: [
      {
        title: 'Encabezado',
        fields: [
          { name: 'title', label: 'Título de la sección', kind: 'text' },
          {
            name: 'alignment',
            label: 'Alineación',
            kind: 'select',
            options: [
              { value: 'left', label: 'Izquierda (con línea)' },
              { value: 'center', label: 'Centro' },
              { value: 'right', label: 'Derecha' },
            ],
          },
        ],
      },
    ],
  },
  'dress-code': {
    sections: [
      {
        title: 'Código de vestimenta',
        fields: [
          { name: 'code', label: 'Código', kind: 'text', helper: 'Ej. Formal, Black tie, Casual elegante' },
          { name: 'notes', label: 'Observaciones', kind: 'textarea' },
          { name: 'inspirationImage', label: 'Imagen de inspiración (URL)', kind: 'image' },
          { name: 'referenceLink', label: 'Link de referencia', kind: 'url' },
        ],
      },
    ],
  },
  'gift-registry': {
    sections: [
      {
        title: 'Encabezado',
        fields: [
          { name: 'title', label: 'Título', kind: 'text' },
          { name: 'message', label: 'Mensaje', kind: 'textarea' },
        ],
      },
    ],
  },
  'rsvp-info': {
    sections: [
      {
        title: 'Confirmación',
        fields: [
          { name: 'instructions', label: 'Instrucciones', kind: 'textarea' },
          { name: 'deadline', label: 'Fecha límite', kind: 'date' },
          { name: 'rsvpLink', label: 'Link de confirmación (fallback)', kind: 'url', helper: 'Se usa solo si no defines un WhatsApp abajo.' },
          { name: 'contactEmail', label: 'Email de contacto', kind: 'email' },
          { name: 'contactPhone', label: 'Teléfono de contacto', kind: 'text' },
          { name: 'accessCode', label: 'Código de acceso (opcional)', kind: 'text' },
        ],
      },
      {
        title: 'WhatsApp (wa.me)',
        fields: [
          {
            name: 'whatsappPhone',
            label: 'Teléfono con código país',
            kind: 'text',
            helper: 'Solo dígitos, ej. 525512345678 (México). Si lo defines, el botón abre WhatsApp.',
          },
          {
            name: 'whatsappMessage',
            label: 'Mensaje predeterminado',
            kind: 'textarea',
            helper: 'Lo verá el invitado al abrir el chat (puede editarlo antes de enviar).',
          },
          { name: 'whatsappButtonLabel', label: 'Texto del botón', kind: 'text', helper: 'Default: “Confirmar asistencia”.' },
        ],
      },
    ],
  },
  footer: {
    sections: [
      {
        title: 'Pie',
        fields: [
          { name: 'message', label: 'Mensaje', kind: 'textarea' },
          { name: 'phone', label: 'Teléfono', kind: 'text' },
          { name: 'email', label: 'Email', kind: 'email' },
          { name: 'instagram', label: 'Instagram', kind: 'text' },
          { name: 'whatsapp', label: 'WhatsApp', kind: 'text' },
        ],
      },
    ],
  },
  gallery: {
    sections: [
      {
        title: 'Galería',
        fields: [
          { name: 'title', label: 'Título', kind: 'text' },
          {
            name: 'columns',
            label: 'Columnas',
            kind: 'select',
            options: [
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
            ],
          },
        ],
      },
    ],
  },
  map: {
    sections: [
      {
        title: 'Mapa',
        fields: [
          { name: 'title', label: 'Título (opcional)', kind: 'text' },
          { name: 'address', label: 'Dirección o lugar', kind: 'text', helper: 'Ej. “Jardín Botánico, Ciudad de México”.' },
          { name: 'openLinkLabel', label: 'Texto del link a Google Maps', kind: 'text' },
          {
            name: 'embedUrl',
            label: 'URL embed personalizado (opcional)',
            kind: 'url',
            helper: 'Si pegas un iframe src de Google Maps lo usaremos en vez de generar uno.',
          },
        ],
      },
    ],
  },
  'menu-header': {
    sections: [
      {
        title: 'Identidad',
        fields: [
          { name: 'title', label: 'Nombre del restaurante', kind: 'text' },
          { name: 'tagline', label: 'Subtítulo / tagline', kind: 'text' },
          { name: 'logo', label: 'Logo (URL)', kind: 'image' },
          { name: 'backgroundImage', label: 'Imagen de fondo (URL)', kind: 'image' },
          { name: 'backgroundColor', label: 'Color de fondo', kind: 'color' },
        ],
      },
      {
        title: 'Barra sticky',
        fields: [
          { name: 'navBackgroundColor', label: 'Color de fondo de la barra', kind: 'color' },
          { name: 'navTextColor', label: 'Color del texto', kind: 'color' },
          {
            name: 'navSize',
            label: 'Tamaño de la barra',
            kind: 'select',
            options: [
              { value: 's', label: 'S' },
              { value: 'm', label: 'M' },
              { value: 'xl', label: 'XL' },
            ],
          },
          {
            name: 'logoSize',
            label: 'Tamaño del logo',
            kind: 'select',
            options: [
              { value: 's', label: 'S' },
              { value: 'm', label: 'M' },
              { value: 'l', label: 'L' },
              { value: 'xl', label: 'XL' },
            ],
          },
          { name: 'stickyHeader', label: 'Sticky: todo el header', kind: 'toggle' },
          { name: 'stickyNavOnly', label: 'Sticky: solo barra de navegación', kind: 'toggle' },
        ],
      },
      {
        title: 'Visibilidad',
        fields: [
          { name: 'showLogo', label: 'Mostrar logo', kind: 'toggle' },
          { name: 'showTitle', label: 'Mostrar nombre', kind: 'toggle' },
          { name: 'showTagline', label: 'Mostrar subtítulo', kind: 'toggle' },
        ],
      },
    ],
  },
  'menu-section': {
    sections: [
      {
        title: 'Sección',
        fields: [
          { name: 'title', label: 'Título de la sección', kind: 'text', helper: 'Aparece en la barra sticky' },
          { name: 'description', label: 'Descripción (opcional)', kind: 'textarea' },
        ],
      },
    ],
  },
  'menu-note': {
    sections: [
      {
        title: 'Nota',
        fields: [
          { name: 'text', label: 'Texto', kind: 'textarea' },
          {
            name: 'alignment',
            label: 'Alineación',
            kind: 'select',
            options: [
              { value: 'left', label: 'Izquierda' },
              { value: 'center', label: 'Centro' },
              { value: 'right', label: 'Derecha' },
            ],
          },
        ],
      },
    ],
  },
  'menu-footer': {
    sections: [
      {
        title: 'Contacto',
        fields: [
          { name: 'address', label: 'Dirección', kind: 'text' },
          { name: 'phone', label: 'Teléfono', kind: 'text' },
          { name: 'hours', label: 'Horarios', kind: 'text' },
          { name: 'website', label: 'Sitio web', kind: 'url' },
          { name: 'instagram', label: 'Instagram', kind: 'text' },
          { name: 'whatsapp', label: 'WhatsApp', kind: 'text' },
        ],
      },
    ],
  },
}

export function useBlockForm(type: BlockType): BlockFormSchema {
  return blockFormSchemas[type]
}
