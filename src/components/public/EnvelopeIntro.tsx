import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, type Easing } from 'framer-motion'
import type { EnvelopeIntroConfig } from '../../types/invitation.types'

const EASE_SMOOTH: Easing = [0.22, 1, 0.36, 1]
const EASE_FLAP: Easing = [0.7, 0, 0.84, 0]

interface EnvelopeIntroProps {
  config: EnvelopeIntroConfig
  /** Called after the full open animation finishes and the overlay fades away. */
  onDone: () => void
  /** When true, the intro behaves as a one-shot demo: it re-opens on every mount
   *  (used by the editor preview). Default: false (production behavior). */
  demo?: boolean
}

type Stage = 'closed' | 'opening' | 'leaving' | 'gone'

/**
 * Greenvelope-style intro: a closed envelope sits centered on screen. The user
 * taps to open (or auto-open kicks in), the flap rotates back to reveal the
 * lining, the invitation card slides up out of the envelope and grows to fill
 * the viewport, and the overlay fades away to hand off to the real invitation.
 */
export function EnvelopeIntro({ config, onDone, demo }: EnvelopeIntroProps) {
  const [stage, setStage] = useState<Stage>('closed')

  const envelopeColor = config.envelopeColor || '#a3b88c'
  const liningColor = config.liningColor || '#f4ead7'
  const backgroundColor = config.backgroundColor || '#eef2e5'
  const recipientName = (config.recipientName || '').trim()
  const monogram = (config.monogram || '').trim()
  const hintLabel = (config.hintLabel || '').trim() || 'Toca para abrir'
  const waxColor = config.waxColor || '#9c3a3a'
  const showWax = !!config.wax

  // Tone variants used for shading the front/flap so the envelope feels 3D.
  const shaded = useMemo(() => shadeColor(envelopeColor, -8), [envelopeColor])
  const highlight = useMemo(() => shadeColor(envelopeColor, 10), [envelopeColor])

  const open = () => {
    if (stage !== 'closed') return
    setStage('opening')
  }

  // Auto-open after a short pause if configured.
  useEffect(() => {
    if (!config.autoOpen || stage !== 'closed') return
    const t = window.setTimeout(open, 1200)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.autoOpen, stage])

  // Once the flap + card animations have settled, fade the whole overlay out
  // and let the real invitation underneath take over.
  useEffect(() => {
    if (stage !== 'opening') return
    const t = window.setTimeout(() => setStage('leaving'), 2200)
    return () => window.clearTimeout(t)
  }, [stage])

  useEffect(() => {
    if (stage !== 'leaving') return
    const t = window.setTimeout(() => {
      console.log('[envelope] transitioning to gone, calling onDone')
      setStage('gone')
      onDone()
    }, demo ? 200 : 500)
    return () => window.clearTimeout(t)
  }, [stage, onDone, demo])

  // Lock body scroll while the intro is in front of the page.
  useEffect(() => {
    if (stage === 'gone') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [stage])

  if (stage === 'gone' && !demo) return null

  return (
    <AnimatePresence>
      {stage !== 'gone' && (
        <motion.div
          key="envelope-intro"
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden select-none"
          style={{ background: backgroundColor }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          onClick={open}
          role="dialog"
          aria-label="Sobre de invitación"
        >
          <EnvelopeStage
            stage={stage}
            envelopeColor={envelopeColor}
            shaded={shaded}
            highlight={highlight}
            liningColor={liningColor}
            recipientName={recipientName}
            monogram={monogram}
            showWax={showWax}
            waxColor={waxColor}
            preview={config.cardPreviewImage}
          />

          {/* Hint pill — only while closed */}
          <AnimatePresence>
            {stage === 'closed' && (
              <motion.div
                key="hint"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 text-center"
              >
                <motion.span
                  animate={{ opacity: [0.45, 1, 0.45] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-ink-700 backdrop-blur"
                >
                  <span aria-hidden>✦</span>
                  {hintLabel}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skip button (small, top-right). Lets users bail past the animation. */}
          {stage !== 'leaving' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setStage('leaving')
              }}
              className="absolute right-4 top-4 rounded-full bg-white/70 px-3 py-1 text-[11px] uppercase tracking-widest text-ink-700 hover:bg-white"
            >
              Saltar
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface StageProps {
  stage: Stage
  envelopeColor: string
  shaded: string
  highlight: string
  liningColor: string
  recipientName: string
  monogram: string
  showWax: boolean
  waxColor: string
  preview?: string
}

function EnvelopeStage({
  stage,
  envelopeColor,
  shaded,
  highlight,
  liningColor,
  recipientName,
  monogram,
  showWax,
  waxColor,
  preview,
}: StageProps) {
  // Width is responsive; height scales proportionally to keep the envelope ratio.
  const open = stage === 'opening' || stage === 'leaving'

  // Card slides up out of the envelope, then scales toward viewport center.
  const cardAnim = open
    ? {
        y: '-58%',
        scale: 1.18,
        transition: { delay: 0.55, duration: 1.05, ease: EASE_SMOOTH },
      }
    : { y: '0%', scale: 1 }

  const stageAnim = open
    ? { scale: 0.96, transition: { delay: 0.25, duration: 1.5, ease: 'easeOut' as Easing } }
    : { scale: 1 }

  // Layer geometry: the flap is a downward-pointing triangle from the top
  // corners to a center apex at FLAP_APEX_PCT down the envelope. The front
  // pocket is the complementary pentagon — corner wedges + bottom half —
  // meeting the flap apex at the same point. Together they cover the entire
  // envelope when closed (no gaps), and they reveal a triangular V-opening
  // when the flap rotates away.
  const FLAP_APEX_PCT = 55

  return (
    <motion.div
      className="relative"
      style={{
        width: 'min(86vw, 460px)',
        aspectRatio: '1.55 / 1',
        perspective: 1400,
      }}
      animate={stageAnim}
    >
      {/* Back of envelope — full rectangle, always behind everything. */}
      <div
        className="absolute inset-0 rounded-[6px]"
        style={{
          background: `linear-gradient(180deg, ${shadeColor(envelopeColor, -4)} 0%, ${shaded} 100%)`,
          boxShadow:
            '0 24px 60px -20px rgba(0,0,0,0.35), 0 8px 18px -8px rgba(0,0,0,0.2)',
        }}
      />

      {/* Lining — the "inside" surface revealed once the flap lifts. Lives at
          z:1, hidden by the flap + front pocket when closed. We fade it in
          slightly so the color transition feels natural. */}
      <motion.div
        className="absolute inset-0 rounded-[6px]"
        style={{ zIndex: 1, background: liningColor }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: open ? 1 : 0,
          transition: { delay: open ? 0.3 : 0, duration: 0.3 },
        }}
        aria-hidden
      />

      {/* The card resting inside the envelope. At rest its visible area is
          entirely behind the flap (upper-center triangle), so it's invisible
          until the flap rotates away. */}
      <motion.div
        className="absolute"
        style={{
          left: '10%',
          right: '10%',
          top: '12%',
          height: '76%',
          zIndex: 2,
          transformOrigin: '50% 100%',
        }}
        initial={{ y: '0%', scale: 1 }}
        animate={cardAnim}
      >
        <CardPreview
          recipientName={recipientName}
          monogram={monogram}
          preview={preview}
        />
      </motion.div>

      {/* Front pocket — pentagon covering the corner wedges + the entire
          bottom half. Its top edge slopes from each upper corner down to a
          shared apex at (50%, FLAP_APEX_PCT). Combined with the flap, it
          tiles the envelope perfectly when closed. */}
      <div
        className="absolute inset-0 rounded-[6px]"
        style={{
          zIndex: 3,
          background: `linear-gradient(180deg, ${envelopeColor} 0%, ${shaded} 100%)`,
          clipPath: `polygon(0 0, 50% ${FLAP_APEX_PCT}%, 100% 0, 100% 100%, 0 100%)`,
          boxShadow: 'inset 0 4px 12px -8px rgba(0,0,0,0.18)',
        }}
      >
        {recipientName && (
          <div
            className="pointer-events-none absolute inset-x-0"
            style={{ top: '72%', textAlign: 'center', color: shadeColor(envelopeColor, -55) }}
          >
            {monogram && (
              <p className="text-[10px] uppercase tracking-[0.4em] opacity-70">{monogram}</p>
            )}
            <p
              className="mt-1 font-serif italic"
              style={{ fontSize: 'clamp(14px, 2.4vw, 20px)' }}
            >
              {recipientName}
            </p>
          </div>
        )}
      </div>

      {/* Flap — downward triangle from the upper corners to the shared apex.
          Hinged at the top edge; rotates 180° on X to open. backface-visibility
          hides the flap once it passes the perpendicular so the lining + card
          can read through. */}
      <motion.div
        className="absolute inset-0 rounded-t-[6px]"
        style={{
          zIndex: 4,
          transformOrigin: '50% 0%',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          clipPath: `polygon(0 0, 100% 0, 50% ${FLAP_APEX_PCT}%)`,
          background: `linear-gradient(180deg, ${highlight} 0%, ${envelopeColor} 100%)`,
          boxShadow: open ? 'none' : '0 4px 6px -3px rgba(0,0,0,0.18)',
        }}
        initial={{ rotateX: 0 }}
        animate={open ? { rotateX: 180 } : { rotateX: 0 }}
        transition={{ duration: 0.85, ease: EASE_FLAP, delay: 0.05 }}
      >
        {showWax && (
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: `${FLAP_APEX_PCT - 18}%`,
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 30%, ${shadeColor(waxColor, 25)} 0%, ${waxColor} 60%, ${shadeColor(waxColor, -25)} 100%)`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center font-serif text-white/80"
              style={{ fontSize: 14 }}
            >
              {monogram ? monogram.slice(0, 1) : '✦'}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function CardPreview({
  recipientName,
  monogram,
  preview,
}: {
  recipientName: string
  monogram: string
  preview?: string
}) {
  if (preview) {
    return (
      <div
        className="h-full w-full overflow-hidden rounded-[4px] bg-white"
        style={{
          backgroundImage: `url(${preview})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: '0 10px 28px -10px rgba(0,0,0,0.35)',
        }}
      />
    )
  }
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center rounded-[4px] bg-[#fdf7e8] px-6 text-center"
      style={{ boxShadow: '0 10px 28px -10px rgba(0,0,0,0.35)' }}
    >
      {monogram && (
        <p className="text-[10px] uppercase tracking-[0.4em] text-ink-500">{monogram}</p>
      )}
      <p
        className="mt-2 font-serif italic text-ink-800"
        style={{ fontSize: 'clamp(20px, 4.2vw, 36px)' }}
      >
        {recipientName || 'Tu invitación'}
      </p>
      <span
        className="mt-3 inline-block h-px w-12"
        style={{ background: 'rgba(0,0,0,0.25)' }}
      />
      <p className="mt-3 text-[10px] uppercase tracking-[0.4em] text-ink-500">
        Te esperamos
      </p>
    </div>
  )
}

/** Lighten (+) or darken (-) a hex color by `percent` (-100..100). */
function shadeColor(hex: string, percent: number): string {
  const clean = hex.replace('#', '').trim()
  const expanded =
    clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean.padEnd(6, '0').slice(0, 6)
  const num = parseInt(expanded, 16)
  if (Number.isNaN(num)) return hex
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  const adjust = (c: number) => {
    const v = Math.round(c + (percent / 100) * (percent >= 0 ? 255 - c : c))
    return Math.max(0, Math.min(255, v))
  }
  return `#${[adjust(r), adjust(g), adjust(b)]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`
}
