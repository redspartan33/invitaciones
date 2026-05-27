import { useEffect, useMemo, useRef, useState } from 'react'
import type { PromoBannerConfig } from '../../types/invitation.types'
import { ArrowLeftIcon, ArrowRightIcon } from './icons'

const ASPECT_CLASS: Record<NonNullable<PromoBannerConfig['aspect']>, string> = {
  wide: 'aspect-[16/9]',
  banner: 'aspect-[3/1]',
  square: 'aspect-square',
}

export function PromoBannerCarousel({ config }: { config: PromoBannerConfig }) {
  const slides = useMemo(() => config.slides ?? [], [config.slides])
  const aspect = config.aspect ?? 'wide'
  const showDots = config.showDots !== false
  const autoplay = config.autoplay !== false
  const interval = Math.max(2, config.intervalSeconds ?? 5) * 1000

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const touchStartX = useRef<number | null>(null)
  const touchDeltaX = useRef(0)

  useEffect(() => {
    if (!autoplay || paused || slides.length <= 1) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, interval)
    return () => window.clearInterval(id)
  }, [autoplay, interval, paused, slides.length])

  // Keep index in range when the user removes a slide while editing.
  useEffect(() => {
    if (slides.length === 0) {
      if (index !== 0) setIndex(0)
      return
    }
    if (index >= slides.length) setIndex(slides.length - 1)
  }, [slides.length, index])

  if (slides.length === 0) {
    return (
      <div className="px-4 py-3">
        <div
          className={`${ASPECT_CLASS[aspect]} flex items-center justify-center rounded-lg border border-dashed border-ink-300 bg-ink-50 text-sm text-ink-500`}
        >
          Activa promos y añade slides desde Detalles
        </div>
      </div>
    )
  }

  const go = (i: number) => setIndex(((i % slides.length) + slides.length) % slides.length)
  const prev = () => go(index - 1)
  const next = () => go(index + 1)

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchDeltaX.current = 0
    setPaused(true)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current
  }
  const onTouchEnd = () => {
    const dx = touchDeltaX.current
    touchStartX.current = null
    touchDeltaX.current = 0
    setPaused(false)
    if (Math.abs(dx) < 40) return
    if (dx > 0) prev()
    else next()
  }

  return (
    <div
      className="relative px-4 py-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className={`relative overflow-hidden rounded-lg ${ASPECT_CLASS[aspect]}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s) => {
            const bg = s.backgroundColor || '#0b3d2e'
            const text = s.textColor || '#ffffff'
            const hasImage = !!s.image
            const slideStyle: React.CSSProperties = hasImage
              ? {
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.35)), url(${s.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  color: text,
                }
              : { backgroundColor: bg, color: text }
            const hasContent = s.title || s.subtitle || s.ctaLabel
            const inner = (
              <div className="h-full w-full" style={slideStyle}>
                {hasContent && (
                  <div className="flex h-full w-full flex-col items-start justify-end gap-2 p-5">
                    {s.title && (
                      <h3 className="font-serif text-2xl font-medium leading-tight">
                        {s.title}
                      </h3>
                    )}
                    {s.subtitle && (
                      <p className="text-sm opacity-90">{s.subtitle}</p>
                    )}
                    {s.ctaLabel && (
                      <span
                        className="mt-1 inline-block rounded-full bg-white/95 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-ink-900"
                      >
                        {s.ctaLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
            return (
              <div key={s.id} className="h-full w-full shrink-0">
                {s.ctaLink ? (
                  <a
                    href={s.ctaLink}
                    target={/^https?:\/\//.test(s.ctaLink) ? '_blank' : undefined}
                    rel="noreferrer"
                    data-track="promo-cta"
                    data-track-target={s.title || s.ctaLabel || s.id}
                    className="block h-full w-full"
                  >
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </div>
            )
          })}
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
            >
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {showDots && slides.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Ir al slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-ink-900' : 'w-1.5 bg-ink-300 hover:bg-ink-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
