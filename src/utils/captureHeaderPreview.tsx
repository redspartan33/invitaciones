import { createRoot, type Root } from 'react-dom/client'
import { toPng } from 'html-to-image'
import type {
  Invitation,
  InvitationBlock,
  MenuSectionData,
} from '../types/invitation.types'
import { HeroBlock } from '../components/blocks/HeroBlock'
import { MenuHeaderBlock } from '../components/blocks/MenuHeaderBlock'
import { BlockBackgroundProvider } from '../components/blocks/BlockBackgroundContext'
import { PageBackgroundLayer } from '../components/public/PageBackgroundLayer'
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
function PreviewCard({ invitation }: { invitation: Invitation }) {
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
    const imgs = d.images as Array<{ url?: string }> | undefined
    if (Array.isArray(imgs) && imgs[0]?.url) return true
  }
  return false
}
