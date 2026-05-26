import { useEffect } from 'react'
import type { PageBackground } from '../../types/invitation.types'
import {
  backgroundPositionStyle,
  backgroundSizeStyle,
  resolveBackgroundSource,
} from '../../utils/pageBackground'

/**
 * Full-viewport background sitting behind every block on the public view.
 * Renders an image (via background-image) or a muted/loop video (file,
 * YouTube, or Vimeo). The overlay sits between the background and the
 * page content so it never tints the canvas card itself.
 */
export function PageBackgroundLayer({ bg }: { bg?: PageBackground }) {
  const source = resolveBackgroundSource(bg)
  const active = source.kind !== 'empty'

  // When a page background is in play we need html/body/#root to be
  // transparent — `index.css` paints them all with `background: #fafafa` which
  // would otherwise sit on top of the layer's negative-z stack and hide it
  // (the fixed-positioned layer escapes parent stacking contexts so a wrapper
  // `isolation: isolate` cannot save us here). Toggling a body class lets a
  // plain CSS rule clear those backgrounds for the duration of the visit.
  useEffect(() => {
    if (!active || typeof document === 'undefined') return
    document.body.classList.add('has-page-background')
    return () => {
      document.body.classList.remove('has-page-background')
    }
  }, [active])

  if (!active) return null

  const opacity = clamp((bg?.opacity ?? 100) / 100, 0, 1)
  const blur = clamp(bg?.blur ?? 0, 0, 30)
  const attachment = bg?.attachment ?? 'fixed'
  const overlayColor = bg?.overlayColor || '#000000'
  const overlayAlpha = clamp((bg?.overlayOpacity ?? 0) / 100, 0, 1)

  // Both layers use the same positioning so the overlay always matches the
  // background. `fixed` covers the viewport; `scroll` covers the document
  // so it scrolls with the content.
  const positionClass = attachment === 'fixed' ? 'fixed' : 'absolute'

  const filter = blur > 0 ? `blur(${blur}px)` : undefined

  return (
    <>
      <div
        aria-hidden
        className={`${positionClass} inset-0 -z-20 pointer-events-none`}
        style={{ opacity, filter }}
      >
        {source.kind === 'image' && (
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `url("${source.url}")`,
              backgroundSize: backgroundSizeStyle(bg?.fit),
              backgroundRepeat: bg?.fit === 'tile' ? 'repeat' : 'no-repeat',
              backgroundPosition: backgroundPositionStyle(bg?.position),
            }}
          />
        )}
        {source.kind === 'video-file' && (
          <video
            className="h-full w-full"
            style={{ objectFit: bg?.fit === 'contain' ? 'contain' : 'cover' }}
            src={source.url}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        )}
        {(source.kind === 'youtube' || source.kind === 'vimeo') && (
          <div className="relative h-full w-full overflow-hidden">
            {/* The iframe is scaled to always cover the viewport regardless of
             *  its 16:9 native aspect, while staying centered. */}
            <iframe
              title="Fondo"
              src={source.embedUrl}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen={false}
              tabIndex={-1}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                width: 'max(100vw, 177.78vh)',
                height: 'max(56.25vw, 100vh)',
                border: 0,
              }}
            />
          </div>
        )}
      </div>
      {overlayAlpha > 0 && (
        <div
          aria-hidden
          className={`${positionClass} inset-0 -z-10 pointer-events-none`}
          style={{ backgroundColor: overlayColor, opacity: overlayAlpha }}
        />
      )}
    </>
  )
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}
