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
  | 'image-set'
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
  bold?: boolean
  italic?: boolean
}

export interface BlockStyle {
  backgroundColor?: string
  /** Optional background image URL (rendered with cover/center). Sits behind block content. */
  backgroundImage?: string
  textColor?: string
  paddingY?: 'sm' | 'md' | 'lg' | 'xl'
  paddingTop?: number
  paddingBottom?: number
  textSize?: TextSize
  // Per-element overrides keyed by field name (e.g. "title", "items.title").
  textStyles?: Record<string, TextElementStyle>
  /** Hide the decorative icons that some invitation blocks render in their cards. */
  hideIcons?: boolean
  /** Background image positioning when style.backgroundImage is set. */
  backgroundPosition?:
    | 'center'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
  /** Background sizing for style.backgroundImage. Defaults to 'cover'. */
  backgroundSize?: 'cover' | 'contain' | 'auto'
  /**
   * Vertical spacing between repeated/internal elements inside the block
   * (timeline items, gallery photos, gift registry stores, etc.). Mirrors the
   * existing per-block menu-section `itemSpacing` knob but applies to every
   * block.
   */
  itemSpacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Ordered list of visible text field names. Blocks that support reordering
   * (hero, event-details, dress-code, rsvp-info, footer, gift-registry,
   * menu-header) consult this array at render time so the on-canvas/published
   * order follows the order the user dragged into in the sidebar. Field
   * names absent from the array fall back to the block's default ordering.
   */
  fieldOrder?: string[]
  /**
   * Rounded-corner radius applied to the block container — also picked up
   * by the map iframe inside MapBlock so the map itself has rounded corners.
   */
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /**
   * Entry animation played when the block scrolls into view. Powered by
   * framer-motion's `whileInView`. Defaults to 'none' (no animation).
   */
  entryAnimation?: EntryAnimation
}

export type EntryAnimation =
  | 'none'
  // Fade
  | 'fade'
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'fade-up-big'
  | 'fade-down-big'
  // Slide
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  // Zoom
  | 'zoom-in'
  | 'zoom-out'
  | 'zoom-in-up'
  | 'zoom-in-down'
  | 'zoom-in-left'
  | 'zoom-in-right'
  // Blur
  | 'blur-in'
  | 'blur-up'
  | 'blur-zoom'
  // Flip 3D
  | 'flip-up'
  | 'flip-down'
  | 'flip-left'
  | 'flip-right'
  // Rotate
  | 'rotate-in'
  | 'rotate-in-up-left'
  | 'rotate-in-up-right'
  | 'rotate-in-down-left'
  | 'rotate-in-down-right'
  | 'swing'
  | 'roll-in'
  // Spring / bounce
  | 'bounce-in'
  | 'bounce-in-up'
  | 'bounce-in-down'
  | 'elastic-in'
  | 'jelly'
  // Cinematic / special
  | 'reveal-up'
  | 'reveal-down'
  | 'reveal-left'
  | 'reveal-right'
  | 'skew-in'
  | 'depth-in'

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
  /** Show or hide the date line. Defaults to true. */
  showDate?: boolean
  /** Show or hide the time line. Defaults to true. */
  showTime?: boolean
  /** Display the time in 12-hour (AM/PM) or 24-hour format. Defaults to '24h'. */
  timeFormat?: '12h' | '24h'
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

export interface ImageSetImage {
  id: string
  url: string
  caption?: string
}

export interface ImageSetData {
  title?: string
  /** 1 to 3 images. 1 = centered, 2 = two columns, 3 = three columns (both mobile and desktop). */
  images: ImageSetImage[]
  /** Aspect ratio for each image cell. Defaults to 'square'. */
  aspect?: 'square' | 'portrait' | 'landscape' | 'auto'
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
  /**
   * Override the auto-generated nav. When undefined or empty, the nav lists
   * every visible menu-section block automatically. When set, only these
   * items render — letting you hide auto entries, rename them, reorder, or
   * add custom ones that point to a section by its anchor.
   */
  navItems?: MenuNavItem[]
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
  /**
   * Optional custom anchor / DOM id for this section. When set, the section
   * is reachable at `#<customAnchor>` and a custom MenuHeader nav item can
   * target it. When empty, the anchor is auto-derived from the title.
   * The renderer slugifies it (lowercase, dashes, ASCII).
   */
  customAnchor?: string
}

/** A single entry in the menu-header sticky nav when the user overrides the
 *  default auto-generated list. */
export interface MenuNavItem {
  id: string
  /** Display label shown in the nav pill. */
  label: string
  /** Anchor id (without leading #) that this item links to. Matches a
   *  section's customAnchor or auto-derived anchor. */
  targetAnchor: string
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
  'image-set': ImageSetData
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
  /** Text shown in the browser tab (document.title). Falls back to invitation.title. */
  pageTitle?: string
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
  /**
   * Full-page background — sits behind every block on the public view.
   * Supports a pasted URL: image (jpg/png/webp), direct video file
   * (mp4/webm/mov), or a YouTube / Vimeo link (rendered as a muted,
   * looping iframe).
   */
  pageBackground?: PageBackground
  /** When true, the central canvas card becomes transparent so the page
   *  background shows through. When `pageBackground` is set and this is
   *  `undefined`, the canvas is treated as transparent by default so the
   *  background is visible without extra config. Set explicitly to `false`
   *  to keep the secondary-color card on top of the background. */
  transparentCanvas?: boolean
  /** When true, every block's own backgroundColor / backgroundImage is
   *  suppressed in render so the global pageBackground shows through. When
   *  `pageBackground` is set and this is `undefined`, blocks are hidden by
   *  default. Set explicitly to `false` to keep block backgrounds visible. */
  hideBlockBackgrounds?: boolean
  /**
   * Animated envelope intro played before the public invitation is shown.
   * When `enabled` is true, the public view first renders a centered closed
   * envelope; tapping it (or auto-play after a short delay) opens the flap
   * and the card slides out before handing off to the real invitation.
   */
  envelopeIntro?: EnvelopeIntroConfig
  /**
   * Auto-generated share image (1200×630 PNG) rendered from the header
   * content at publish time. Used as the og:image when the invitation
   * doesn't carry any uploaded image. Lives next to the user-controlled
   * `favicon`/`pageBackground` because it's a page-level asset, not a
   * per-block one.
   */
  autoPreviewImage?: string
  /**
   * Public metrics dashboard slug (menus only). When set, a shareable
   * link `?metrics=<slug>` shows aggregate stats for the menu. The slug
   * is independent from `publicSlug` so it can be revoked without
   * breaking the public menu link, and isn't enumerable from it.
   */
  metricsSlug?: string
  /** Whether the metrics dashboard is enabled (drives the toggle UI). */
  enableMetrics?: boolean
}

export interface EnvelopeIntroConfig {
  enabled: boolean
  /** Color of the envelope body + flap. Defaults to '#a3b88c' (sage). */
  envelopeColor?: string
  /** Color of the inside-of-flap lining shown after the flap opens. */
  liningColor?: string
  /** Backdrop color behind the envelope. Defaults to a soft neutral. */
  backgroundColor?: string
  /** Optional recipient name printed on the envelope front (e.g. "Arlenne González"). */
  recipientName?: string
  /** Optional short monogram/initials shown small above the recipient name. */
  monogram?: string
  /** Optional URL for the small preview image shown on the card peeking out. */
  cardPreviewImage?: string
  /** When true the flap shows a wax seal in the center of the envelope. */
  wax?: boolean
  /** Hex color of the wax seal. */
  waxColor?: string
  /** Label rendered under the closed envelope. Defaults to "Toca para abrir". */
  hintLabel?: string
  /** When true, the intro auto-opens after ~1.2s without requiring a tap. */
  autoOpen?: boolean
  /** When true, the intro bypasses the session storage guard so it is shown on every reload/visit. */
  alwaysShowOnReload?: boolean
}

export interface PageBackground {
  /** Pasted URL — image, direct video, YouTube or Vimeo. */
  url: string
  /** Override auto-detection. Defaults to 'auto'. */
  kind?: 'auto' | 'image' | 'video'
  /** How the background covers the viewport. Defaults to 'cover'. */
  fit?: 'cover' | 'contain' | 'tile' | 'auto'
  /** Same enum as BlockStyle.backgroundPosition. */
  position?:
    | 'center'
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
  /** 0–100. Defaults to 100. */
  opacity?: number
  /** Hex color for the overlay layer. Defaults to '#000000'. */
  overlayColor?: string
  /** 0–100. Defaults to 0 (no overlay). */
  overlayOpacity?: number
  /** Pixel blur applied to the background layer. 0–30. */
  blur?: number
  /** 'fixed' = parallax-like, stays on viewport; 'scroll' = scrolls with content. */
  attachment?: 'fixed' | 'scroll'
}

/** Supported language codes. 'es' is always the original/source language. */
export type Language = 'es' | 'en' | 'fr'

/**
 * Map of dot-delimited block path → translated text. Paths are produced by
 * the translation utility (e.g. "data.title", "data.items[0].name"). One
 * record per target language. The source language ('es') is never stored
 * here — it lives directly on the blocks.
 */
export type TranslationMap = Partial<Record<Language, Record<string, string>>>

/**
 * One season/version of a menu. Holds a full, independent block list.
 * When `invitation.menuVariants` is set, `invitation.blocks` is treated as
 * an editor-side mirror of the currently-edited variant. The public view
 * always reads blocks from the variant pointed at by `activeVariantId`
 * (defaulting to the first variant if absent).
 */
export interface MenuVariant {
  id: string
  label: string
  blocks: InvitationBlock[]
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
  /**
   * Languages the menu is offered in. 'es' (Spanish) is the source and is
   * always implicitly enabled. Add 'en' / 'fr' to surface language buttons
   * in the published header.
   */
  enabledLanguages?: Language[]
  /**
   * Per-language translated strings, keyed by block id then by field path.
   * Populated at publish time by the translation utility.
   */
  translations?: Record<string, TranslationMap>
  /**
   * Seasonal menu variants (only used when kind='menu'). When present, the
   * public view shows tabs to switch between them. `activeVariantId` is
   * the one shown by default; `editingVariantId` is the one whose blocks
   * are currently mirrored into `invitation.blocks` for editing.
   */
  menuVariants?: MenuVariant[]
  activeVariantId?: string
  editingVariantId?: string
}

export type ViewportMode = 'mobile' | 'tablet' | 'desktop'

export interface BlockTypeInfo {
  type: BlockType
  label: string
  description: string
  icon: string
}
