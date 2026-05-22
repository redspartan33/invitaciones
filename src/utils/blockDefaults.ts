import { v4 as uuid } from 'uuid'
import type {
  BlockDataMap,
  BlockType,
  BlockTypeInfo,
  InvitationBlock,
  Invitation,
} from '../types/invitation.types'

export const BLOCK_CATALOG: BlockTypeInfo[] = [
  { type: 'hero', label: 'Portada', description: 'Título principal del evento', icon: '✦' },
  { type: 'event-details', label: 'Detalles del evento', description: 'Fecha, hora y ubicación', icon: '◷' },
  { type: 'timeline', label: 'Itinerario', description: 'Cronograma de actividades', icon: '☷' },
  { type: 'dress-code', label: 'Código de vestimenta', description: 'Dress code y referencias', icon: '⬢' },
  { type: 'gift-registry', label: 'Mesa de regalos', description: 'Tiendas y links', icon: '✿' },
  { type: 'rsvp-info', label: 'RSVP', description: 'Confirmación de asistencia', icon: '✉' },
  { type: 'gallery', label: 'Galería', description: 'Galería de fotos', icon: '▦' },
  { type: 'footer', label: 'Pie / Contacto', description: 'Mensaje final y contacto', icon: '⌂' },
]

export function defaultBlockData<T extends BlockType>(type: T): BlockDataMap[T] {
  const map: { [K in BlockType]: BlockDataMap[K] } = {
    hero: {
      title: 'Ana & Juan',
      subtitle: 'Tenemos el honor de invitarte',
      alignment: 'center',
      dateFormat: 'DD MMMM YYYY',
      eventDate: '2026-06-15',
      backgroundColor: '#fafafa',
      showDate: true,
      showTitle: true,
      showSubtitle: true,
    },
    'event-details': {
      date: '2026-06-15',
      time: '18:00',
      location: 'Jardín Botánico',
      address: 'Ciudad de México',
      description: 'Ceremonia seguida de recepción y cena.',
      icon: 'wedding',
    },
    timeline: {
      title: 'Itinerario',
      items: [
        { id: uuid(), time: '17:30', title: 'Recepción', icon: 'cocktail' },
        { id: uuid(), time: '18:00', title: 'Ceremonia', icon: 'ceremony' },
        { id: uuid(), time: '19:30', title: 'Cena', icon: 'dinner' },
        { id: uuid(), time: '21:00', title: 'Baile', icon: 'dance' },
      ],
    },
    'dress-code': {
      code: 'Formal',
      notes: 'Se recomienda evitar el color blanco.',
    },
    'gift-registry': {
      title: 'Mesa de regalos',
      message: 'Tu presencia es nuestro mejor regalo. Si deseas obsequiarnos algo más:',
      items: [
        { id: uuid(), storeName: 'Liverpool', link: 'https://www.liverpool.com.mx', description: 'Evento #00000' },
        { id: uuid(), storeName: 'Amazon', link: 'https://www.amazon.com', description: 'Lista de novios' },
      ],
    },
    'rsvp-info': {
      instructions: 'Por favor confirma tu asistencia antes de la fecha límite.',
      deadline: '2026-05-30',
      contactEmail: 'rsvp@example.com',
    },
    gallery: {
      title: 'Nuestros momentos',
      columns: 3,
      images: [
        { id: uuid(), url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600' },
        { id: uuid(), url: 'https://images.unsplash.com/photo-1525772764200-be829a350797?w=600' },
        { id: uuid(), url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600' },
      ],
    },
    footer: {
      message: 'Gracias por ser parte de este momento especial.',
      phone: '',
      email: '',
      instagram: '',
      whatsapp: '',
    },
  }
  return map[type]
}

export function createBlock<T extends BlockType>(type: T, order: number): InvitationBlock {
  const now = new Date().toISOString()
  return {
    id: uuid(),
    type,
    data: defaultBlockData(type),
    order,
    visible: true,
    style: { paddingY: 'lg' },
    metadata: { createdAt: now, lastEdited: now },
  } as InvitationBlock
}

export function createExampleInvitation(): Invitation {
  const now = new Date().toISOString()
  const types: BlockType[] = ['hero', 'event-details', 'timeline', 'dress-code', 'gift-registry', 'rsvp-info', 'gallery', 'footer']
  return {
    id: uuid(),
    title: 'Boda de Ana y Juan',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    blocks: types.map((t, i) => createBlock(t, i)),
    globalSettings: {
      colorPrimary: '#18181b',
      colorSecondary: '#f4f4f5',
      colorAccent: '#b08968',
      fontFamily: 'serif',
    },
  }
}
