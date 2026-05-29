import { v4 as uuid } from 'uuid'
import type {
  BlockDataMap,
  BlockType,
  BlockTypeInfo,
  CanvasAspect,
  ElementLayout,
  InvitationBlock,
  Invitation,
  InvitationKind,
  LayoutMode,
} from '../types/invitation.types'

// Free-form elements shown first in the palette — they are the building
// blocks of the new free-canvas editor.
export const ELEMENT_BLOCK_CATALOG: BlockTypeInfo[] = [
  { type: 'text', label: 'Texto', description: 'Caja de texto libre', icon: 'T' },
  { type: 'image', label: 'Imagen / sticker', description: 'Foto, ilustración o PNG', icon: '▣' },
  { type: 'shape', label: 'Forma / línea', description: 'Rectángulo, círculo o línea', icon: '◆' },
]

export const INVITATION_BLOCK_CATALOG: BlockTypeInfo[] = [
  ...ELEMENT_BLOCK_CATALOG,
  { type: 'hero', label: 'Portada', description: 'Título principal del evento', icon: '✦' },
  { type: 'event-details', label: 'Detalles del evento', description: 'Fecha, hora y ubicación', icon: '◷' },
  { type: 'timeline', label: 'Itinerario', description: 'Cronograma de actividades', icon: '☷' },
  { type: 'dress-code', label: 'Código de vestimenta', description: 'Dress code y referencias', icon: '⬢' },
  { type: 'gift-registry', label: 'Mesa de regalos', description: 'Tiendas y links', icon: '✿' },
  { type: 'rsvp-info', label: 'RSVP', description: 'Confirmación de asistencia', icon: '✉' },
  { type: 'gallery', label: 'Galería', description: 'Galería de fotos', icon: '▦' },
  { type: 'image-set', label: 'Set de imágenes', description: '1, 2 o 3 imágenes en columnas', icon: '◫' },
  { type: 'map', label: 'Mapa', description: 'Ubicación con mapa interactivo', icon: '◉' },
  { type: 'footer', label: 'Pie / Contacto', description: 'Mensaje final y contacto', icon: '⌂' },
]

export const MENU_BLOCK_CATALOG: BlockTypeInfo[] = [
  { type: 'menu-header', label: 'Header del menú', description: 'Logo, nombre y barra sticky de navegación', icon: '☰' },
  { type: 'menu-section', label: 'Sección del menú', description: 'Lista de platillos (entradas, postres, etc.)', icon: '◧' },
  { type: 'menu-note', label: 'Nota / texto', description: 'Aviso o descripción libre', icon: '✎' },
  { type: 'menu-footer', label: 'Pie del menú', description: 'Dirección, horarios, contacto', icon: '⌂' },
]

// Backwards compatibility: existing imports of BLOCK_CATALOG still work.
export const BLOCK_CATALOG: BlockTypeInfo[] = INVITATION_BLOCK_CATALOG

export function blockCatalogFor(kind: InvitationKind): BlockTypeInfo[] {
  return kind === 'menu' ? MENU_BLOCK_CATALOG : INVITATION_BLOCK_CATALOG
}

export function defaultBlockData<T extends BlockType>(type: T): BlockDataMap[T] {
  const map: { [K in BlockType]: BlockDataMap[K] } = {
    hero: {
      title: 'Ana & Juan',
      subtitle: 'Tenemos el honor de invitarte',
      alignment: 'center',
      dateFormat: 'DD MMMM YYYY',
      eventDate: '2026-06-15',
      backgroundColor: '',
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
      showDate: true,
      showTime: true,
      timeFormat: '24h',
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
    'image-set': {
      title: '',
      aspect: 'square',
      images: [
        { id: uuid(), url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600' },
        { id: uuid(), url: 'https://images.unsplash.com/photo-1525772764200-be829a350797?w=600' },
      ],
    },
    map: {
      title: 'Ubicación',
      address: 'Jardín Botánico, Ciudad de México',
      height: 320,
      openLinkLabel: 'Abrir en Google Maps',
    },
    text: {
      text: 'Texto',
      align: 'center',
      fontFamily: 'inherit',
      color: '#18181b',
      fontSize: 48,
      bold: false,
      italic: false,
      lineHeight: 1.25,
    },
    image: {
      url: '',
      alt: '',
      fit: 'cover',
      radius: 0,
      opacity: 100,
    },
    shape: {
      shape: 'rectangle',
      fill: '#b08968',
      stroke: '',
      strokeWidth: 0,
      radius: 0,
      opacity: 100,
    },
    footer: {
      message: 'Gracias por ser parte de este momento especial.',
      phone: '',
      email: '',
      instagram: '',
      whatsapp: '',
    },
    'menu-header': {
      title: 'Mi Restaurante',
      tagline: 'Carta',
      logo: '',
      navBackgroundColor: '#111827',
      navTextColor: '#f8fafc',
      stickyHeader: false,
      stickyNavOnly: true,
      showLogo: true,
      showTitle: true,
      showTagline: true,
    },
    'menu-section': {
      title: 'Entradas',
      description: '',
      items: [
        { id: uuid(), name: 'Carpaccio de res', description: 'Arúgula, parmesano, aceite de trufa', price: '$240' },
        { id: uuid(), name: 'Burrata', description: 'Tomate cherry, albahaca, balsámico', price: '$220' },
      ],
    },
    'menu-note': {
      text: 'Servicio no incluido. Consulta por opciones sin gluten.',
      alignment: 'center',
    },
    'menu-footer': {
      address: '',
      phone: '',
      hours: '',
      instagram: '',
      whatsapp: '',
      website: '',
    },
  }
  return map[type]
}

/** Element types that have no in-flow padding/background — they are bare
 *  free-form elements. */
const ELEMENT_TYPES: BlockType[] = ['text', 'image', 'shape']

export function isElementType(type: BlockType): boolean {
  return ELEMENT_TYPES.includes(type)
}

/** A sensible starting box (centered, percentages of the canvas) for a newly
 *  dropped element on a fixed canvas. */
export function defaultLayoutFor(type: BlockType, zIndex = 1): ElementLayout {
  if (type === 'text') return { xPct: 15, yPct: 44, wPct: 70, hPct: 12, rotation: 0, zIndex }
  if (type === 'image') return { xPct: 25, yPct: 25, wPct: 50, hPct: 35, rotation: 0, zIndex }
  if (type === 'shape') return { xPct: 30, yPct: 40, wPct: 40, hPct: 20, rotation: 0, zIndex }
  // Rich blocks placed on a canvas get a wide, tall-ish default box.
  return { xPct: 8, yPct: 20, wPct: 84, hPct: 40, rotation: 0, zIndex }
}

export function createBlock<T extends BlockType>(
  type: T,
  order: number,
  opts?: { layout?: ElementLayout },
): InvitationBlock {
  const now = new Date().toISOString()
  const style = type === 'menu-header'
    ? { paddingY: 'lg' as const, backgroundColor: '#1f2937' }
    : isElementType(type)
      ? undefined
      : { paddingY: 'lg' as const }
  return {
    id: uuid(),
    type,
    data: defaultBlockData(type),
    order,
    visible: true,
    style,
    layout: opts?.layout,
    metadata: { createdAt: now, lastEdited: now },
  } as InvitationBlock
}

export interface CreateInvitationOptions {
  mode?: LayoutMode
  aspect?: CanvasAspect
}

export function createExampleInvitation(opts?: CreateInvitationOptions): Invitation {
  const now = new Date().toISOString()
  const globalSettings = {
    colorPrimary: '#18181b',
    colorSecondary: '#f4f4f5',
    colorAccent: '#b08968',
    fontFamily: 'serif' as const,
  }

  if (opts?.mode === 'fixed-canvas') {
    const aspect: CanvasAspect = opts.aspect ?? '4:5'
    const title = createBlock('text', 0, { layout: { xPct: 10, yPct: 30, wPct: 80, hPct: 14, rotation: 0, zIndex: 2 } }) as InvitationBlock<'text'>
    title.data = { text: 'Ana & Juan', align: 'center', fontFamily: 'inherit', color: '#18181b', fontSize: 84, bold: false, italic: false, lineHeight: 1.1 }
    const subtitle = createBlock('text', 1, { layout: { xPct: 15, yPct: 48, wPct: 70, hPct: 8, rotation: 0, zIndex: 2 } }) as InvitationBlock<'text'>
    subtitle.data = { text: 'Nos casamos · 15 de junio de 2026', align: 'center', fontFamily: 'inherit', color: '#52525b', fontSize: 32, bold: false, italic: false, lineHeight: 1.3 }
    const divider = createBlock('shape', 2, { layout: { xPct: 42, yPct: 44, wPct: 16, hPct: 0.6, rotation: 0, zIndex: 1 } }) as InvitationBlock<'shape'>
    divider.data = { shape: 'line', fill: '#b08968', stroke: '#b08968', strokeWidth: 2, radius: 0, opacity: 100 }
    return {
      id: uuid(),
      kind: 'invitation',
      title: 'Invitación de lienzo libre',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      layoutMode: 'fixed-canvas',
      canvasAspect: aspect,
      blocks: [title, subtitle, divider],
      globalSettings,
    }
  }

  const types: BlockType[] = ['hero', 'event-details', 'timeline', 'dress-code', 'gift-registry', 'rsvp-info', 'gallery', 'footer']
  return {
    id: uuid(),
    kind: 'invitation',
    title: 'Boda de Ana y Juan',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    layoutMode: 'stacked',
    blocks: types.map((t, i) => createBlock(t, i)),
    globalSettings,
  }
}

export function createExampleMenu(): Invitation {
  const now = new Date().toISOString()

  const header = createBlock('menu-header', 0) as InvitationBlock<'menu-header'>
  header.data = {
    title: 'Mi Restaurante',
    tagline: 'Carta',
    logo: '',
    navBackgroundColor: '#111827',
    navTextColor: '#f8fafc',
    stickyHeader: false,
    stickyNavOnly: true,
    showLogo: true,
    showTitle: true,
    showTagline: true,
  }
  header.style = { ...header.style, backgroundColor: '#1f2937' }

  const section: InvitationBlock<'menu-section'> = {
    ...(createBlock('menu-section', 1) as InvitationBlock<'menu-section'>),
    data: {
      title: 'Entradas',
      description: '',
      items: [
        { id: uuid(), name: 'Platillo de ejemplo', description: 'Descripción breve del platillo.', price: '$120' },
        { id: uuid(), name: 'Otro platillo', description: 'Otra descripción.', price: '$150' },
      ],
    },
  }

  const footer = createBlock('menu-footer', 2) as InvitationBlock<'menu-footer'>
  footer.data = {
    address: '',
    phone: '',
    hours: '',
    instagram: '',
    whatsapp: '',
    website: '',
  }

  return {
    id: uuid(),
    kind: 'menu',
    title: 'Nuevo menú',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    blocks: [header, section, footer],
    globalSettings: {
      colorPrimary: '#1f2937',
      colorSecondary: '#ffffff',
      colorAccent: '#111827',
      fontFamily: 'serif',
    },
  }
}
