import {
  Invitation,
  InvitationBlock,
  MenuSectionData,
} from '../types/invitation.types'
import { createBlock } from './blockDefaults'

const uuid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)

interface ItemSeed {
  name: string
  description?: string
  price?: string
}
interface SectionSeed {
  title: string
  description?: string
  items: ItemSeed[]
}

const HANNAH_MICHAEL_SECTIONS: SectionSeed[] = [
  {
    title: 'Entradas',
    items: [
      { name: 'Concha con Nata', description: 'De chocolate o vainilla rellena de nata natural de leche', price: '$74' },
      { name: 'Molletitos', description: 'Tres molletis con frijoles refritos, queso oaxaca y pico de gallo. Molletitos: Pancitos salados.', price: '$89' },
      { name: 'Parfait', description: 'Copa de yogurt griego sabor natural, granola y frutos del bosque 500 ml. Frutos del bosque:Fresas, cerezas, frambuesas, moras, arándanos.', price: '$99' },
      { name: 'Concha con Nutella', description: 'De chocolate o vainilla rellena de nutella', price: '$74' },
      { name: 'Pan Francés Relleno', description: 'Pan brioche, ricotta de vainilla, frutos rojos y almentra tostada. Frutos rojos: Fresas, cerezas, frambuesas.', price: '$160' },
      { name: 'Plato de Fruta', description: 'Fruta de temporada acompañado de yogurt griego y granola.', price: '$94' },
    ],
  },
  {
    title: 'Bagels',
    items: [
      { name: 'Bagel de Salmón', description: 'Queso crema, salmón y aguacate. Bagels: Pan en forma de dona.', price: '$199' },
      { name: 'Bagel Americano', description: 'Queso cheddar, huevo revuelto y tocino de cerdo. Bagels: Pan en forma de dona.', price: '$175' },
      { name: 'Bagel Hannah', description: 'Queso crema, jamón serrano y mermelada de cebolla. Bagels: Pan en forma de dona.', price: '$199' },
    ],
  },
  {
    title: 'Toast & Sandwich',
    items: [
      { name: 'Croque Madame', description: 'Pan brioche relleno de jamón de pavo, aguacate, bañado con salsa de queso y huevo estrellado.', price: '$182' },
      { name: 'Toast Pochado', description: 'Pan campesiono tostado, jamón de pavo, aguacate y huevo pochado. Toast: Pan tostado.', price: '$137' },
      { name: 'Toast de Salmón', description: 'Pan campesino tostado con queso crema, salmon, arugula, jitomate cherry y aguacate. Toast: Pan tostado.', price: '$150' },
      { name: 'Toast de Avocado', description: 'Pan campesino tostado con  guacamole, huevo estrellado, arúgula y jitomate cherry.', price: '$131' },
    ],
  },
  {
    title: 'Waffles & Pancakes',
    items: [
      { name: 'Hot Cakes', description: 'Servidos con miel maple y mantequilla 3 pzas.', price: '$150' },
      { name: 'Waffle Reese\'s', description: 'Con chispas de chocolate, crema de avellana y cacahuate 1 pza.', price: '$175' },
      { name: 'Waffle Americano', description: 'Queso cheddar, jamón de pavo y tocino.', price: '$175' },
      { name: 'Hot Cakes Hannah', description: 'Con ricotta de vainilla y crema de avellana bañados en chocolate 3 pzas.', price: '$182' },
      { name: 'Waffle Sándwich', description: 'Espinacas, crujiente tocino, huevo y miel maple.', price: '$187' },
    ],
  },
  {
    title: 'Huevos & Omelettes',
    items: [
      { name: 'Huevos Divorciados', description: 'Estrellados sobre tortilla, con salsa verde y roja. 2 pzas.', price: '$125' },
      { name: 'Huevos al Gusto', description: 'Opción a escoger entre huevos revueltos o estrellados, con jamón, tocino, panela o a la mexicana. 2 pzas.', price: '$137' },
      { name: 'Huevos Ahogados', description: 'Estrellados y cocinados en salsa de chorizo 2 pzas.', price: '$140' },
      { name: 'Omelette Chilaquiles', description: 'Relleno de chilaquiles verdes, rojos o suizos (salsa verde cremosa).', price: '$169' },
      { name: 'Omelette Hannah', description: 'En base de salsa de frijol y relleno de elote, calabaza y queso panela.', price: '$175' },
      { name: 'Huevos Benedictos', description: 'Pochados sobre pan tostado y jamón de pavo y bañados en salsa holandesa 2 pzas.', price: '$189' },
      { name: 'Omelette al Gusto', description: 'Con jamón, tocino, espinacas, queso panela o a la mexicana.', price: '$137' },
    ],
  },
  {
    title: 'Chilaquiles',
    items: [
      { name: 'Chilaquiles Hannah', description: 'En salsa verde cremosa, fajitas de milanesa de pollo, crujiente tocino y aguacate.', price: '$210' },
      { name: 'Birriaquiles', description: 'Con consome y birria de picaña.', price: '$210' },
      { name: 'Torta de Chilaquiles', description: 'Verdes, rojos o suizos, servidos con cebolla, cilantro, crema y queso fresco.', price: '$95' },
      { name: 'Chilaquiles Sencillos', description: 'Verdes o rojos, servidos con frijoles refritos, cebolla, cilantro, crema y queso fresco.', price: '$125' },
      { name: 'Chilaquiles Suizos', description: 'En salsa verde  cremosa, servidos con pollo y gratinados.', price: '$175' },
      { name: 'Chilaquiles en su Jugo', description: 'En salsa de carne en su jugo, tocino y carne de res.', price: '$199' },
    ],
  },
  {
    title: 'Especiales',
    items: [
      { name: 'Enfrijoladas', description: 'Opción de escoger :pollo o chorizo, bañadas en salsa de frijol negro, crema y queso fresco. (4 pzas).', price: '$175' },
      { name: 'Tamal Oaxaqueño', description: 'De salsa verde con pollo sobre salsa de frijol negro, servido con crema y queso fresco.', price: '$125' },
      { name: 'Molletes', description: 'Con frijoles refritos, jamón de pavo y queso manchego, acompañados de pico de gallo (2 pzas).', price: '$113' },
      { name: 'Ennatadas', description: 'Opción de escoger relleno de pollo o queso panela, bañadas en salsa de jitomate con nata, crema y queso fresco. (4 pzas).', price: '$189' },
      { name: 'Enchiladas Suizas', description: 'De pollo y gratinadas. (4 pzas).', price: '$189' },
    ],
  },
  {
    title: 'Ligero',
    items: [
      { name: 'Sándwich', description: 'Espinacas, panela, germen, jitomate y aguacate.', price: '$157' },
      { name: 'Omelette Michael', description: 'De claras con espinacas en base de salsa de jitomate y relleno de pechuga de pavo y queso panela.', price: '$175' },
      { name: 'Pancakes Ligeros', description: 'De avena y plátano, servido con frutos rojos y miel de agave (2 pzas).', price: '$150' },
      { name: 'Chilaquiles Ligeros', description: 'Con totopos horneados en salsa de jitomate, queso panela y pechuga de pavo.', price: '$182' },
    ],
  },
  {
    title: 'Postres',
    items: [
      { name: 'Cheesecake', description: 'Con salsa de frutos rojos, decorado con fresas, frambuesas, zarzamoras y arándanos, y un toque de menta.', price: '$135' },
      { name: 'Brownie', price: '$125' },
      { name: 'Pastel de Chocolate', description: 'Pastel de chocolate en dos capas, relleno de crema de chocolate, coronado con arándanos azules, acompañado de fresas y moras.', price: '$135' },
    ],
  },
  {
    title: 'Hidratantes',
    items: [
      { name: 'Limonada', description: '350 ml.', price: '$55' },
      { name: 'Naranjada', description: '350 ml.', price: '$55' },
    ],
  },
  {
    title: 'Smoothies',
    items: [
      { name: 'Smoothie Berries', description: 'Frutos del bosque y naranja, endulzado con miel de agave (350 ml).', price: '$99' },
      { name: 'Smoothie Rosa', description: 'Plátano, fresa y naranja, endulzado con miel de agave (350 ml).', price: '$99' },
      { name: 'Smoothie Amarillo', description: 'Mango, piña y naranja, endulzado con miel de agave (350 ml).', price: '$99' },
      { name: 'Morning', description: 'Mango, naranja, zanahoria y jengibre , endulzado con miel de agave (350 ml).', price: '$99' },
      { name: 'Smoothie Verde', description: 'Plátano, espinaca, crema de almendras, linaza y leche de almendras, endulzado con miel de agave (350ml).', price: '$99' },
      { name: 'Smoothie Cacao', description: 'Cacao, plátano y leche de almendra, endulzado con miel de agave (350 ml).', price: '$99' },
      { name: 'Smoothie Mango', description: 'Mango, naranja y chamoy con stevia (350 ml).', price: '$99' },
    ],
  },
  {
    title: 'Café',
    items: [
      { name: 'Latte', description: 'Elija una opción.', price: '$82' },
      { name: 'Capuchino', description: 'Elija una opción.', price: '$82' },
      { name: 'Moka', description: 'Elija una opción.', price: '$101' },
      { name: 'Taro', description: 'Elija una opción.', price: '$110' },
      { name: 'Descafeinado', description: 'Elija una opción.', price: '$58' },
      { name: 'Chocolate', description: 'Elija una opción.', price: '$78' },
      { name: 'Matcha', description: 'Elija una opción.', price: '$107' },
      { name: 'Chai', description: 'Elija una opción.', price: '$107' },
      { name: 'Americano', description: 'Elija una opción.', price: '$58' },
      { name: 'Golden Milk', description: 'Elija una opción.', price: '$98' },
    ],
  },
  {
    title: 'Malteadas',
    items: [
      { name: 'Malteada de Nutella', description: '400 ml.', price: '$99' },
      { name: 'Malteada de Oreo', description: '400 ml.', price: '$99' },
      { name: 'Malteada de Vainilla', description: '400 ml.', price: '$99' },
      { name: 'Malteada de Fresa', description: '400 ml.', price: '$99' },
      { name: 'Malteada de Chocolate', description: '400 ml.', price: '$99' },
      { name: 'Malteada de Mazapán', description: 'Leche batida con mazapán.', price: '$99' },
      { name: 'Malteada Moka', description: '400 ml.', price: '$99' },
      { name: 'Malteada de Cajeta', description: '400 ml.', price: '$99' },
    ],
  },
  {
    title: 'Jugos',
    items: [
      { name: 'Jugo de Naranja', description: '350 ml.', price: '$46' },
      { name: 'Jugo Verde', description: '350 ml.', price: '$56' },
    ],
  },
  {
    title: 'Refrescos',
    items: [
      { name: 'Coca Cola sin Azúcar', description: '355 ml.', price: '$53' },
      { name: 'Coca Cola', description: '355 ml.', price: '$53' },
      { name: 'Coca Cola Light', description: '355 ml.', price: '$53' },
      { name: 'Sprite', description: '355 ml.', price: '$53' },
      { name: 'Fanta', price: '$53' },
      { name: 'Fresca', price: '$53' },
      { name: 'Agua Mineral Topochico', price: '$63' },
      { name: 'Agua Mineral Ciel', price: '$53' },
    ],
  },
  {
    title: 'Menú Infantil',
    items: [
      { name: 'Huevo (1pz)', description: 'Huevo revuelto al gusto servido con frijoles refritos.', price: '$88' },
      { name: 'Hot Cakes (2pzas)', description: 'Servidos con mantequilla y miel.', price: '$101' },
      { name: 'Sincronizada', description: 'Tortillas de harina con queso cheddar, mozarella y jamón de pavo acompañado de papas a la francesa.', price: '$106' },
    ],
  },
]

const COCINOTECA_SECTIONS: SectionSeed[] = [
  {
    title: 'Menú degustación',
    description: '6 Tiempos',
    items: [
      { name: '1er Tiempo', description: 'Flauta de duro de cecina leonesa de res, relleno de ceviche de pesca del día, pico de gallo, cueritos, aguacate, mayonesa de chile serrano, mayonesa de chile chipotle y cilantro' },
      { name: '2do Tiempo', description: 'Taco de aguacate criollo empanizado con duro, tortilla de maíz, queso panela, pico de gallo, mayonesa de serrano y cilantro criollo.' },
      { name: '3er Tiempo', description: 'Crema de calabaza ahumada, pan brioche gratinado con quesos locales, verdolaga y mayonesa de ajo.' },
      { name: '4to Tiempo', description: 'Lomo de trucha zarandeado de Zitácuaro Michoacán Acompañado en cacahuatado de cítricos y vegetales orgánicos' },
      { name: '5to Tiempo', description: 'Brisket de res ahumado, pure robouchon, salsa de cebolla tatemada, verdolaga, ceniza de totomostle' },
      { name: '6to Tiempo', description: 'Postre de temporada, espuma de elote tatemado, helado de calabaza, crumble de cocoa y mazapán de la casa.' },
    ],
  },
  {
    title: 'Entradas',
    description: 'Entrada',
    items: [
      { name: 'Tacos de Aire con Flor de Calabaza y Quelites', description: 'Taco de aire rellenos de quelites, cremoso de requesón y aguacate y vinagreta de citícos. 3 pzas', price: '$207' },
      { name: 'Tacos de Pescado Zarandeado', description: 'Posta de pescado zarandeado en adobo de xocnóstle, tzatziki de chile serrano y cilantro, arúgula y tortilla de maíz nixtamalizado en casa. 2 pzas', price: '$211' },
      { name: 'Tacos de Short Rib Asado y con Papas.', description: 'Short rib asado pasado por la plancha, guacamole, papas fritas corte muy fino y tortilla de maíz nixtamalizado en casa 3 pzas', price: '$219' },
      { name: 'Tacos de Lengua Ahumada', description: 'Con salsa verde tatemada de tuétano y verdolagas, cebolla blanca encurtida 2 pzas', price: '$242' },
      { name: 'Tacos de Pork Belly Ahumado', description: 'Banados en nuestra deliciosa Salsa de Cacahuate, Pico de Escabeche, Quelites , Tortilla de maíz nixtamalizado en casa', price: '$185' },
      { name: 'Chicharrón de Lonja con Cremoso de Chile Cuaresmeno', description: 'Chicharrón elaborado en casa con esquites y cremoso de chile cuaresmeno y cilantro criollo', price: '$287' },
      { name: 'Carpaccio de Brisket', description: 'Platillo con 12 días de elaboración acompañado de salsa mediterránea y ensalada de arúgula y tomates baby.', price: '$383' },
      { name: 'Aguachile Negro de Jamón de Papada de Cerdo', description: 'Jamón elaborado en la casa, aguachile negro, cebolla rostizadas aguacate y cilantro criollo', price: '$297' },
      { name: 'Ceviche Rojo de Mariscos con salsa de Cecina Leonesa', description: 'Camarón, Pulpo y Pescado bañados en nuestra salsa Coctelera de cecina Leonesa. Lleva aguacate y cacahuate.', price: '$414' },
    ],
  },
  {
    title: 'Sopas',
    description: 'Sopas',
    items: [
      { name: 'Crema de Tomate Ahumada', description: 'Crotón y hongos salteados', price: '$166' },
      { name: 'Caldo de Pollo Rojo de la Abuela', description: 'Caldo de Pollo con arroz, pollo y verduras', price: '$176' },
    ],
  },
  {
    title: 'Pastas & Arroces',
    description: 'Pastas & Arroces',
    items: [
      { name: 'El Clásico Fideo seco de La Cocinoteca', description: 'Fideos Secos con Rabo de Toro Ahumado', price: '$297' },
      { name: 'El Arroz Meloso con Pulpo Zarandeado  y Papada Ahumada.', description: 'Arroz meloso con pulpo a las brasas y papada de cerdo ahumada. (Delicioso)', price: '$650' },
      { name: 'Fettuchini Artesanal con Salsa de Tomate Cremosa', description: 'Pasta fresca elaborada aquí en casa con crema de jitomate, queso parmesano local, albahaca y tomate cherry.', price: '$280' },
    ],
  },
  {
    title: 'Ensaladas & Vegetarianos',
    description: 'Ensaladas & Vegetarianos',
    items: [
      { name: 'Vegetales orgánicos salteados', description: 'Con encacahuatado de cítricos y tamarindo', price: '$229' },
      { name: 'Tacos de Aire con Quelites y Flor de Calabaza', description: 'Taco de aire relleno de quelites, cremoso de requesón y aguacate.', price: '$207' },
      { name: 'Ensalada de Betabeles Asados , Salsa de Burrata y Palomitas de Sorgo', description: 'Betabeles asados, salsa de burrata y requesón local, arúgula, palomitas de sorgo y pepino en escabeche.', price: '$217' },
      { name: 'Ensalada de Lechuga Asada a las Brasas', description: 'Fresca Lechuga Asada, Aguacate, Ejotes, Coles de Bruselas, Semilla de Calabaza, Vinagreta de Miel de Agave.', price: '$281' },
    ],
  },
  {
    title: 'Pescados & Mariscos',
    description: 'Pescados & Mariscos',
    items: [
      { name: 'Lomo de Trucha Salmonada de Zitácuaro Zarandeada', description: 'Con adobo de xoconostle y encacahuatado de cítricos.', price: '$469' },
      { name: 'Pulpo Asado a las Brasas', description: 'Pulpo zarandeado acompañado puré de papa y esquites.', price: '$536' },
      { name: 'Ceviche Rojo de Mariscos con salsa de Cecina Leonesa', description: 'Camarón, Pescado y Pulpo bañados en nuestra salsa coctelera de cecina Leonesa. Cacahuate, Aguacate y sorbete de Mango y Chamoy. Tostada tatemada a la brasa.', price: '$397' },
    ],
  },
  {
    title: 'Platos Fuertes',
    description: 'Platos Fuertes',
    items: [
      { name: 'Steak de Papada de Cerdo Ahumada', description: 'Con mojo de menta y pimiento asado', price: '$333' },
      { name: 'Suprema de Pollo a las brasas con Chimuchurri Leonés.', description: 'Bañada con nuestra versión de chimichurri leonés, puré de papa y esquites salteados', price: '$395' },
      { name: 'La Lengua de Res Ahumada con Verdolagas', description: 'Lengua Ahumada acompañado de salsa verde tatemada con tuétano y verdolagas', price: '$495' },
      { name: 'Enchiladas Mineras con Mole de Nuez', description: 'Enchiladas mineras rellenas de zanahoria, papa, calabaza, servidas con crema y queso local Macouzet', price: '$259' },
    ],
  },
  {
    title: 'Postres',
    description: 'Postres',
    items: [
      { name: 'Volcán de Chococajeta', description: 'Chocolate y Cajeta de Celaya', price: '$173' },
      { name: 'Fresas con crema', description: 'Y queso mascarpone', price: '$207' },
      { name: 'Pan de elote con cajeta, cacahuate', description: 'Y helado de Caramel Cream de San Felipe, Guanajuato', price: '$173' },
      { name: 'Cajeta de membrillo', description: 'Con queso manchego curado de oveja', price: '$173' },
      { name: 'Caminos de Guanajuato', description: 'Fresas con crema, pan de elote y cajeta de membrillo', price: '$176' },
    ],
  },
  {
    title: 'Menú Casero Para Niños',
    description: 'Menú Casero Para Niños',
    items: [
      { name: 'Fideos', description: 'A la mantequilla con queso', price: '$160' },
      { name: 'Taquitos de papa como los de la abuela', description: 'Rellenos de papa, lechuga, crema y queso', price: '$124' },
      { name: 'CaldIto de pollo', description: 'Con verduras y arroz', price: '$124' },
    ],
  },
  {
    title: 'Guarniciones',
    description: 'Guarniciones',
    items: [
      { name: 'Puré de plátano', description: 'Ahumado', price: '$68' },
      { name: 'Puré', description: 'De papa', price: '$68' },
      { name: 'Orden de cacahuates', description: 'En escabeche', price: '$28' },
    ],
  },
  {
    title: 'Aperitivos',
    description: 'Aperitivos',
    items: [
      { name: 'Punt E Mes', price: '$138' },
      { name: 'Dubonnet', price: '$109' },
      { name: 'Campari', price: '$107' },
      { name: 'Fernet Branca', price: '$153' },
      { name: 'St. Germain', price: '$156' },
      { name: 'Averna', price: '$127' },
      { name: 'Aperol', price: '$113' },
      { name: 'Absinth', price: '$131' },
      { name: 'Peychaud\'s', price: '$91' },
    ],
  },
  {
    title: 'Cervezas',
    description: 'Grupo Moctezuma y Artesanales',
    items: [
      { name: 'Tecate', description: 'Roja', price: '$61' },
      { name: 'Tecate', description: 'Light', price: '$61' },
      { name: 'Bohemia', description: 'Pilsner Clara', price: '$72' },
      { name: 'Bohemia', description: 'Vienna Oscura', price: '$72' },
      { name: 'Bohemia', description: 'Cristal', price: '$72' },
      { name: 'Bohemia', description: 'Trigo Weizen', price: '$72' },
      { name: 'XX', description: 'Lager', price: '$61' },
      { name: 'XX', description: 'Ámbar', price: '$61' },
      { name: 'XX', description: 'Ultra', price: '$72' },
      { name: 'Amstel', description: 'Ultra', price: '$72' },
      { name: 'Heineken', description: '0.0', price: '$57' },
      { name: 'Heineken', price: '$78' },
      { name: 'Heineken', description: 'Barril', price: '$78' },
      { name: 'Heineken', description: 'Silver', price: '$78' },
      { name: 'Carta Blanca', price: '$61' },
      { name: 'Indio', price: '$61' },
      { name: 'Libertad', description: 'Blonde', price: '$130' },
      { name: 'Libertad', description: 'Ipa', price: '$135' },
      { name: 'Libertad', description: 'Red', price: '$130' },
      { name: 'Libertad', description: 'Stout', price: '$135' },
      { name: 'Mijito', description: 'Ambar', price: '$130' },
      { name: 'Mijito', description: 'Clara', price: '$130' },
      { name: 'Mijito', description: 'Red Ale', price: '$130' },
    ],
  },
  {
    title: 'Coctelería',
    description: 'Bebidas con alcohol',
    items: [
      { name: 'Moscow Mule', description: 'Vodka Tito\'s, cerveza de jengibre, jugo de limón', price: '$205' },
      { name: 'Mint Julep', description: 'Bushmill\'s 10, menta, jarabe simple', price: '$175' },
      { name: 'New York Sour', description: 'Whiskey Bushmills 10, vino tinto, jugo limón, jarabe simple y clara de huevo', price: '$190' },
      { name: 'Pamplemusa', description: 'Mezcal Creyente Joven, Aperol, jugo de toronja, jugo de piña, escarchado con chile en polvo', price: '$210' },
      { name: 'Expresso Martini', description: 'Vodka Tito\'s, Cream Caramel Guanamé, café espresso', price: '$180' },
      { name: 'Paola', description: 'Ginebra Martin Miller\'s, licor de granada, jugo de arándano, prosecco', price: '$240' },
      { name: 'Chilín', description: 'Tequila 1800 Cristalino, licor de chile ancho, jugo de toronja, jugo de arándano, jarabe de frutos rojos', price: '$230' },
      { name: 'Carajillo Ahumado', description: 'Licor 43, café espresso y bitter de plátano macho hecho en casa', price: '$203' },
      { name: 'Carajillo', price: '$188' },
      { name: 'Café Irlandés', description: 'Bushmills 10, café, azúcar mascabado y crema montada', price: '$203' },
      { name: 'Aperol spritz', description: 'Licor Aperol, cinzano to spritz y agua min', price: '$195' },
      { name: 'Tommy\'s Margarita', description: 'Tequila Reserva de la Familia Platino, miel de agave, limón y sal', price: '$190' },
      { name: 'Alexander', description: 'Gin Martin Miller\'s, Crema de cacao blanca, crema de leche y nuez moscada', price: '$210' },
      { name: 'Grasshoper', description: 'Crema de cacao, crema de menta, crema de leche y chocolate rallado', price: '$210' },
      { name: 'Marfil', description: 'Crema de ron con horchata, agua de coco y jarabe de plátano', price: '$210' },
    ],
  },
  {
    title: 'Mezcal',
    description: 'Mezcal',
    items: [
      { name: 'Creyente', description: 'Joven Espadín', price: '$190' },
      { name: '400 Conejos', description: 'Espadín Joven', price: '$183' },
      { name: '400 Conejos', description: 'Espadín Reposado', price: '$185' },
      { name: 'Unión joven', description: 'Mezcal de Oaxaca', price: '$175' },
      { name: 'Creyente', description: 'Tobalá', price: '$331' },
      { name: '400 Conejos', description: 'Tobalá', price: '$205' },
      { name: 'Creyente', description: 'Cuishe', price: '$331' },
      { name: '400 Conejos', description: 'Cuishe', price: '$199' },
      { name: 'Montelobos', description: 'Ensamble', price: '$249' },
      { name: 'Montelobos', description: 'Espadín', price: '$198' },
      { name: 'Bruxo No. 4', description: 'Ensamble', price: '$295' },
      { name: 'Amarás', description: 'Espadín Joven', price: '$198' },
      { name: 'Amarás', description: 'Espadín Reposado', price: '$208' },
      { name: 'Ojo de Tigre', description: 'Espadín/ Tobalá Joven', price: '$205' },
      { name: 'La Quinta', description: 'Salmiana Joven', price: '$215' },
      { name: 'Ojo de Tigre', description: 'Espadín/ Tobalá Reposado', price: '$210' },
      { name: 'Tiburón Blanco', description: 'Joven Espadín', price: '$195' },
      { name: 'Xha Papá joven', description: 'Mezcal de Oaxaca espadín', price: '$232' },
      { name: 'Del Tío Ro', description: '(Marmorata) Tepeztate', price: '$338' },
      { name: 'Del Tío Ro Espadín', description: 'Mezcal de Oaxaca espadín', price: '$283' },
      { name: 'Montelobos', description: 'Tobalá', price: '$355' },
      { name: 'Creyente reposado cristalino', description: 'Espadín cristalino', price: '$234' },
      { name: 'Del Tío Ro', description: 'Rhodacantha (Mexicano)', price: '$283' },
    ],
  },
  {
    title: 'Tequila',
    description: 'Tequila',
    items: [
      { name: 'Reserva de la Familia', description: 'Platino', price: '$260' },
      { name: '1800', description: 'Blanco', price: '$195' },
      { name: 'Maestro Dobel', description: 'Blanco', price: '$205' },
      { name: 'Jose Cuervo Tradicional', description: 'Plata', price: '$150' },
      { name: 'Gran Centenario', description: '40 años', price: '$165' },
      { name: 'Centenario', description: 'Plata', price: '$150' },
      { name: 'Don Julio', description: 'Tequila blanco', price: '$205' },
      { name: 'Reserva de la Familia', description: 'Reposado', price: '$350' },
      { name: '1800', description: 'Reposado', price: '$205' },
      { name: 'Maestro Dobel', description: 'Reposado', price: '$220' },
      { name: 'Jose Cuervo Tradicional', description: 'Reposado', price: '$150' },
      { name: 'Centenario', description: 'Reposado', price: '$150' },
      { name: 'Don julio reposado', description: 'Tequila reposado', price: '$225' },
      { name: 'Reserva de la Familia', description: 'Extra Añejo', price: '$650' },
      { name: '1800', description: 'Añejo', price: '$220' },
      { name: 'Maestro Dobel', description: 'Añejo', price: '$275' },
      { name: 'Maestro Dobel', description: 'Añejo  1967', price: '$1811' },
      { name: 'Centenario Leyenda', description: 'Tequila Extra añejo', price: '$595' },
      { name: 'Centenario', description: 'Añejo', price: '$220' },
      { name: '1800 Milenio', description: 'Tequila Extra añejo', price: '$505' },
      { name: 'Don julio añejo', description: 'Tequila añejo', price: '$285' },
      { name: 'Don Julio 1942', description: 'Tequila Extra añejo', price: '$720' },
      { name: 'Hornitos', description: 'Reposado', price: '$122' },
      { name: 'Hornitos', description: 'Black Barrel Añejo', price: '$199' },
      { name: 'Maestro Dobel 50', description: 'Cristalino', price: '$527' },
      { name: '1800', description: 'Cristalino', price: '$240' },
      { name: 'Centenario cristalino', description: 'Tequila Añejo Cristalino', price: '$360' },
      { name: 'Maestro Dobel', description: 'Diamante', price: '$266' },
      { name: 'Jose Cuervo Tradicional', description: 'Cristalino', price: '$180' },
      { name: 'Don Julio reposado claro', description: 'Tequila cristalino reposado', price: '$201' },
      { name: 'Don Julio 70', description: 'Tequila añejo cristalino', price: '$297' },
      { name: 'Hornitos', description: 'Cristalino', price: '$215' },
      { name: 'Tres Generaciones', description: 'Plata', price: '$195' },
      { name: 'Tres Generaciones', description: 'Reposado', price: '$215' },
      { name: 'Tres Generaciones', description: 'Añejo', price: '$245' },
      { name: 'Tres Generaciones', description: 'Cristalino', price: '$265' },
      { name: 'Maestro Dobel', description: 'Pavito', price: '$255' },
      { name: 'Casa Dragones', description: 'Blanco', price: '$435' },
      { name: 'Volcán', description: 'Reposado', price: '$281' },
      { name: 'Volcán', description: 'Cristalino', price: '$385' },
    ],
  },
  {
    title: 'Ginebra',
    description: 'Ginebra',
    items: [
      { name: 'Martin Miller\'s', price: '$265' },
      { name: 'Tanqueray London', description: 'GINEBRA', price: '$170' },
      { name: 'Tanqueray Rangpur', description: 'ginebra', price: '$195' },
      { name: 'Tanqueray Ten', description: 'ginebra', price: '$255' },
      { name: 'Roku', price: '$235' },
      { name: 'Sipsmith', price: '$205' },
      { name: 'Condesa Gin- Xoconostle y Azahar', description: 'Ginebra macerada con xoconostle y azahar', price: '$235' },
      { name: 'Condesa Gin- Clasica Dry Gin', description: 'Ginebra Dry gin', price: '$235' },
      { name: 'Bulldog Gin', price: '$215' },
      { name: 'Hendrick\'s', price: '$265' },
      { name: 'Monkey 47', price: '$375' },
      { name: 'Botanic Premium', price: '$207' },
    ],
  },
  {
    title: 'Vodka',
    description: 'Vodka',
    items: [
      { name: 'Tito\'s', price: '$195' },
      { name: 'Smirnoff 21', description: 'Vodka', price: '$125' },
      { name: 'Belvedere', price: '$202' },
      { name: 'Grey Goose', price: '$239' },
      { name: 'Crystal Head Vodka', price: '$355' },
      { name: 'Stolichnaya', price: '$135' },
      { name: 'Absolut', description: 'Elyx', price: '$151' },
    ],
  },
  {
    title: 'Brandy',
    description: 'Brandy',
    items: [
      { name: 'Torres X', description: 'Brandy', price: '$145' },
      { name: 'Torres XX', description: 'Brandy', price: '$295' },
      { name: 'Carlos I', description: 'Brandy', price: '$275' },
    ],
  },
  {
    title: 'Whiskey',
    description: 'Whiskey',
    items: [
      { name: 'Bushmills', description: '10 Años', price: '$213' },
      { name: 'Bushmills', description: '16 Años', price: '$530' },
      { name: 'Bushmills', description: '21 Años', price: '$1155' },
      { name: 'Bushmills', description: 'Blackbush', price: '$165' },
      { name: 'Toki', price: '$190' },
      { name: 'Johnnie Walker', description: 'Black label', price: '$238' },
      { name: 'Johnnie Walker', description: 'Gold label', price: '$359' },
      { name: 'Johnnie Walker', description: 'Green label', price: '$409' },
      { name: 'Singlenton', description: 'Whisky 12 años', price: '$252' },
      { name: 'Buchanan´s 12', description: 'Whisky 12 años', price: '$217' },
      { name: 'Buchanan´s Master', description: 'whisky 15 años', price: '$262' },
      { name: 'Buchanan´s 18', description: 'Whisky 18 años', price: '$451' },
      { name: 'Nobushi', description: 'Japanese', price: '$272' },
      { name: 'Macallan', description: '12 Años', price: '$351' },
      { name: 'Macallan', description: '18 Años', price: '$1250' },
      { name: 'Chivas', description: '18 Años', price: '$495' },
      { name: 'Marker\'s Mark', description: 'Bourbon', price: '$153' },
      { name: 'Wild Turkey', description: 'Bourbon', price: '$131' },
      { name: 'Wild Turkey', description: 'Rye', price: '$146' },
      { name: 'Jim Beam', description: 'White', price: '$118' },
      { name: 'Jim Beam', description: 'Black', price: '$138' },
      { name: 'Glenmorangie 14 años', description: 'Quinta La Ruban', price: '$364' },
      { name: 'Glenmorangie 10 años', description: 'Original', price: '$245' },
      { name: 'Glenmorangie 12 años', description: 'La Santa', price: '$284' },
      { name: 'Hibiki', description: 'Hibiki', price: '$549' },
      { name: 'Glenfiddich', description: '12 años', price: '$248' },
      { name: 'Glenfiddich', description: '18 años', price: '$543' },
    ],
  },
  {
    title: 'Cognac',
    description: 'Cognac',
    items: [
      { name: 'Henessy', description: 'V.S.', price: '$278' },
      { name: 'Henessy', description: 'V.S.O.P.', price: '$345' },
      { name: 'Martell', description: 'V.S.', price: '$245' },
      { name: 'Martell', description: 'V.S.O.P.', price: '$298' },
      { name: 'Martell', description: 'Blue Swift', price: '$345' },
    ],
  },
  {
    title: 'Ron',
    description: 'Ron',
    items: [
      { name: 'Matusalem', description: 'Clásico', price: '$145' },
      { name: 'Captain Morgan', description: 'RON', price: '$115' },
      { name: 'Flor de Caña', description: '12 Años', price: '$215' },
      { name: 'Flor de Caña', description: 'Reserva 7 años', price: '$165' },
      { name: 'Zacapa 23', description: 'Ron de Guatemala', price: '$287' },
      { name: 'Zacapa xo', description: 'Ron de Guatemala', price: '$680' },
      { name: 'Bacardi', description: 'Gran Reserva 10 Años', price: '$305' },
      { name: 'Bacardi', description: 'Reserva 8 años', price: '$215' },
      { name: 'Matusalem', description: 'Platino', price: '$130' },
      { name: 'Bacardi', description: 'Blanco', price: '$135' },
      { name: 'Appleton Estate', price: '$138' },
      { name: 'Havana Club', description: 'Añejo 3 años', price: '$125' },
      { name: 'Santa Teresa', price: '$288' },
      { name: 'Botran', description: 'Gran Reserva 12 Años', price: '$185' },
      { name: 'Botran', description: 'Reserva 8 Años', price: '$165' },
      { name: 'Havana Club', description: 'Reserva 7 años', price: '$165' },
      { name: 'Matusalem', description: 'Gran Reserva 15 Años', price: '$175' },
      { name: 'Matusalem', description: 'Gran Reserva 18 años', price: '$220' },
      { name: 'Matusalem', description: 'Gran Reserva 23 años', price: '$320' },
      { name: 'Botran', description: 'Gran Reserva 15 años', price: '$205' },
    ],
  },
  {
    title: 'Bebidas',
    description: 'Sin Alcohol',
    items: [
      { name: 'Limonada', description: 'de Frutos Rojos', price: '$94' },
      { name: 'Café', description: 'Expresso', price: '$45' },
      { name: 'Café Expresso', description: 'Doble', price: '$90' },
      { name: 'Café Expresso', description: 'Cubano', price: '$89' },
      { name: 'Café', description: 'Americano', price: '$45' },
      { name: 'Café', description: 'Europeo', price: '$86' },
      { name: 'Café', description: 'Capuccino', price: '$72' },
      { name: 'Café', description: 'Mocha', price: '$78' },
      { name: 'Tizanas', description: '( Preguntar sabores)', price: '$65' },
      { name: 'Vaso', description: 'con Leche', price: '$20' },
      { name: 'Moktails', price: '$99' },
      { name: 'Clamato preparado', price: '$90' },
      { name: 'Piñada', price: '$103' },
    ],
  },
  {
    title: 'Refrescos & Agua Mineral',
    description: 'Variedad',
    items: [
      { name: 'Coca-Cola', description: 'Regular', price: '$55' },
      { name: 'Coca-Cola', description: 'Light', price: '$55' },
      { name: 'Coca-Cola', description: 'Sin Azúcar', price: '$55' },
      { name: 'Sidral Mundet', price: '$55' },
      { name: 'Sprite', price: '$55' },
      { name: 'Fanta', price: '$55' },
      { name: 'Squirt', description: 'Regular', price: '$55' },
      { name: 'Squirt', description: 'Light', price: '$55' },
      { name: 'Topo Chico', price: '$59' },
      { name: 'Agua de Piedra', price: '$139' },
      { name: 'San Pellegrino Chica', price: '$69' },
      { name: 'San Pellegrino Grande', price: '$149' },
      { name: 'Agua MIneral Hethe', price: '$75' },
      { name: 'Acqua Panna', description: 'Agua natural de manantial de la Toscana Italia', price: '$125' },
    ],
  },
  {
    title: 'Digestivos',
    description: 'Digestivos',
    items: [
      { name: 'Baileys', description: 'Crema de whisky', price: '$110' },
      { name: 'Guaname Cream Caramel', description: 'Crema de Ron', price: '$105' },
      { name: 'Chinchón', description: 'Seco', price: '$102' },
      { name: 'Chinchón', description: 'Dulce', price: '$102' },
      { name: 'Chinchón', description: 'Campechano', price: '$102' },
      { name: 'Galliano', price: '$156' },
      { name: 'Chartreuse', description: 'Verde', price: '$256' },
      { name: 'Chartreuse', description: 'Amarillo', price: '$242' },
      { name: 'Frangelico', price: '$131' },
      { name: 'Strega', price: '$164' },
      { name: 'Amarreto Dissarono', price: '$151' },
      { name: 'Licor 43', price: '$162' },
      { name: 'Vaccari', description: 'Negro', price: '$122' },
      { name: 'Vaccari', description: 'Blanco', price: '$104' },
      { name: 'Rum Chata', price: '$136' },
      { name: 'Grand Manier', price: '$186' },
      { name: 'Drambuie', price: '$154' },
    ],
  },
]

function buildMenuFromSeeds(args: {
  title: string
  tagline: string
  brandColor: string
  navColor: string
  navText: string
  accent: string
  sections: SectionSeed[]
  footer: {
    address?: string
    phone?: string
    hours?: string
    instagram?: string
    whatsapp?: string
    website?: string
  }
}): Invitation {
  const now = new Date().toISOString()

  const header = createBlock('menu-header', 0) as InvitationBlock<'menu-header'>
  header.data = {
    title: args.title,
    tagline: args.tagline,
    logo: '',
    backgroundImage: '',
    backgroundColor: args.brandColor,
    navBackgroundColor: args.navColor,
    navTextColor: args.navText,
    stickyHeader: false,
    stickyNavOnly: true,
    showLogo: false,
    showTitle: true,
    showTagline: true,
  }

  const sectionBlocks: InvitationBlock[] = args.sections.map((sec, i) => {
    const block = createBlock('menu-section', i + 1) as InvitationBlock<'menu-section'>
    const data: MenuSectionData = {
      title: sec.title,
      description: sec.description ?? '',
      items: sec.items.map((it) => ({
        id: uuid(),
        name: it.name,
        description: it.description ?? '',
        price: it.price ?? '',
      })),
    }
    block.data = data
    return block
  })

  const footer = createBlock('menu-footer', sectionBlocks.length + 1) as InvitationBlock<'menu-footer'>
  footer.data = {
    address: args.footer.address ?? '',
    phone: args.footer.phone ?? '',
    hours: args.footer.hours ?? '',
    instagram: args.footer.instagram ?? '',
    whatsapp: args.footer.whatsapp ?? '',
    website: args.footer.website ?? '',
  }

  return {
    id: uuid(),
    kind: 'menu',
    title: args.title,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    blocks: [header, ...sectionBlocks, footer],
    globalSettings: {
      colorPrimary: args.brandColor,
      colorSecondary: '#ffffff',
      colorAccent: args.accent,
      fontFamily: 'serif',
    },
  }
}

export function createHannahMichaelMenu(): Invitation {
  return buildMenuFromSeeds({
    title: 'Hannah & Michael',
    tagline: 'Desayuno · Brunch · Café',
    brandColor: '#2d1b14',
    navColor: '#1a0f0a',
    navText: '#f5e9dc',
    accent: '#c19a6b',
    sections: HANNAH_MICHAEL_SECTIONS,
    footer: {
      address: 'Guanajuato Centro, Gto.',
      phone: '+52 473 120 4392',
      hours: 'Lun–Dom · 8:00 – 18:00',
      instagram: '@hannahymichael',
    },
  })
}

export function createCocinotecaMenu(): Invitation {
  return buildMenuFromSeeds({
    title: 'La Cocinoteca',
    tagline: 'Cocina contemporánea de Guanajuato',
    brandColor: '#1a1a1a',
    navColor: '#0d0d0d',
    navText: '#f4ead5',
    accent: '#a8744a',
    sections: COCINOTECA_SECTIONS,
    footer: {
      address: 'León, Guanajuato',
      phone: '',
      hours: '',
      instagram: '@lacocinoteca',
      website: 'lacocinoteca.club',
    },
  })
}
