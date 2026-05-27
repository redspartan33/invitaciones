import type {
  HeroData,
  Invitation,
  InvitationBlock,
  MenuHeaderData,
} from '../types/invitation.types'
import { apiUrl } from './apiBase'
import { detectBackgroundKind } from './pageBackground'

// 1.91:1 — the aspect ratio every major social platform (WhatsApp, iMessage,
// Facebook, Twitter, LinkedIn) uses for og:image previews.
const W = 1200
const H = 630

const ASSETS_ENDPOINT = apiUrl('/api/assets')

interface HeaderSnapshot {
  title: string
  subtitle: string
  /** Optional third line (eventDate for hero, blank for menus). */
  eyebrowExtra: string
  /** Header background image (header.backgroundImage or global page bg). */
  backgroundImage: string | null
  /** Solid color shown behind the title when there is no image. */
  backgroundColor: string
  /** Optional logo URL drawn above the title (menus only, when configured). */
  logo: string | null
  /** Hex color used for text — picked from header settings or contrast rule. */
  foreground: string
  /** Hex color used for the accent line / divider. */
  accent: string
  /** How dark the scrim drawn over the background image should be.
   *  - Menu headers tint 0.45 (matches published MenuHeaderBlock).
   *  - Hero blocks render the image RAW (no overlay) so the preview also
   *    skips the scrim. The user picks contrasting text per element. */
  scrimAlpha: number
  /** True when this is a menu (drives layout: uppercase tagline above title,
   *  no decorative divider) vs. an invitation (eyebrow + divider + serif). */
  isMenu: boolean
  /** Text alignment from hero data; menus are always center. */
  alignment: 'left' | 'center' | 'right'
}

/** Walk the invitation looking for the header block and produce a snapshot
 *  describing how the published header is rendered. The auto OG card uses
 *  this so the share preview mirrors the actual header design. */
function snapshotHeader(inv: Invitation): HeaderSnapshot {
  const gs = inv.globalSettings ?? ({} as Invitation['globalSettings'])
  const blocks = Array.isArray(inv.blocks) ? inv.blocks : []
  const isMenu =
    inv.kind === 'menu' || blocks.some((b) => b.type.startsWith('menu-'))

  // Global page background contributes the bg image only when it's actually
  // an image (the user may have pasted a YouTube link). Videos can't be
  // captured into a static og:image, so we ignore them.
  const pageBg = gs.pageBackground
  const pageBgImage =
    pageBg?.url && detectBackgroundKind(pageBg.url) === 'image' ? pageBg.url : null

  let title = inv.title || ''
  let subtitle = ''
  let eyebrowExtra = ''
  let backgroundImage: string | null = null
  let backgroundColor = ''
  let logo: string | null = null
  let foreground = ''
  let alignment: HeaderSnapshot['alignment'] = 'center'
  // Default to a 0.45 dark scrim (menu behaviour). Hero overrides to 0
  // because the published HeroBlock draws the image with no overlay.
  let scrimAlpha = 0.45

  const heroBlock = blocks.find((b) => b.type === 'hero') as
    | InvitationBlock<'hero'>
    | undefined
  const menuHeaderBlock = blocks.find((b) => b.type === 'menu-header') as
    | InvitationBlock<'menu-header'>
    | undefined

  if (menuHeaderBlock) {
    const d = menuHeaderBlock.data as MenuHeaderData
    if (d.showTitle !== false && d.title) title = d.title
    if (d.showTagline !== false && d.tagline) subtitle = d.tagline
    if (d.showLogo !== false && d.logo) logo = d.logo
    backgroundImage = d.backgroundImage || pageBgImage
    // menu-header has a hard-coded green fallback (#0b3d2e) so we mirror it.
    backgroundColor = d.backgroundColor || '#0b3d2e'
    // The published header uses white text on the dark default; the per-block
    // text color overrides it when present. Honor that here too.
    foreground = menuHeaderBlock.style?.textColor || '#ffffff'
    scrimAlpha = 0.45
  } else if (heroBlock) {
    const d = heroBlock.data as HeroData
    if (d.showTitle !== false && d.title) title = d.title
    if (d.showSubtitle !== false && d.subtitle) subtitle = d.subtitle
    // Hero shows an event date as a third line below the title; we lift it
    // into the eyebrow slot above the title so the share card has all three
    // pieces of information visible without competing with the title weight.
    if (d.showDate !== false && d.eventDate) {
      eyebrowExtra = formatHeroDate(d.eventDate, d.dateFormat)
    }
    alignment = d.alignment ?? 'center'
    backgroundImage = d.backgroundImage || pageBgImage
    backgroundColor = d.backgroundColor || gs.colorSecondary || gs.colorPrimary || '#f5efe6'
    foreground = heroBlock.style?.textColor || ''
    // HeroBlock comment: "Render the bg image as-is: no dark overlay, no
    // forced text color." Match that so the share card looks like the hero.
    scrimAlpha = 0
  } else {
    // No header block at all — fall back to brand colors.
    backgroundImage = pageBgImage
    backgroundColor = gs.colorSecondary || gs.colorPrimary || '#f5efe6'
  }

  if (!subtitle) subtitle = isMenu ? 'Menú digital' : 'Invitación'
  // Pick a readable foreground when one wasn't set explicitly. When there
  // is an image AND we apply a dark scrim, white is safe. When the image
  // shows raw (hero), we can't predict legibility — bias toward white on
  // photos since most invitation hero images are mid-toned.
  if (!foreground) {
    if (backgroundImage) {
      foreground = '#ffffff'
    } else {
      foreground = pickContrastingForeground(backgroundColor)
    }
  }
  const accent = gs.colorAccent || gs.colorPrimary || '#c9a96e'

  return {
    title,
    subtitle,
    eyebrowExtra,
    backgroundImage,
    backgroundColor,
    logo,
    foreground,
    accent,
    scrimAlpha,
    isMenu,
    alignment,
  }
}

/** Light-weight clone of utils/blockValidation formatDate — kept inline so
 *  this util has zero extra imports beyond what it already pulls in. */
function formatHeroDate(iso: string, fmt: HeroData['dateFormat']): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const monthsEs = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const day = d.getDate()
  const month = d.getMonth()
  const year = d.getFullYear()
  if (fmt === 'DD/MM/YYYY') {
    return `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`
  }
  if (fmt === 'MMMM DD, YYYY') {
    return `${monthsEs[month]} ${day}, ${year}`
  }
  // Default: DD MMMM YYYY
  return `${day} ${monthsEs[month]} ${year}`
}

function pickContrastingForeground(hex: string): string {
  const m = /^#?([\da-f]{6}|[\da-f]{3})$/i.exec(hex.trim())
  if (!m) return '#1c1917'
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#1c1917' : '#ffffff'
}

function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([\da-f]{6}|[\da-f]{3})$/i.exec(hex.trim())
  if (!m) return `rgba(0,0,0,${alpha})`
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Promise wrapper around HTMLImageElement that respects CORS.
 *
 *  Important subtlety: when the editor already showed this same URL via a
 *  plain `<img src=>` earlier in the session, the browser cached the
 *  response WITHOUT a CORS marker — even if the server sends ACAO. A second
 *  request with `crossOrigin='anonymous'` then gets served from cache and
 *  the canvas becomes tainted on draw, which makes `toDataURL()` throw and
 *  silently kills publish-time preview generation. We side-step that by
 *  appending a unique query param so the browser issues a fresh request
 *  with CORS semantics. Failures are returned as null so the publish keeps
 *  going (the preview just won't include the image). */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.referrerPolicy = 'no-referrer'
    img.onload = () => resolve(img)
    img.onerror = (e) => {
      console.warn('[preview] image load failed (CORS or 404?):', url, e)
      resolve(null)
    }
    const sep = url.includes('?') ? '&' : '?'
    img.src = `${url}${sep}_ogcors=${Date.now()}`
  })
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current)
      current = word
      if (lines.length === maxLines - 1) break
    } else {
      current = next
    }
  }
  if (current) {
    if (lines.length >= maxLines) {
      let last = lines[maxLines - 1]
      while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 0) {
        last = last.slice(0, -1)
      }
      lines[maxLines - 1] = `${last}…`
    } else {
      lines.push(current)
    }
  }
  return lines.slice(0, maxLines)
}

function drawSpacedLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  spacing: number,
) {
  const chars = Array.from(text)
  const widths = chars.map((c) => ctx.measureText(c).width + spacing)
  const totalW = widths.reduce((a, b) => a + b, 0) - spacing
  let x = cx - totalW / 2
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], x + widths[i] / 2 - spacing / 2, cy)
    x += widths[i]
  }
}

/** Draws `img` into the canvas as a background that covers the full card
 *  (object-fit: cover semantics). */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const ir = img.naturalWidth / img.naturalHeight
  const dr = dw / dh
  let sx = 0
  let sy = 0
  let sw = img.naturalWidth
  let sh = img.naturalHeight
  if (ir > dr) {
    sw = img.naturalHeight * dr
    sx = (img.naturalWidth - sw) / 2
  } else if (ir < dr) {
    sh = img.naturalWidth / dr
    sy = (img.naturalHeight - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

async function renderHeaderCard(snapshot: HeaderSnapshot): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context not available')

  // 1) Base background — solid color, then image on top, then dark scrim.
  ctx.fillStyle = snapshot.backgroundColor
  ctx.fillRect(0, 0, W, H)

  if (snapshot.backgroundImage) {
    const img = await loadImage(snapshot.backgroundImage)
    if (img) {
      drawCover(ctx, img, 0, 0, W, H)
      // Apply the same scrim the published block uses (or no scrim at all
      // for heroes, which render the image raw). When skipping the scrim
      // we still nudge a tiny bottom-vignette so light text doesn't get
      // lost on a bright sky area.
      if (snapshot.scrimAlpha > 0) {
        ctx.fillStyle = `rgba(0,0,0,${snapshot.scrimAlpha})`
        ctx.fillRect(0, 0, W, H)
      } else if (snapshot.foreground.toLowerCase() === '#ffffff') {
        const grad = ctx.createLinearGradient(0, 0, 0, H)
        grad.addColorStop(0, 'rgba(0,0,0,0)')
        grad.addColorStop(0.5, 'rgba(0,0,0,0.08)')
        grad.addColorStop(1, 'rgba(0,0,0,0.35)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, W, H)
      }
    }
  } else {
    // Subtle vignette on flat color cards so they don't feel completely
    // empty in the share preview.
    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9)
    vignette.addColorStop(0, 'rgba(0,0,0,0)')
    vignette.addColorStop(1, 'rgba(0,0,0,0.18)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, W, H)
  }

  // 2) Inset double-line frame in the accent color — only on flat backgrounds.
  //    On a photo background the frame fights with the image, so we skip it.
  if (!snapshot.backgroundImage) {
    ctx.strokeStyle = withAlpha(snapshot.accent, 0.55)
    ctx.lineWidth = 2
    ctx.strokeRect(60, 60, W - 120, H - 120)
    ctx.strokeStyle = withAlpha(snapshot.accent, 0.35)
    ctx.lineWidth = 1
    ctx.strokeRect(72, 72, W - 144, H - 144)
  }

  // 3) Optional logo, centered above the title.
  let logoBottom = 0
  if (snapshot.logo) {
    const logoImg = await loadImage(snapshot.logo)
    if (logoImg) {
      const maxLogoH = 110
      const maxLogoW = 320
      const r = logoImg.naturalWidth / logoImg.naturalHeight
      let lh = maxLogoH
      let lw = lh * r
      if (lw > maxLogoW) {
        lw = maxLogoW
        lh = lw / r
      }
      const lx = (W - lw) / 2
      const ly = H / 2 - 200
      ctx.drawImage(logoImg, lx, ly, lw, lh)
      logoBottom = ly + lh
    }
  }

  // Alignment defaults to center; menus always render centered.
  const align = snapshot.alignment
  const textX =
    align === 'left' ? 120 : align === 'right' ? W - 120 : W / 2
  ctx.textAlign = align === 'center' ? 'center' : align
  ctx.textBaseline = 'middle'

  // 4) Subtitle / tagline. For menus we letter-space and uppercase it (same
  //    treatment the published header uses); for invitations it's a regular
  //    eyebrow line above the title.
  ctx.fillStyle = withAlpha(snapshot.foreground, 0.85)
  ctx.font = '600 28px Georgia, "Times New Roman", serif'
  const subtitleText = snapshot.isMenu
    ? snapshot.subtitle.toUpperCase()
    : snapshot.subtitle
  const subtitleLines = wrapText(ctx, subtitleText, W - 240, 1)
  const subtitleY = snapshot.logo
    ? Math.max(H / 2 - 80, logoBottom + 60)
    : H / 2 - 140
  for (const line of subtitleLines) {
    if (snapshot.isMenu && align === 'center') {
      drawSpacedLine(ctx, line, textX, subtitleY, 6)
    } else {
      ctx.fillText(line, textX, subtitleY)
    }
  }

  // 5) Decorative divider — only when there's no background image and no
  //    logo (logos already act as a visual anchor; on photo bgs the frame is
  //    skipped, so a divider would feel arbitrary).
  if (!snapshot.backgroundImage && !snapshot.logo) {
    const dividerY = subtitleY + 50
    ctx.strokeStyle = snapshot.accent
    ctx.lineWidth = 1.5
    if (align === 'center') {
      ctx.beginPath()
      ctx.moveTo(textX - 60, dividerY)
      ctx.lineTo(textX + 60, dividerY)
      ctx.stroke()
      ctx.fillStyle = snapshot.accent
      ctx.beginPath()
      ctx.moveTo(textX, dividerY - 5)
      ctx.lineTo(textX + 5, dividerY)
      ctx.lineTo(textX, dividerY + 5)
      ctx.lineTo(textX - 5, dividerY)
      ctx.closePath()
      ctx.fill()
    }
  }

  // 6) Title. Serif, max 2 lines, drop-shadow when sitting on a photo.
  ctx.fillStyle = snapshot.foreground
  ctx.font = '500 96px Georgia, "Times New Roman", serif'
  if (snapshot.backgroundImage) {
    ctx.shadowColor = 'rgba(0,0,0,0.45)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 2
  }
  const titleLines = wrapText(ctx, snapshot.title || 'Invitación', W - 240, 2)
  const lineHeight = 108
  // Sit the title block below the subtitle/divider area.
  const titleBlockTop = subtitleLines.length > 0 ? subtitleY + 90 : H / 2 - 40
  for (let i = 0; i < titleLines.length; i++) {
    ctx.fillText(titleLines[i], textX, titleBlockTop + i * lineHeight)
  }
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // 7) Optional third line — event date for invitations. Treated like a
  //    second eyebrow: uppercase, letter-spaced, sits a bit below the title.
  if (snapshot.eyebrowExtra) {
    ctx.fillStyle = withAlpha(snapshot.foreground, 0.85)
    ctx.font = '600 26px Georgia, "Times New Roman", serif'
    const extraY = titleBlockTop + titleLines.length * lineHeight + 24
    const upper = snapshot.eyebrowExtra.toUpperCase()
    if (align === 'center') {
      drawSpacedLine(ctx, upper, textX, extraY, 6)
    } else {
      ctx.fillText(upper, textX, extraY)
    }
  }

  try {
    return canvas.toDataURL('image/png', 0.92)
  } catch (e) {
    // Tainted canvas (CORS) or other browser limits — log and surface so
    // the caller can fall back gracefully.
    console.warn('[preview] toDataURL failed', e)
    throw e
  }
}

/** Mirror of the server's pickShareImage that also recognizes the global
 *  page background. Used to decide whether we need to generate a fallback
 *  card or whether a real image will be picked up. */
export function hasShareableImage(inv: Invitation): boolean {
  const gs = inv.globalSettings || ({} as Invitation['globalSettings'])
  if (gs.backgroundImage) return true
  // Treat the global page background as a "real" image too — when it's set
  // and resolves to an image (not a video link), the server picks it up.
  if (gs.pageBackground?.url && detectBackgroundKind(gs.pageBackground.url) === 'image') {
    return true
  }
  const blocks = Array.isArray(inv.blocks) ? inv.blocks : []
  for (const b of blocks) {
    if (b?.type === 'hero' && (b.data as HeroData)?.backgroundImage) return true
  }
  for (const b of blocks) {
    if (b?.type === 'menu-header') {
      const d = b.data as MenuHeaderData
      if (d?.backgroundImage) return true
      if (d?.logo) return true
    }
  }
  for (const b of blocks) {
    const d = (b?.data ?? {}) as Record<string, unknown>
    if (typeof d.backgroundImage === 'string') return true
    if (typeof d.image === 'string') return true
    const imgs = d.images as Array<{ url?: string }> | undefined
    if (Array.isArray(imgs) && imgs[0]?.url) return true
  }
  return false
}

/**
 * Always generate a styled share card based on the header content (image,
 * colors, logo, title, tagline). Returns the uploaded asset URL, or null on
 * any failure — share-image generation is a nice-to-have, not a blocker.
 *
 * We deliberately do NOT short-circuit on `hasShareableImage` here anymore:
 * a custom designed card that integrates the header image looks better as
 * an og:image than a raw photo, and the user complained that invitations
 * with only a global background didn't get a generated preview. The caller
 * decides whether to use this URL or prefer a different one.
 */
export async function ensureAutoPreviewImage(inv: Invitation): Promise<string | null> {
  let dataUri: string
  try {
    const snapshot = snapshotHeader(inv)
    dataUri = await renderHeaderCard(snapshot)
  } catch (e) {
    console.warn('[preview] could not render auto preview image', e)
    return null
  }

  const folder = `inv-${inv.publicSlug || inv.id}`.replace(/[^a-zA-Z0-9_-]/g, '')
  try {
    const res = await fetch(ASSETS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUri, folder }),
    })
    if (!res.ok) {
      console.warn('[preview] upload failed', res.status)
      return null
    }
    const json = (await res.json()) as { url?: string }
    return typeof json.url === 'string' ? json.url : null
  } catch (e) {
    console.warn('[preview] upload error', e)
    return null
  }
}
