export type InvitationKind = 'invitation' | 'menu'

export type InvitationBlockType =
  | 'hero'
  | 'event-details'
  | 'timeline'
  | 'dress-code'
  | 'gift-registry'
  | 'rsvp-info'
  | 'footer'
  | 'gallery'
  | 'map'

export type MenuBlockType =
  | 'menu-header'
  | 'menu-section'
  | 'menu-note'
  | 'menu-footer'

export type BlockType = InvitationBlockType | MenuBlockType

export type FontFamily = 'serif' | 'sans-serif' | 'script'

export type Alignment = 'left' | 'center' | 'right'

export interface BlockMetadata {
  createdAt: string
  lastEdited: string
}

export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface TextElementStyle {
  size?: TextSize
  color?: string
}

export interface BlockStyle {
  backgroundColor?: string
  textColor?: string
  paddingY?: 'sm' | 'md' | 'lg' | 'xl'
  textSize?: TextSize
  // Per-element overrides keyed by field name (e.g. "title", "items.title").
  textStyles?: Record<string, TextElementStyle>
  /** Hide the decorative icons that some invitation blocks render in their cards. */
  hideIcons?: boolean
}

export interface HeroData {
  title: string
  subtitle: string
  alignment: Alignment
  dateFormat: 'DD/MM/YYYY' | 'MMMM DD, YYYY' | 'DD MMMM YYYY'
  eventDate: string
  backgroundImage?: string
  backgroundColor?: string
  showDate: boolean
  showTitle: boolean
  showSubtitle: boolean
}

export interface EventDetailsData {
  date: string
  time: string
  location: string
  address?: string
  description: string
  icon: 'wedding' | 'birthday' | 'corporate' | 'baby' | 'graduation' | 'generic'
}

export interface TimelineItem {
  id: string
  time: string
  title: string
  description?: string
  icon: 'ceremony' | 'cocktail' | 'dinner' | 'dance' | 'cake' | 'speech' | 'generic'
}

export interface TimelineData {
  title: string
  items: TimelineItem[]
  alignment?: Alignment
}

export interface DressCodeData {
  code: string
  notes?: string
  inspirationImage?: string
  referenceLink?: string
}

export interface GiftRegistryItem {
  id: string
  storeName: string
  link: string
  description?: string
  image?: string
}

export interface GiftRegistryData {
  title: string
  message?: string
  items: GiftRegistryItem[]
}

export interface RsvpInfoData {
  instructions: string
  contactEmail?: string
  contactPhone?: string
  rsvpLink?: string
  deadline: string
  accessCode?: string
  /** International phone number (digits only, with country code) for the WhatsApp deep-link. */
  whatsappPhone?: string
  /** Default message that pre-fills the WhatsApp chat. */
  whatsappMessage?: string
  /** Label on the confirm button (defaults to "Confirmar asistencia"). */
  whatsappButtonLabel?: string
  /** Toggle: when true guests confirm via inline form instead of WhatsApp. */
  useRsvpForm?: boolean
  /** When using form, a public guestlist link is generated and tied to this invitation (slug only). */
  enableGuestList?: boolean
  /** Generated guestlist slug (short id). */
  guestListSlug?: string
  /** Full shareable guestlist URL (client-side convenience). */
  guestListLink?: string
}

export interface MapData {
  title?: string
  address: string
  /** Optional override for the iframe src. If absent, generated from address. */
  embedUrl?: string
  /** Display height of the map in pixels. */
  height?: number
  /** Optional link text shown under the map. */
  openLinkLabel?: string
}

export interface FooterData {
  message: string
  phone?: string
  email?: string
  instagram?: string
  whatsapp?: string
}

export interface GalleryImage {
  id: string
  url: string
  caption?: string
}

export interface GalleryData {
  title: string
  images: GalleryImage[]
  columns: 2 | 3 | 4
}

// ── Menu block data ─────────────────────────────────────────────────────────

export interface MenuHeaderData {
  title: string
  tagline?: string
  logo?: string
  backgroundImage?: string
  backgroundColor?: string
  navBackgroundColor?: string
  navTextColor?: string
  // Sticky behavior: whole header vs only the nav bar
  stickyHeader?: boolean
  stickyNavOnly?: boolean
  showLogo: boolean
  showTitle: boolean
  showTagline: boolean
  /** Size of the sticky nav bar. Defaults to 's'. */
  navSize?: 's' | 'm' | 'xl'
  /** Size of the logo in the header. Defaults to 'm'. */
  logoSize?: 's' | 'm' | 'l' | 'xl'
}

export interface MenuItem {
  id: string
  name: string
  description?: string
  price?: string
  badges?: string
}

export interface MenuSectionData {
  title: string
  description?: string
  items: MenuItem[]
  /** Vertical spacing between platillos. Defaults to 'md'. */
  itemSpacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export interface MenuNoteData {
  text: string
  alignment?: Alignment
}

export interface MenuFooterData {
  address?: string
  phone?: string
  hours?: string
  instagram?: string
  whatsapp?: string
  website?: string
}

export type BlockDataMap = {
  hero: HeroData
  'event-details': EventDetailsData
  timeline: TimelineData
  'dress-code': DressCodeData
  'gift-registry': GiftRegistryData
  'rsvp-info': RsvpInfoData
  footer: FooterData
  gallery: GalleryData
  map: MapData
  'menu-header': MenuHeaderData
  'menu-section': MenuSectionData
  'menu-note': MenuNoteData
  'menu-footer': MenuFooterData
}

export interface InvitationBlock<T extends BlockType = BlockType> {
  id: string
  type: T
  data: BlockDataMap[T]
  order: number
  visible: boolean
  style?: BlockStyle
  metadata?: BlockMetadata
}

export interface GlobalSettings {
  colorPrimary: string
  colorSecondary: string
  colorAccent: string
  fontFamily: FontFamily
  backgroundImage?: string
  logo?: string
  backgroundMusic?: string
  backgroundMusicAutoplay?: boolean
  /** Image URL used as <link rel="icon"> in the public view. */
  favicon?: string
  /**
   * Google Fonts name (e.g. "Playfair Display"). When set, overrides the
   * built-in `fontFamily` choice. `headingFont` is used for h1/h2/h3
   * (font-serif slot); `bodyFont` is used for everything else.
   */
  headingFont?: string
  bodyFont?: string
  /** Optional CSS custom property weights for the loaded Google Fonts. */
  headingFontWeight?: string
  bodyFontWeight?: string
}

export interface Invitation {
  id: string
  kind?: InvitationKind
  title: string
  blocks: InvitationBlock[]
  globalSettings: GlobalSettings
  template?: string
  status: 'draft' | 'published' | 'archived'
  createdAt: string
  updatedAt: string
  sharedLink?: string
  publicSlug?: string
}

export type ViewportMode = 'mobile' | 'tablet' | 'desktop'

export interface BlockTypeInfo {
  type: BlockType
  label: string
  description: string
  icon: string
}
