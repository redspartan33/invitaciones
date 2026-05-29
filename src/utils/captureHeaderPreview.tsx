import { createRoot, type Root } from 'react-dom/client'
import { toPng } from 'html-to-image'
import type {
  Invitation,
  InvitationBlock,
  MenuSectionData,
} from '../types/invitation.types'
import { CANVAS_ASPECTS, CANVAS_DESIGN_WIDTH } from '../types/invitation.types'
import { HeroBlock } from '../components/blocks/HeroBlock'
import { MenuHeaderBlock } from '../components/blocks/MenuHeaderBlock'
import { BlockBackgroundProvider } from '../components/blocks/BlockBackgroundContext'
import { PageBackgroundLayer } from '../components/public/PageBackgroundLayer'
import { FreeElementContent } from '../components/blocks/FreeElementContent'
import { defaultLayoutFor } from './blockDefaults'
import { menuSectionAnchor } from './menuNav'
import { detectBackgroundKind } from './pageBackground'
import { apiUrl } from './apiBase'

// 1.91:1 — the aspect every major social platform (WhatsApp, iMessage,
// Facebook, Twitter, LinkedIn) crops og:images to.
const W = 1200
const H = 630

const ASSETS_ENDPOINT = apiUrl('/api/assets')

/** Renders the published header into a fixed-size frame. The output is what
 *  the public visitor sees above the fold — same fonts, same colors, same
 *  page background, same overlays. */
/**
 * Free fixed-canvas invitations have no hero/menu-header block — they're a
 * Canva-style card of freely positioned elements. Render the card directly at
 * the pixel dimensions that fit inside the 1200×630 OG frame (no CSS
 * `transform: scale`, which html-to-image silently miscaptures inside its
 * foreignObject pipeline). Children use percentages of the sized container so
 * the layout scales naturally with the chosen card dimensions.
 */
function FixedCanvasPreviewCard({ invitation }: { invitation: Invitation }) {
  const gs = invitation.globalSettings
  const bg = gs.colorSecondary || '#ffffff'
  const aspect = invitation.canvasAspect ?? '4:5'
  const ratio = CANVAS_ASPECTS[aspect]?.ratio ?? CANVAS_ASPECTS['4:5'].ratio

  // Fit the card inside the 1200×630 frame, leaving a small margin. The card
  // keeps its authored aspect ratio; the frame is filled with the secondary
  // brand color around it.
  const margin = 0.94
  let cardW: number
  let cardH: number
  if (W / H > ratio) {
    // Frame is wider than the card — height-constrain.
    cardH = H * margin
    cardW = cardH * ratio
  } else {
    cardW = W * margin
    cardH = cardW / ratio
  }
  // The percentage-positioned children expect their parent to be exactly the
  // logical design width so px-based font sizes scale proportionally. We
  // approximate that by scaling px-fields linearly when the rendered card is
  // smaller than the design width.
  const sizeScale = cardW / CANVAS_DESIGN_WIDTH

  const fontClass =
    gs.fontFamily === 'serif'
      ? 'font-serif'
      : gs.fontFamily === 'script'
      ? 'font-script'
      : 'font-sans'
  const headingFont = gs.headingFont?.trim()
  const bodyFont = gs.bodyFont?.trim()

  const blocks = (Array.isArray(invitation.blocks) ? invitation.blocks : [])
    .filter((b) => b.visible)
    .sort((a, b) => (a.layout?.zIndex ?? 0) - (b.layout?.zIndex ?? 0))

  const cssVars = {
    ['--color-accent' as never]: gs.colorAccent,
    ['--color-primary' as never]: gs.colorPrimary,
    ['--color-secondary' as never]: gs.colorSecondary,
    ['--font-heading' as never]: headingFont ? `"${headingFont}"` : undefined,
    ['--font-body' as never]: bodyFont ? `"${bodyFont}"` : undefined,
    fontFamily: bodyFont ? `"${bodyFont}", sans-serif` : undefined,
    width: W,
    height: H,
    overflow: 'hidden',
    position: 'relative',
    background: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties

  return (
    <div className={`invitation-canvas ${fontClass}`} style={cssVars}>
      <div
        style={{
          width: `${Math.round(cardW)}px`,
          height: `${Math.round(cardH)}px`,
          position: 'relative',
          overflow: 'hidden',
          background: bg,
        }}
      >
        {blocks.map((block) => {
          const l = block.layout ?? defaultLayoutFor(block.type)
          return (
            <div
              key={block.id}
              style={{
                position: 'absolute',
                left: `${l.xPct}%`,
                top: `${l.yPct}%`,
                width: `${l.wPct}%`,
                height: `${l.hPct}%`,
                transform: `rotate(${l.rotation ?? 0}deg)`,
                transformOrigin: 'center center',
                zIndex: l.zIndex ?? 0,
              }}
            >
              <ScaledFreeElement block={block} sizeScale={sizeScale} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Renders a free element scaling its px-based fields (font size, radius,
 *  stroke width) to match the rendered card width. Without this a text element
 *  authored at 84px inside a 1080-wide design renders as 84px inside a
 *  474-wide capture — way too large. */
function ScaledFreeElement({
  block,
  sizeScale,
}: {
  block: InvitationBlock
  sizeScale: number
}) {
  let scaled = block
  if (block.type === 'text') {
    const t = block as InvitationBlock<'text'>
    scaled = {
      ...t,
      data: {
        ...t.data,
        fontSize: t.data.fontSize ? Math.max(1, t.data.fontSize * sizeScale) : undefined,
        letterSpacing: t.data.letterSpacing,
      },
    } as InvitationBlock
  } else if (block.type === 'image') {
    const i = block as InvitationBlock<'image'>
    scaled = {
      ...i,
      data: {
        ...i.data,
        radius: i.data.radius ? Math.max(0, i.data.radius * sizeScale) : i.data.radius,
      },
    } as InvitationBlock
  } else if (block.type === 'shape') {
    const s = block as InvitationBlock<'shape'>
    scaled = {
      ...s,
      data: {
        ...s.data,
        radius: s.data.radius ? Math.max(0, s.data.radius * sizeScale) : s.data.radius,
        strokeWidth: s.data.strokeWidth ? Math.max(0, s.data.strokeWidth * sizeScale) : s.data.strokeWidth,
      },
    } as InvitationBlock
  }
  return <FreeElementContent block={scaled} />
}

function PreviewCard({ invitation }: { invitation: Invitation }) {
  // Free-canvas invitations have no hero/menu-header — render the whole card.
  if (invitation.layoutMode === 'fixed-canvas' && invitation.kind !== 'menu') {
    return <FixedCanvasPreviewCard invitation={invitation} />
  }

  const gs = invitation.globalSettings
  const hasPageBackground = !!gs.pageBackground?.url?.trim()
  // Same defaults as PublicInvitationView so the captured DOM matches what
  // the visitor will actually see.
  const canvasTransparent = hasPageBackground && gs.transparentCanvas !== false
  const suppressBlockBackgrounds =
    hasPageBackground && gs.hideBlockBackgrounds !== false

  const fontClass =
    gs.fontFamily === 'serif'
      ? 'font-serif'
      : gs.fontFamily === 'script'
      ? 'font-script'
      : 'font-sans'
  const headingFont = gs.headingFont?.trim()
  const bodyFont = gs.bodyFont?.trim()

  const blocks = Array.isArray(invitation.blocks) ? invitation.blocks : []
  const headerBlock = blocks.find(
    (b) => b.type === 'menu-header' || b.type === 'hero',
  )

  // Pre-compute the section list ourselves so MenuHeaderBlock doesn't have to
  // reach into the editor store (which may not match this snapshot).
  const sections = blocks
    .filter((b) => b.type === 'menu-section' && b.visible)
    .sort((a, b) => a.order - b.order)
    .map((b) => {
      const d = b.data as MenuSectionData
      return {
        id: menuSectionAnchor(b.id, d.title, d.customAnchor),
        title: d.title || 'Sección',
      }
    })

  const cssVars = {
    ['--color-accent' as never]: gs.colorAccent,
    ['--color-primary' as never]: gs.colorPrimary,
    ['--color-secondary' as never]: gs.colorSecondary,
    ['--font-heading' as never]: headingFont ? `"${headingFont}"` : undefined,
    ['--font-body' as never]: bodyFont ? `"${bodyFont}"` : undefined,
    fontFamily: bodyFont ? `"${bodyFont}", sans-serif` : undefined,
    width: W,
    height: H,
    overflow: 'hidden',
    position: 'relative',
    isolation: 'isolate',
    // Same background-color logic as the actual canvas card:
    // transparent when a page bg is active (so it shows through), otherwise
    // the user's secondary brand color.
    backgroundColor: canvasTransparent
      ? 'transparent'
      : (gs.colorSecondary || '#ffffff'),
  } as React.CSSProperties

  return (
    <div className={`invitation-canvas ${fontClass}`} style={cssVars}>
      {hasPageBackground && (
        // Force `scroll` attachment so the layer sits inside this offscreen
        // container instead of escaping to the viewport (which would make it
        // invisible to html-to-image).
        <PageBackgroundLayer
          bg={{ ...(gs.pageBackground as NonNullable<typeof gs.pageBackground>), attachment: 'scroll' }}
        />
      )}
      <BlockBackgroundProvider suppress={suppressBlockBackgrounds}>
        <div className="relative flex h-full w-full flex-col justify-center">
          {headerBlock?.type === 'hero' && (
            <HeroBlock block={headerBlock as InvitationBlock<'hero'>} />
          )}
          {headerBlock?.type === 'menu-header' && (
            <MenuHeaderBlock
              block={headerBlock as InvitationBlock<'menu-header'>}
              sectionsOverride={sections}
              publicView={false}
            />
          )}
          {!headerBlock && (
            // No header block — fall back to just the invitation title so the
            // og:image isn't empty. Mirrors the hero typography so the look
            // stays consistent.
            <div className="px-6 text-center">
              <h1 className="font-serif text-7xl font-medium leading-tight">
                {invitation.title || 'Invitación'}
              </h1>
            </div>
          )}
        </div>
      </BlockBackgroundProvider>
    </div>
  )
}

/** Wait for fonts, images, and a couple of paint frames before capturing.
 *  Without this html-to-image often grabs the frame before web-fonts swap
 *  in and the share card ends up using the fallback font. */
async function waitForReady(node: HTMLElement): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* ignore */
    }
  }
  const imgs = Array.from(node.querySelectorAll('img'))
  await Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            const done = () => resolve()
            img.addEventListener('load', done, { once: true })
            img.addEventListener('error', done, { once: true })
            // Safety timeout so a hung image can't block publish forever.
            setTimeout(done, 4000)
          }),
    ),
  )
  // Two RAFs let the browser settle styles + background-image painting.
  await new Promise((r) => requestAnimationFrame(() => r(null)))
  await new Promise((r) => requestAnimationFrame(() => r(null)))
}

/**
 * Capture the actual rendered header DOM as a 1200×630 PNG and upload it.
 * The output is what a visitor would see above the fold — same fonts,
 * colors, padding, logo, background image, and page background overlay
 * as the editor designed. Returns the uploaded asset URL, or null on any
 * failure — share-image generation is a nice-to-have, not a blocker.
 */
export async function captureHeaderPreviewImage(
  inv: Invitation,
): Promise<string | null> {
  if (typeof document === 'undefined') return null

  // CRITICAL: we pin the host at (0,0) inside the viewport instead of
  // pushing it offscreen with `left: -10000px`. Chromium's foreignObject
  // serializer (which html-to-image uses under the hood) renders an
  // ENTIRELY transparent image when the source node is outside the
  // visible viewport — silently — so a far-offscreen host turns into a
  // blank PNG. We make it invisible to the user by stacking it BEHIND
  // every other element with `z-index: -1` plus disabling pointer events,
  // which keeps the layout box where html-to-image expects to find it.
  const host = document.createElement('div')
  host.setAttribute('data-role', 'preview-capture')
  host.style.cssText = [
    'position: fixed',
    'left: 0',
    'top: 0',
    `width: ${W}px`,
    `height: ${H}px`,
    'overflow: hidden',
    'pointer-events: none',
    'z-index: -1',
  ].join(';')
  document.body.appendChild(host)

  let root: Root | null = null
  let dataUri: string | null = null
  try {
    root = createRoot(host)
    root.render(<PreviewCard invitation={inv} />)
    await waitForReady(host)

    dataUri = await toPng(host, {
      width: W,
      height: H,
      pixelRatio: 1,
      cacheBust: true,
      // Quality cap keeps the resulting PNG well under the /api/assets size
      // limits (4 MB JSON body, 5 MB raw bytes) on busy cards with photos.
      quality: 0.92,
      // Critical: skip the library's "scrape every stylesheet on the page
      // and inline it as @font-face data URIs" pass. That pass hits a
      // CORS wall on the Google Fonts stylesheet (SecurityError: cannot
      // read cssRules) and then falls back to XHR fetches that can hang
      // the whole capture for 30+ seconds. We force this by passing
      // `fontEmbedCSS: ''` — the `!= null` check inside html-to-image
      // short-circuits to this empty string before it ever runs the
      // font-scraping pass, which is stronger than `skipFonts: true`
      // (skipFonts is only consulted on the secondary branch and we've
      // seen it fall through in practice). Fonts are already loaded
      // into the document at this point, so the rendered SVG inherits
      // them via the document's existing @font-face declarations.
      fontEmbedCSS: '',
      skipFonts: true,
    })
  } catch (e) {
    console.warn('[preview] DOM capture failed', e)
    dataUri = null
  } finally {
    if (root) {
      try {
        root.unmount()
      } catch {
        /* ignore */
      }
    }
    host.remove()
  }

  if (!dataUri) return null

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

/**
 * Build a guaranteed share image from the invitation's text/colors, with no
 * DOM rendering or font loading. Used as a last-resort fallback when
 * html-to-image fails (e.g. tainted canvas from cross-origin images, CSS the
 * library can't serialize, or the foreignObject pipeline silently producing a
 * blank PNG). An SVG data URI always renders inline previews on WhatsApp /
 * iMessage / Facebook / Twitter even when the rich capture path falls over,
 * so the share card is never empty for a published invitation.
 */
function buildFallbackShareSvg(inv: Invitation): string {
  const gs = inv.globalSettings || ({} as Invitation['globalSettings'])
  const bg = gs.colorSecondary || '#ffffff'
  const accent = gs.colorAccent || '#b08968'
  const ink = gs.colorPrimary || '#18181b'
  // Headline: prefer the hero title for stacked invitations, the first text
  // element for fixed-canvas, or the invitation's own title.
  let headline = inv.title || 'Invitación'
  let subhead = ''
  const hero = inv.blocks.find((b) => b.type === 'hero') as
    | InvitationBlock<'hero'>
    | undefined
  if (hero) {
    headline = hero.data.title || headline
    subhead = hero.data.subtitle || ''
  } else if (inv.layoutMode === 'fixed-canvas') {
    const firstText = inv.blocks.find((b) => b.type === 'text') as
      | InvitationBlock<'text'>
      | undefined
    if (firstText) headline = firstText.data.text || headline
    const secondText = inv.blocks
      .filter((b) => b.type === 'text')
      .slice(1)[0] as InvitationBlock<'text'> | undefined
    if (secondText) subhead = (secondText.data as { text?: string }).text || ''
  }
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const fontStack = '"Times New Roman", Georgia, serif'
  // Multi-line wrap by inserting <tspan> per word group when the headline is
  // long. We keep it simple — at most two lines for the headline.
  const lines = wrapHeadline(headline, 28)
  const headlineSvg = lines
    .map((line, i) => `<tspan x="600" dy="${i === 0 ? 0 : 110}">${esc(line)}</tspan>`)
    .join('')
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="${esc(bg)}"/>
  <rect x="80" y="80" width="${W - 160}" height="${H - 160}" fill="none" stroke="${esc(accent)}" stroke-width="3"/>
  <text x="600" y="${subhead ? 280 : 320}" text-anchor="middle" font-family='${fontStack}' font-size="92" fill="${esc(ink)}">
    ${headlineSvg}
  </text>
  ${subhead ? `<text x="600" y="${280 + lines.length * 110 + 60}" text-anchor="middle" font-family='${fontStack}' font-size="36" fill="${esc(ink)}" opacity="0.7">${esc(subhead.slice(0, 80))}</text>` : ''}
</svg>`
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

function wrapHeadline(text: string, maxCharsPerLine: number): string[] {
  const t = (text || '').trim()
  if (!t) return ['Invitación']
  if (t.length <= maxCharsPerLine) return [t.slice(0, 60)]
  const words = t.split(/\s+/)
  const out: string[] = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (next.length > maxCharsPerLine && line) {
      out.push(line)
      line = w
      if (out.length === 1) break // cap at 2 lines
    } else {
      line = next
    }
  }
  if (line) out.push(line)
  // Stop after 2 lines, with ellipsis if there's more.
  if (out.length === 2 && (out.join(' ').length < t.length)) {
    out[1] = out[1].slice(0, maxCharsPerLine - 1) + '…'
  }
  return out.slice(0, 2)
}

/**
 * Public capture entrypoint with a guaranteed fallback. Tries the rich DOM
 * capture first; if it fails or returns null, uploads the SVG fallback so the
 * share card is never empty.
 */
export async function captureShareImage(inv: Invitation): Promise<string | null> {
  const captured = await captureHeaderPreviewImage(inv)
  if (captured) return captured
  // Rich capture failed — generate and upload the deterministic SVG fallback.
  const dataUri = buildFallbackShareSvg(inv)
  const folder = `inv-${inv.publicSlug || inv.id}`.replace(/[^a-zA-Z0-9_-]/g, '')
  try {
    const res = await fetch(ASSETS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUri, folder }),
    })
    if (!res.ok) {
      console.warn('[preview-fallback] upload failed', res.status)
      // As an absolute last resort, return the data URI itself. WhatsApp /
      // Facebook generally won't fetch base64 og:image directly, but the
      // share endpoint still emits a valid <meta> so the link doesn't 4xx.
      return dataUri
    }
    const json = (await res.json()) as { url?: string }
    return typeof json.url === 'string' ? json.url : dataUri
  } catch (e) {
    console.warn('[preview-fallback] upload error', e)
    return dataUri
  }
}

/** Kept for the server-side `pickShareImage` heuristic — true when the
 *  invitation carries an image we could fall back to if capture fails. */
export function hasShareableImage(inv: Invitation): boolean {
  const gs = inv.globalSettings || ({} as Invitation['globalSettings'])
  if (gs.backgroundImage) return true
  if (
    gs.pageBackground?.url &&
    detectBackgroundKind(gs.pageBackground.url) === 'image'
  ) {
    return true
  }
  const blocks = Array.isArray(inv.blocks) ? inv.blocks : []
  for (const b of blocks) {
    const d = (b?.data ?? {}) as Record<string, unknown>
    const s = (b?.style ?? {}) as Record<string, unknown>
    if (typeof s.backgroundImage === 'string' && s.backgroundImage) return true
    if (typeof d.backgroundImage === 'string' && d.backgroundImage) return true
    if (typeof d.logo === 'string' && d.logo) return true
    if (typeof d.image === 'string' && d.image) return true
    // Free-canvas image element keeps its URL directly on data.url.
    if (b?.type === 'image' && typeof d.url === 'string' && d.url) return true
    const imgs = d.images as Array<{ url?: string }> | undefined
    if (Array.isArray(imgs) && imgs[0]?.url) return true
  }
  return false
}
