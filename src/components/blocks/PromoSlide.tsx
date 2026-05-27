import type { PromoBannerSlide } from '../../types/invitation.types'

/**
 * One promo slide rendered as a full-width card. Used inside the
 * MenuHeaderBlock carousel — the header itself is slide 0, these are
 * slides 1+. The card stretches to fill its parent so every slide in
 * the carousel has the same height (the header's height).
 */
export function PromoSlideCard({ slide }: { slide: PromoBannerSlide }) {
  const bg = slide.backgroundColor || '#0b3d2e'
  const text = slide.textColor || '#ffffff'
  const hasImage = !!slide.image
  const slideStyle: React.CSSProperties = hasImage
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.30), rgba(0,0,0,0.45)), url(${slide.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: text,
      }
    : { backgroundColor: bg, color: text }
  const hasContent = slide.title || slide.subtitle || slide.ctaLabel

  const inner = (
    <div
      className="flex h-full w-full flex-col items-center justify-center px-6 py-12 text-center"
      style={slideStyle}
    >
      {hasContent && (
        <>
          {slide.title && (
            <h2 className="font-serif text-3xl font-medium tracking-wide md:text-5xl">
              {slide.title}
            </h2>
          )}
          {slide.subtitle && (
            <p className="mt-3 max-w-md text-sm uppercase tracking-[0.25em] opacity-90 md:text-base">
              {slide.subtitle}
            </p>
          )}
          {slide.ctaLabel && (
            <span className="mt-5 inline-block rounded-full bg-white/95 px-5 py-2 text-xs font-medium uppercase tracking-widest text-ink-900">
              {slide.ctaLabel}
            </span>
          )}
        </>
      )}
    </div>
  )

  if (slide.ctaLink) {
    return (
      <a
        href={slide.ctaLink}
        target={/^https?:\/\//.test(slide.ctaLink) ? '_blank' : undefined}
        rel="noreferrer"
        data-track="promo-cta"
        data-track-target={slide.title || slide.ctaLabel || slide.id}
        className="block h-full w-full"
      >
        {inner}
      </a>
    )
  }
  return inner
}
