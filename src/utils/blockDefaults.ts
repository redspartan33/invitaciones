import { v4 as uuid } from 'uuid'
import type {
  BlockDataMap,
  BlockType,
  BlockTypeInfo,
  InvitationBlock,
  Invitation,
  InvitationKind,
} from '../types/invitation.types'

export const INVITATION_BLOCK_CATALOG: BlockTypeInfo[] = [
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
    footer: {
      message: 'Gracias por ser parte de este momento especial.',
      phone: '',
      email: '',
      instagram: '',
      whatsapp: '',
    },
    'menu-header': {
      title: 'Marullier',
      tagline: 'Experiencia gastronómica franco-mexicana',
      logo: '',
      backgroundImage: '',
      backgroundColor: '#111820',
      navBackgroundColor: '#1e293b',
      navTextColor: '#f8f7f2',
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
      address: 'Av. Reforma 123, CDMX',
      phone: '+52 55 1234 5678',
      hours: 'Lun–Dom · 13:00 a 23:00',
      instagram: '@marulier',
      whatsapp: '',
      website: '',
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
    kind: 'invitation',
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

export function createExampleMenu(): Invitation {
  const now = new Date().toISOString()
  const header = createBlock('menu-header', 0)

  const quiche: InvitationBlock<'menu-section'> = {
    ...(createBlock('menu-section', 1) as InvitationBlock<'menu-section'>),
    data: {
      title: 'Quiche',
      description: 'Recetas clásicas y vegetarianas para comenzar.',
      items: [
        { id: uuid(), name: 'Lorraine', description: 'Con tocino / with bacon.', price: '$133' },
        { id: uuid(), name: 'Homero', description: 'Tomate cherry, queso de cabra y arúgula', price: '$133' },
        { id: uuid(), name: 'Clásico', description: 'Tocino, champiñones y espinaca', price: '$133' },
        { id: uuid(), name: 'Vegetariano', description: 'Berenjena, calabaza y champiñón / Eggplant, zucchini and mushrooms.', price: '$133' },
        { id: uuid(), name: 'Tres quesos', description: 'Queso de cabra, azul, mozzarella', price: '$133' },
      ],
    },
  }

  const baguettes: InvitationBlock<'menu-section'> = {
    ...(createBlock('menu-section', 2) as InvitationBlock<'menu-section'>),
    data: {
      title: 'Baguette, Bagel, Croissant',
      description: 'Opciones saladas con ensalada o acompañantes ligeros.',
      items: [
        { id: uuid(), name: 'Con queso crema', description: 'Servido con nuestro queso crema', price: '$95' },
        { id: uuid(), name: 'Salmón Ahumado', description: 'Servido con nuestro queso crema con cebollín, salmón ahumado y ensalada ranch', price: '$240' },
        { id: uuid(), name: 'Clásico', description: 'Jamón de cerdo o pavo, queso suizo, acompañado de ensalada y ranch.', price: '$115' },
        { id: uuid(), name: 'Vegetariano', description: 'Queso de cabra, aceituna negra, pimiento, cebolla, calabacita rostizada y champiñones, acompañado de ensalada y ranch', price: '$115' },
        { id: uuid(), name: 'Mediterráneo', description: 'Jamón serrano acompañado de ensalada y ranch. Queso cabra +$30', price: '$150' },
        { id: uuid(), name: 'Gourmet', description: 'Pechuga de pollo, mayonesa de la casa, aceituna, espinacas y champiñones salteados, con ensalada y ranch', price: '$160' },
        { id: uuid(), name: 'Arrachera (120grs)', description: 'Cebolla asada, pimiento morrón, queso suizo, pepino y mayonesa de la casa con ensalada y ranch', price: '$220' },
      ],
    },
  }

  const ensaladas: InvitationBlock<'menu-section'> = {
    ...(createBlock('menu-section', 3) as InvitationBlock<'menu-section'>),
    data: {
      title: 'Ensaladas',
      description: 'Ensaladas frescas con ingredientes premium.',
      items: [
        { id: uuid(), name: 'Fresca', description: 'Arándano deshidratado, nuez de castilla, pepino, queso de cabra y fresas en lechuga italiana', price: '$200' },
        { id: uuid(), name: 'César', description: 'Pollo, crutones, parmesano y aderezo césar de la casa en lechuga italiana.', price: '$200' },
        { id: uuid(), name: 'Cítrica al curry', description: 'Mezcla de lechugas con arúgula y espinaca, manzana, supremas de naranja, queso mozzarella, pechuga de pavo, de miel y curry', price: '$200' },
        { id: uuid(), name: 'Ensalada Marulier', description: 'Mezcla de lechugas con arúgula y espinaca, jamón de pierna, aceituna negra, tomate, cherry, y queso monterrey', price: '$200' },
      ],
    },
  }

  const pizzas: InvitationBlock<'menu-section'> = {
    ...(createBlock('menu-section', 4) as InvitationBlock<'menu-section'>),
    data: {
      title: 'Pizzas',
      items: [
        { id: uuid(), name: 'Margarita', description: 'Albahaca deshidratada, tomate cherry', price: '$160' },
        { id: uuid(), name: 'De jamón', description: 'De pierna o pavo.', price: '$160' },
        { id: uuid(), name: 'Hawaiana', description: 'Piña y jamón', price: '$160' },
        { id: uuid(), name: 'Pepperoni', description: 'Queso y salsa de tomate', price: '$160' },
        { id: uuid(), name: 'Champiñones', description: 'Queso, champiñones y salsa de tomate', price: '$160' },
      ],
    },
  }

  const pizzasEspeciales: InvitationBlock<'menu-section'> = {
    ...(createBlock('menu-section', 5) as InvitationBlock<'menu-section'>),
    data: {
      title: 'Pizzas Especiales',
      items: [
        { id: uuid(), name: 'Marulier', description: 'Espinaca, champiñones, jitomate, jamón, y queso de cabra', price: '$200' },
        { id: uuid(), name: 'Serrana', description: 'Jamón serrano, arúgula', price: '$200' },
        { id: uuid(), name: 'Alambre', description: 'Mozzarella, pimientos, cebolla, chile jalapeño en vinagre, arrachera (120 grs.) y aguacate', price: '$270' },
      ],
    },
  }

  const desayunos: InvitationBlock<'menu-section'> = {
    ...(createBlock('menu-section', 6) as InvitationBlock<'menu-section'>),
    data: {
      title: 'Desayunos',
      description: 'Opciones todo el día con fruta al día en muchas preparaciones.',
      items: [
        { id: uuid(), name: 'Plato de fruta', description: 'Fruta mixta de temporada acompañado con yogurt y granola. Plato Grande $130', price: '$65' },
        { id: uuid(), name: 'Huevos al gusto', description: 'Omelette, revueltos o estrellados con dos ingredientes a elegir: champiñón, tocino, jamón, queso o espinaca, acompañado de papas y ensalada', price: '$160' },
        { id: uuid(), name: 'Omelette fresco', description: 'Emparedado (pan de caja artesanal) con pesto, mozzarella, jamón serrano y ensalada mixta.', price: '$170' },
        { id: uuid(), name: 'Omelette toast', description: 'Rebanada de pan de caja, mayonesa de la casa, omelette de pimientos, cebolla morada, con ensalada y papas al sartén', price: '$170' },
        { id: uuid(), name: 'Omelette de chilaquiles', description: 'Omelette relleno de chilaquiles a elegir: salsa roja, verde o divorciados servidos con queso, crema, cebolla, cilantro, acompañado de frijoles', price: '$175' },
      ],
    },
  }

  const especiales: InvitationBlock<'menu-section'> = {
    ...(createBlock('menu-section', 7) as InvitationBlock<'menu-section'>),
    data: {
      title: 'Especiales',
      description: 'Platillos fuertes y clásicos de casa.',
      items: [
        { id: uuid(), name: 'Muffin breakfast', description: 'Muffin Inglés con mantequilla y queso suizo, servido con espinaca, jamón y 1 huevo estrellado acompañado de ensalada', price: '$190' },
        { id: uuid(), name: 'Enfrijoladas', description: 'Rellenas de pollo o queso o huevo acompañadas de chorizo, aguacate, queso, crema, cilantro y cebolla morada', price: '$220' },
        { id: uuid(), name: 'Enchiladas', description: 'Verdes o Rojas, rellenas de pollo o queso o huevo acompañadas de queso, crema, cilantro, aguacate y cebolla morada', price: '$220' },
        { id: uuid(), name: 'Molletes clásicos', description: 'Pan chapata, cubierto de frijoles refritos, queso gratinado, acompañado de pico de gallo.', price: '$130' },
        { id: uuid(), name: 'Molletes de desayuno', description: 'Sobre Pan, frijoles, queso al gratín, pico de gallo y huevos estrellados puedes agregar tocino o chorizo.', price: '$180' },
      ],
    },
  }

  const toast: InvitationBlock<'menu-section'> = {
    ...(createBlock('menu-section', 8) as InvitationBlock<'menu-section'>),
    data: {
      title: 'Toast & Panadería',
      items: [
        { id: uuid(), name: 'Toast de aguacate', description: 'Media baguette tostada, untada con guacamole, tocino frito, 2 huevos estrellados, acompañados de pico de gallo.', price: '$180' },
        { id: uuid(), name: 'Hotcakes de la casa', description: '3 Pancakes servidos con frutos rojos, azúcar glass, acompañados de mantequilla y mermelada', price: '$150' },
        { id: uuid(), name: 'Desayuno francés', description: 'Baguette francesa tostada, pan brioche horneado acompañado de mantequilla y mermelada', price: '$100' },
        { id: uuid(), name: 'Pan francés', description: 'Rebanadas de pan brioche capeado con la receta de la casa, espolvoreado en una mezcla de azúcar con canela acompañado de frutos rojos y miel maple', price: '$150' },
        { id: uuid(), name: 'Croque croissant', description: 'Croissant gratinado, salsa bechamel, un toque de mostaza dijon, relleno con omelette natural y tocino, acompañado con ensalada', price: '$170' },
        { id: uuid(), name: 'Croque madame', description: 'Sandwich de jamón con queso, salsa bechamel, un toque de mostaza dijon, gratinado y 1 huevo frito. Acompañado con ensalada', price: '$170' },
      ],
    },
  }

  const sopas: InvitationBlock<'menu-section'> = {
    ...(createBlock('menu-section', 9) as InvitationBlock<'menu-section'>),
    data: {
      title: 'Sopas & Cremas',
      items: [
        { id: uuid(), name: 'Sopa de cebolla', description: 'La clásica a base de caldo de res con crouton gratinado', price: 'CH$70 / G$130' },
        { id: uuid(), name: 'Crema de champiñón', description: 'Con crutones', price: 'CH$70 / G$130' },
        { id: uuid(), name: 'Crema de elote', description: 'Crema de elote dulce', price: 'CH$70 / G$130' },
        { id: uuid(), name: 'Crema de poblano', description: 'Crema de chile poblano', price: 'CH$70 / G$130' },
      ],
    },
  }

  const sandwiches: InvitationBlock<'menu-section'> = {
    ...(createBlock('menu-section', 10) as InvitationBlock<'menu-section'>),
    data: {
      title: 'Sandwich Especial',
      items: [
        { id: uuid(), name: 'Club sandwich', description: 'Pechuga de pollo, tocino, jamón, queso suizo, aguacate, lechuga, jitomate y cebolla con mayonesa de la casa', price: '$240' },
        { id: uuid(), name: 'Croque monsieur', description: 'Sandwich de jamón y queso con bechamel y con un toque de dijon, gratinado. Con ensalada de betabel', price: '$170' },
        { id: uuid(), name: 'Roast beef sandwich', description: 'Pan de caja o baguette hecho en casa, tapenade, jamón de roast beef, jitomate rostizado, cebolla caramelizada, arúgula y papas a la francesa', price: '$240' },
        { id: uuid(), name: 'Arrachera al pesto sandwich', description: 'Base de pan rústico, arrachera, mayonesa de pesto, jitomate cherry y cebolla asada, queso suizo, guarnición de papas a la francesa', price: '$240' },
        { id: uuid(), name: 'Meat lover', description: 'Pan rústico, mayonesa de la casa, queso suizo, jamón de roast beef, tocino, pepperoni, jamón de cerdo, lechuga, jitomate, cebolla morada, aguacate y papas a la francesa', price: '$330' },
      ],
    },
  }

  const especialesCasa: InvitationBlock<'menu-section'> = {
    ...(createBlock('menu-section', 11) as InvitationBlock<'menu-section'>),
    data: {
      title: 'Especiales de la casa',
      items: [
        { id: uuid(), name: 'Fajitas de pollo', price: '$320' },
        { id: uuid(), name: 'Fajitas de arrachera', price: '$400' },
        { id: uuid(), name: 'Fajitas mixtas', description: 'Fajita de pollo o arrachera, pimientos, cebolla, calabacitas a la plancha, chiles toreados y guacamole', price: '$380' },
        { id: uuid(), name: 'Arrachera a la plancha', description: 'Con arroz a la mexicana, guacamole y chiles toreados', price: '$320' },
        { id: uuid(), name: 'Lasaña con ensalada', description: 'Carne molida con salsa pomodoro servida con ensalada', price: '$190' },
        { id: uuid(), name: 'Atún sellado', description: 'Medallón de atún con aguacate, lechugas mixtas, betabel, manzana, nuez de castilla, aceituna negra, alcaparras, aderezada con vinagreta de miel con chile serrano', price: '$340' },
      ],
    },
  }

  const hamburguesas: InvitationBlock<'menu-section'> = {
    ...(createBlock('menu-section', 12) as InvitationBlock<'menu-section'>),
    data: {
      title: 'Hamburguesas',
      items: [
        { id: uuid(), name: 'Hamburguesa Marulier', description: 'Carne de res preparada, jamón de cerdo, queso suizo y tocino. Servida con lechuga, jitomate, cebolla y aguacate. En bollo con mayonesa de la casa. A elegir: ensalada de betabel y manzana o papas fritas.', price: '$245' },
        { id: uuid(), name: 'Hamburguesa de atún', description: 'Medallón de atún sellado con ajonjolí, aguacate, mayonesa de ajonjolí, ensalada de pepino y cebolla morada acompañada con una ensalada mixta y tomate cherry o papas fritas', price: '$350' },
        { id: uuid(), name: 'Hamburguesa de pollo', description: 'Pollo frito con pimientos y cebolla salteados, vinagreta de balsámico, mayonesa de la casa y queso de cabra, ensalada mixta con cherry o papas a la francesa.', price: '$230' },
      ],
    },
  }

  const postres: InvitationBlock<'menu-section'> = {
    ...(createBlock('menu-section', 13) as InvitationBlock<'menu-section'>),
    data: {
      title: 'Postres al plato',
      items: [
        { id: uuid(), name: 'Profiterol', description: 'Clásica pasta choux, rellena con cremoso helado de vainilla, salsa de chocolate y acompañado de frutos rojos', price: '$135' },
        { id: uuid(), name: 'Brownie de chocolate', description: 'Brownie de chocolate nuez, con helado de vainilla y acompañado de frutos del bosque', price: '$125' },
        { id: uuid(), name: 'Tarta de manzana', description: 'Deliciosa tarta de manzana, bañada con salsa de chocolate, helado de vainilla y berries', price: '$125' },
        { id: uuid(), name: 'Crème brûlée', description: 'Clásica Crema de origen francés, cubierta de caramelo crujiente y acompañado de frutos del bosque', price: '$170' },
      ],
    },
  }

  const bebidas: InvitationBlock<'menu-section'> = {
    ...(createBlock('menu-section', 14) as InvitationBlock<'menu-section'>),
    data: {
      title: 'Bebidas',
      description: 'Cafés, tés, jugos y refrescos para acompañar.',
      items: [
        { id: uuid(), name: 'Café americano', price: 'CH $55 / G $70' },
        { id: uuid(), name: 'Capuchino', price: '$60' },
        { id: uuid(), name: 'Té gourmet masala chai', price: '$80' },
        { id: uuid(), name: 'Té gourmet matcha', price: '$80' },
        { id: uuid(), name: 'Naranja', description: 'Recién hecho', price: 'CH$40 / G$55' },
        { id: uuid(), name: 'Rojo', description: 'Frambuesa, mora azul, fresa, naranja', price: 'CH$50 / G$65' },
        { id: uuid(), name: 'Coca cola (regular, light, sin azúcar)', price: '$50' },
        { id: uuid(), name: 'Topo chico', price: '$55' },
      ],
    },
  }

  const note: InvitationBlock<'menu-note'> = {
    ...(createBlock('menu-note', 15) as InvitationBlock<'menu-note'>),
    data: {
      text: 'Todos los platillos son preparados al momento y frescos, por lo que tenemos un tiempo de espera de 25 a 40 minutos. Agradecemos su comprensión.',
      alignment: 'center',
    },
  }

  const footer = createBlock('menu-footer', 16) as InvitationBlock<'menu-footer'>
  footer.data = {
    address: 'Marullier — Av. Reforma 123, CDMX',
    phone: '+52 55 1234 5678',
    hours: 'Lun–Dom · 08:00 a 22:00',
    instagram: '@marullier',
    website: 'https://redesign.mx/marulier',
    whatsapp: '',
  }

  return {
    id: uuid(),
    kind: 'menu',
    title: 'Marullier',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    blocks: [
      header,
      quiche,
      baguettes,
      ensaladas,
      pizzas,
      pizzasEspeciales,
      desayunos,
      especiales,
      toast,
      sopas,
      sandwiches,
      especialesCasa,
      hamburguesas,
      postres,
      bebidas,
      note,
      footer,
    ],
    globalSettings: {
      colorPrimary: '#111820',
      colorSecondary: '#f8f7f2',
      colorAccent: '#dfb163',
      fontFamily: 'serif',
    },
  }
}
