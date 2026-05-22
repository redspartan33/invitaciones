export type BlockType =
  | 'hero'
  | 'event-details'
  | 'timeline'
  | 'dress-code'
  | 'gift-registry'
  | 'rsvp-info'
  | 'footer'
  | 'gallery'

export type FontFamily = 'serif' | 'sans-serif' | 'script'

export type Alignment = 'left' | 'center' | 'right'

export interface BlockMetadata {
  createdAt: string
  lastEdited: string
}

export interface BlockStyle {
  backgroundColor?: string
  textColor?: string
  paddingY?: 'sm' | 'md' | 'lg' | 'xl'
  textSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
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

export type BlockDataMap = {
  hero: HeroData
  'event-details': EventDetailsData
  timeline: TimelineData
  'dress-code': DressCodeData
  'gift-registry': GiftRegistryData
  'rsvp-info': RsvpInfoData
  footer: FooterData
  gallery: GalleryData
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
}

export interface Invitation {
  id: string
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
