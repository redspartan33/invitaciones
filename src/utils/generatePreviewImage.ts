import type { Invitation, MenuHeaderData, HeroData } from '../types/invitation.types'
import { apiUrl } from './apiBase'

// 1.91:1 — the aspect ratio every major social platform (WhatsApp, iMessage,
// Facebook, Twitter, LinkedIn) uses for og:image previews. 1200×630 keeps text
// crisp on retina link cards without being heavy.
const W = 1200
const H = 630

const ASSETS_ENDPOINT = apiUrl('/api/assets')

interface HeaderContent {
  title: string
  subtitle: string
  /** Hex color used as the card background. */
  background: string
  /** Hex color used for text. Chosen for contrast against background. */
  foreground: string
  /** Optional accent color used for the subtitle and decorative line. */
  accent: string
}

/** Read the most preview-worthy text out of the invitation: prefer hero/
 *  menu-header for the title and their subtitle/tagline for the secondary
 *  line. Falls back to the document title. */
function extractHeaderContent(inv: Invitation): HeaderContent {
  const gs = inv.globalSettings
  const blocks = Array.isArray(inv.blocks) ? inv.blocks : []
  let title = inv.title || ''
  let subtitle = ''

  for (const b of blocks) {
    if (!b.visible) continue
    if (b.type === 'hero') {
      const d = b.data as HeroData
      if (d.showTitle !== false && d.title) title = d.title
      if (d.showSubtitle !== false && d.subtitle) subtitle = d.subtitle
      break
    }
    if (b.type === 'menu-header') {
      const d = b.data as MenuHeaderData
      if (d.showTitle !== false && d.title) title = d.title
      if (d.showTagline !== false && d.tagline) subtitle = d.tagline
      break
    }
  }

  if (!subtitle) {
    subtitle = inv.kind === 'menu' ? 'Menú digital' : 'Invitación'
  }

  // Prefer the secondary color as a card background — that's the same
  // color that frames the central canvas in the published view, so the
  // preview card feels visually consistent with the real invitation.
  const background = gs.colorSecondary || gs.colorPrimary || '#f5efe6'
  const accent = gs.colorAccent || gs.colorPrimary || '#9caf88'
  const foreground = pickContrastingForeground(background)

  return { title, subtitle, background, foreground, accent }
}

/** Returns '#1c1917' or '#ffffff' depending on perceived luminance of the
 *  background — gives readable text on either light or dark cards without
 *  the caller having to think about it. */
function pickContrastingForeground(hex: string): string {
  const m = /^#?([\da-f]{6}|[\da-f]{3})$/i.exec(hex.trim())
  if (!m) return '#1c1917'
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  // Relative luminance, sRGB approximation.
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#1c1917' : '#ffffff'
}

/** Wraps `text` to fit `maxWidth` at the current canvas font, returning the
 *  resulting visual lines. Capped at `maxLines` — overflow gets an ellipsis. */
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
      // Trim the last visible line and add an ellipsis so we don't drop
      // information silently.
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

/** Renders the OG card into a canvas and returns a `data:image/png;base64,…`. */
function renderHeaderCard(content: HeaderContent): string {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context not available')

  // Background
  ctx.fillStyle = content.background
  ctx.fillRect(0, 0, W, H)

  // Subtle vignette so the card has depth even on flat brand colors.
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.18)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, W, H)

  // Thin double border, ~60px inset, in the accent color at low alpha — gives
  // the card a wedding-stationery feel without depending on a frame asset.
  ctx.strokeStyle = withAlpha(content.accent, 0.55)
  ctx.lineWidth = 2
  ctx.strokeRect(60, 60, W - 120, H - 120)
  ctx.strokeStyle = withAlpha(content.accent, 0.35)
  ctx.lineWidth = 1
  ctx.strokeRect(72, 72, W - 144, H - 144)

  // Subtitle (eyebrow text)
  ctx.fillStyle = withAlpha(content.foreground, 0.78)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '600 28px Georgia, "Times New Roman", serif'
  const subtitleLines = wrapText(ctx, content.subtitle.toUpperCase(), W - 240, 1)
  let y = H / 2 - 140
  for (const line of subtitleLines) {
    // Letter-spaced look via per-char draw.
    drawSpacedLine(ctx, line, W / 2, y, 6)
    y += 44
  }

  // Decorative divider
  ctx.strokeStyle = content.accent
  ctx.lineWidth = 1.5
  const dividerY = H / 2 - 80
  ctx.beginPath()
  ctx.moveTo(W / 2 - 60, dividerY)
  ctx.lineTo(W / 2 + 60, dividerY)
  ctx.stroke()
  // Center diamond
  ctx.fillStyle = content.accent
  ctx.beginPath()
  ctx.moveTo(W / 2, dividerY - 5)
  ctx.lineTo(W / 2 + 5, dividerY)
  ctx.lineTo(W / 2, dividerY + 5)
  ctx.lineTo(W / 2 - 5, dividerY)
  ctx.closePath()
  ctx.fill()

  // Title — biggest type, serif, allow 2 lines.
  ctx.fillStyle = content.foreground
  ctx.font = '500 96px Georgia, "Times New Roman", serif'
  const titleLines = wrapText(ctx, content.title || 'Invitación', W - 240, 2)
  const lineHeight = 108
  const totalHeight = titleLines.length * lineHeight
  let ty = H / 2 + (titleLines.length === 1 ? 20 : -8)
  if (titleLines.length === 2) ty = H / 2 - lineHeight / 2 + 30
  // For single line we keep ty as is; for two lines start above center.
  let cursor = titleLines.length === 1 ? ty : H / 2 - totalHeight / 2 + lineHeight / 2 + 30
  for (const line of titleLines) {
    ctx.fillText(line, W / 2, cursor)
    cursor += lineHeight
  }

  return canvas.toDataURL('image/png', 0.92)
}

/** Draw a horizontally letter-spaced line by stepping through each char. */
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

/** Returns true if the invitation already has an image that the share
 *  endpoint would pick (mirror of server's pickShareImage logic). */
export function hasShareableImage(inv: Invitation): boolean {
  const gs = inv.globalSettings || {}
  if (gs.backgroundImage) return true
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
 * Generates and uploads a fallback share image when the invitation doesn't
 * carry one of its own. Returns the public asset URL, or null if generation
 * or upload failed. Never throws — share-image generation is a nice-to-have,
 * not a publish blocker.
 */
export async function ensureAutoPreviewImage(inv: Invitation): Promise<string | null> {
  // Don't bother if the user already has an image we'd prefer.
  if (hasShareableImage(inv)) return null

  let dataUri: string
  try {
    const content = extractHeaderContent(inv)
    dataUri = renderHeaderCard(content)
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
