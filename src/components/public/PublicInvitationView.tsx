import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  Invitation,
  InvitationBlock,
  Language,
  MenuSectionData,
  MenuVariant,
} from '../../types/invitation.types'
import { BlockRenderer } from '../blocks/BlockRenderer'
import { BlockBackgroundProvider } from '../blocks/BlockBackgroundContext'
import { MenuFeaturesProvider } from '../blocks/MenuFeaturesContext'
import { MenuHeaderBlock } from '../blocks/MenuHeaderBlock'
import { menuSectionAnchor } from '../../utils/menuNav'
import { usePageChrome } from '../../hooks/usePageChrome'
import { applyBlockTranslation } from '../../utils/translation'
import { EnvelopeIntro } from './EnvelopeIntro'
import { FixedCanvasView } from './FixedCanvasView'
import { recordInteraction, recordView, type InteractionAction } from '../../utils/viewTracking'

export function PublicInvitationView({ invitation }: { invitation: Invitation }) {
  const { globalSettings } = invitation
  usePageChrome({
    favicon: globalSettings.favicon,
    headingFont: globalSettings.headingFont,
    bodyFont: globalSettings.bodyFont,
    title: globalSettings.pageTitle?.trim() || invitation.title,
  })
  const fontClass =
    globalSettings.fontFamily === 'serif'
      ? 'font-serif'
      : globalSettings.fontFamily === 'script'
      ? 'font-script'
      : 'font-sans'
  const headingFont = globalSettings.headingFont?.trim()
  const bodyFont = globalSettings.bodyFont?.trim()

  // Resolve which blocks to render. When this invitation is a menu with
  // seasonal variants, blocks come from the currently-selected variant.
  const hasVariants = !!invitation.menuVariants && invitation.menuVariants.length > 0
  const variants = hasVariants ? invitation.menuVariants! : []
  const initialVariantId = hasVariants
    ? (variants.find((v) => v.id === invitation.activeVariantId)?.id ?? variants[0].id)
    : null
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(initialVariantId)
  const blocks = hasVariants
    ? (variants.find((v) => v.id === selectedVariantId)?.blocks ?? variants[0].blocks)
    : invitation.blocks

  const rawVisible = [...blocks].sort((a, b) => a.order - b.order).filter((b) => b.visible)
  const isMenu =
    invitation.kind === 'menu' || rawVisible.some((b) => b.type.startsWith('menu-'))

  // Language switcher: only on menus, only when ≥2 languages enabled.
  const languages = useMemo<Language[]>(() => {
    const list = invitation.enabledLanguages ?? ['es']
    return Array.from(new Set<Language>(['es', ...list]))
  }, [invitation.enabledLanguages])
  const showLanguageSwitcher = isMenu && languages.length > 1
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0] ?? 'es')

  // Apply translations to every block based on the selected language. Header
  // is also translated (title / tagline). When 'es' is selected we just
  // return the original blocks.
  const visible = useMemo(() => {
    if (currentLanguage === 'es' || !invitation.translations) return rawVisible
    return rawVisible.map((b) => applyBlockTranslation(b, currentLanguage, invitation.translations))
  }, [rawVisible, currentLanguage, invitation.translations])

  // Pre-compute the section list so the public sticky nav reflects exactly
  // what's about to render (without needing the editor store). Uses the
  // *translated* titles so the nav also switches language. customAnchor
  // (when set on a section) drives the anchor id so custom-nav links can
  // hit it.
  const menuSections = useMemo(() => {
    if (!isMenu) return []
    return visible
      .filter((b) => b.type === 'menu-section')
      .map((b) => {
        const d = b.data as MenuSectionData
        return {
          id: menuSectionAnchor(b.id, d.title, d.customAnchor),
          title: d.title || 'Sección',
        }
      })
  }, [visible, isMenu])

  const musicUrl = globalSettings.backgroundMusic && /^https?:\/\//i.test(globalSettings.backgroundMusic)
    ? globalSettings.backgroundMusic
    : ''
  const autoplay = !!globalSettings.backgroundMusicAutoplay

  // Fire one view event per session for the metrics dashboard. We pass the
  // selected variant so we can see which season visitors actually land on.
  // Guarded by `publicSlug` so the editor (which doesn't have one) never
  // pollutes the visit log.
  useEffect(() => {
    if (!invitation.publicSlug) return
    recordView(invitation.publicSlug, { variantId: selectedVariantId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitation.publicSlug])

  // Delegated click tracker. One listener on the published view captures
  // meaningful interactions without each block having to know about
  // analytics. We classify the click target by:
  //   1. anchors with tel: / mailto: / wa.me / map links → typed action
  //   2. anchors to external http(s) hosts → 'link-click-external'
  //   3. internal #section-anchor clicks → 'section-nav' (e.g. menu nav)
  //   4. data-track attributes when we want to be explicit (gift store,
  //      RSVP button, social links — set inline at the block level when
  //      automatic classification isn't precise enough).
  // We deliberately do NOT log every click on the page — too noisy and a
  // privacy concern. The classifier returns null when there's nothing
  // worth recording.
  const slug = invitation.publicSlug
  useEffect(() => {
    if (!slug) return
    const onClick = (e: MouseEvent) => {
      // Walk up from the actual target until we hit something we recognize.
      const path = e.composedPath ? e.composedPath() : []
      let anchor: HTMLAnchorElement | null = null
      let trackedEl: HTMLElement | null = null
      for (const node of path) {
        if (!(node instanceof HTMLElement)) continue
        if (!trackedEl && node.dataset && node.dataset.track) trackedEl = node
        if (!anchor && node.tagName === 'A') anchor = node as HTMLAnchorElement
        if (anchor && trackedEl) break
      }
      // Explicit data-track wins — it's the block author's intent.
      if (trackedEl?.dataset.track) {
        const action = trackedEl.dataset.track as InteractionAction
        const target = trackedEl.dataset.trackTarget || trackedEl.textContent?.trim().slice(0, 80) || ''
        recordInteraction(slug, action, target, { variantId: selectedVariantId })
        return
      }
      if (!anchor) return
      const href = anchor.getAttribute('href') || ''
      const action = classifyAnchor(href)
      if (!action) return
      const target = computeAnchorTarget(href, action)
      recordInteraction(slug, action, target, { variantId: selectedVariantId })
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [slug, selectedVariantId])

  const hasPageBackground = !!globalSettings.pageBackground?.url?.trim()
  // When the user adds a page background we assume they want to see it: the
  // central canvas card defaults to transparent and block backgrounds default
  // to hidden. Setting either toggle explicitly to `false` opts back into the
  // legacy behaviour.
  const canvasTransparent =
    hasPageBackground && globalSettings.transparentCanvas !== false
  const canvasBg = canvasTransparent ? 'transparent' : 'var(--color-secondary)'
  const suppressBlockBackgrounds =
    hasPageBackground && globalSettings.hideBlockBackgrounds !== false

  const showSeasonTabs = hasVariants && variants.length > 1
  const firstNonHeaderIdx = visible.findIndex((b) => b.type !== 'menu-header')
  const isFixedCanvas = invitation.layoutMode === 'fixed-canvas' && !isMenu

  // Envelope intro overlay — only on invitations (not menus), only when
  // enabled, and only once per browser session.
  const introCfg = globalSettings.envelopeIntro
  const introEnabled = !!introCfg?.enabled && !isMenu
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (!introEnabled) return false
    if (typeof window === 'undefined') return false
    if (introCfg?.alwaysShowOnReload) return true
    try {
      const seenKey = `envelope-intro:${invitation.id}`
      return sessionStorage.getItem(seenKey) !== '1'
    } catch {
      return true
    }
  })

  const dismissIntro = () => {
    try {
      sessionStorage.setItem(`envelope-intro:${invitation.id}`, '1')
    } catch {
      /* sessionStorage unavailable — fine, just close */
    }
    setShowIntro(false)
  }

  return (
    <div
      className={`invitation-canvas relative min-h-screen w-full ${fontClass}`}
      style={
        {
          ['--color-accent' as never]: globalSettings.colorAccent,
          ['--color-primary' as never]: globalSettings.colorPrimary,
          ['--color-secondary' as never]: globalSettings.colorSecondary,
          ['--font-heading' as never]: headingFont ? `"${headingFont}"` : undefined,
          ['--font-body' as never]: bodyFont ? `"${bodyFont}"` : undefined,
          fontFamily: bodyFont ? `"${bodyFont}", sans-serif` : undefined,
          // When a page background is active the outer wrapper must be fully
          // transparent so the background layer (rendered at root level, outside
          // every stacking context) is visible beneath the canvas card.
          // Inline styles win over the .invitation-canvas CSS class rule.
          backgroundColor: hasPageBackground ? 'transparent' : undefined,
        } as React.CSSProperties
      }
    >
      <BlockBackgroundProvider suppress={suppressBlockBackgrounds}>
        <MenuFeaturesProvider
          enableSearch={isMenu && !!globalSettings.enableMenuSearch}
          showItemImages={isMenu && !!globalSettings.enableItemImages}
          promoBanner={isMenu ? globalSettings.promoBanner : undefined}
        >
        {isFixedCanvas ? (
          <div className="mx-auto max-w-[920px] px-3 py-6 md:py-10">
            <FixedCanvasView invitation={invitation} />
          </div>
        ) : (
        <div
          className="relative mx-auto max-w-[920px] border-x border-black/5"
          style={{ background: canvasBg }}
        >
          {showSeasonTabs && firstNonHeaderIdx === -1 && (
            <SeasonTabs variants={variants} selectedId={selectedVariantId} onSelect={(id) => {
                if (slug) recordInteraction(slug, 'variant-switch', id, { variantId: id })
                setSelectedVariantId(id)
              }} />
          )}
          {visible.map((block, idx) => (
            <div key={block.id}>
              {showSeasonTabs && idx === firstNonHeaderIdx && (
                <SeasonTabs variants={variants} selectedId={selectedVariantId} onSelect={(id) => {
                if (slug) recordInteraction(slug, 'variant-switch', id, { variantId: id })
                setSelectedVariantId(id)
              }} />
              )}
              {block.type === 'menu-header' ? (
                <MenuHeaderBlock
                  block={block as InvitationBlock<'menu-header'>}
                  sectionsOverride={menuSections}
                  publicView
                  languages={showLanguageSwitcher ? languages : undefined}
                  currentLanguage={currentLanguage}
                  onLanguageChange={(lang) => {
                    if (slug) recordInteraction(slug, 'language-switch', lang, { variantId: selectedVariantId })
                    setCurrentLanguage(lang)
                  }}
                />
              ) : (
                <BlockRenderer block={block} />
              )}
            </div>
          ))}
        </div>
        )}
        </MenuFeaturesProvider>
      </BlockBackgroundProvider>
      {musicUrl && !isMenu && <MusicPlayer src={musicUrl} autoplay={autoplay} />}
      {introEnabled && showIntro && introCfg && (
        <EnvelopeIntro config={introCfg} onDone={dismissIntro} invitation={invitation} />
      )}
    </div>
  )
}

function SeasonTabs({
  variants,
  selectedId,
  onSelect,
}: {
  variants: MenuVariant[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="sticky top-0 z-30 flex justify-center border-y border-black/5 bg-[color:var(--color-secondary)]/95 px-4 py-2 backdrop-blur">
      <div className="flex max-w-full gap-1.5 overflow-x-auto scroll-thin">
        {variants.map((v) => {
          const on = v.id === selectedId
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v.id)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
                on
                  ? 'border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-white'
                  : 'border-black/10 bg-white/60 text-ink-700 hover:border-ink-400'
              }`}
            >
              {v.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MusicPlayer({ src, autoplay }: { src: string; autoplay: boolean }) {
  const ref = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const audio = ref.current
    if (!audio) return
    audio.volume = 0.5
    if (!autoplay) return
    let cancelled = false
    const tryPlay = () => audio.play().then(() => !cancelled && setPlaying(true))
    tryPlay().catch(() => {
      // Bloqueado por el navegador; iniciar al primer gesto del usuario
      const onGesture = () => {
        tryPlay().catch(() => undefined)
        window.removeEventListener('pointerdown', onGesture)
        window.removeEventListener('keydown', onGesture)
        window.removeEventListener('touchstart', onGesture)
      }
      window.addEventListener('pointerdown', onGesture, { once: true })
      window.addEventListener('keydown', onGesture, { once: true })
      window.addEventListener('touchstart', onGesture, { once: true })
    })
    return () => {
      cancelled = true
    }
  }, [src, autoplay])

  const toggle = () => {
    const audio = ref.current
    if (!audio) return
    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    } else {
      audio.pause()
      setPlaying(false)
    }
  }

  return (
    <>
      <audio ref={ref} src={src} loop preload="auto" />
      <button
        onClick={toggle}
        aria-label={playing ? 'Pausar música' : 'Reproducir música'}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-900 hover:border-ink-400"
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        )}
      </button>
    </>
  )
}

// Classify an anchor's href into an interaction action. Returns null when
// the link isn't interesting enough to record (e.g. `#` placeholders).
function classifyAnchor(href: string): InteractionAction | null {
  if (!href || href === '#') return null
  if (href.startsWith('tel:')) return 'link-click-phone'
  if (href.startsWith('mailto:')) return 'link-click-email'
  if (/^https?:\/\/(?:wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)/i.test(href)) {
    return 'link-click-whatsapp'
  }
  if (/^https?:\/\/(?:www\.)?(?:google\.[\w.]+\/maps|maps\.google|goo\.gl\/maps|maps\.apple|apple\.com\/maps)/i.test(href)) {
    return 'link-click-map'
  }
  if (/^https?:\/\/(?:www\.)?(?:instagram\.com|facebook\.com|tiktok\.com|x\.com|twitter\.com|t\.me)/i.test(href)) {
    return 'link-click-social'
  }
  if (href.startsWith('#')) return 'section-nav'
  if (/^https?:\/\//i.test(href)) return 'link-click-external'
  return null
}

// Sanitize the href into a short, dashboard-friendly target string. We
// never store full URLs (could carry tracking params or PII) — just the
// host or the section anchor.
function computeAnchorTarget(href: string, action: InteractionAction): string {
  if (action === 'section-nav') return href.replace(/^#/, '').slice(0, 60)
  if (action === 'link-click-phone') return href.replace(/^tel:/, '').slice(0, 30)
  if (action === 'link-click-email') return href.replace(/^mailto:/, '').split('?')[0].slice(0, 60)
  try {
    const url = new URL(href)
    return url.hostname.slice(0, 80)
  } catch {
    return href.slice(0, 80)
  }
}
