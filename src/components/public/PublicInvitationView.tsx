import { useEffect, useRef, useState } from 'react'
import type { Invitation } from '../../types/invitation.types'
import { BlockRenderer } from '../blocks/BlockRenderer'

export function PublicInvitationView({ invitation }: { invitation: Invitation }) {
  const { globalSettings, blocks } = invitation
  const fontClass =
    globalSettings.fontFamily === 'serif'
      ? 'font-serif'
      : globalSettings.fontFamily === 'script'
      ? 'font-script'
      : 'font-sans'

  const visible = [...blocks].sort((a, b) => a.order - b.order).filter((b) => b.visible)
  const musicUrl = globalSettings.backgroundMusic && /^https?:\/\//i.test(globalSettings.backgroundMusic)
    ? globalSettings.backgroundMusic
    : ''
  const autoplay = !!globalSettings.backgroundMusicAutoplay

  return (
    <div
      className={`invitation-canvas min-h-screen w-full ${fontClass}`}
      style={
        {
          ['--color-accent' as never]: globalSettings.colorAccent,
          ['--color-primary' as never]: globalSettings.colorPrimary,
          ['--color-secondary' as never]: globalSettings.colorSecondary,
        } as React.CSSProperties
      }
    >
      <div className="mx-auto max-w-[920px] border-x border-black/5 bg-[color:var(--color-secondary)]">
        {visible.map((block) => (
          <div key={block.id}>
            <BlockRenderer block={block} />
          </div>
        ))}
      </div>
      {musicUrl && <MusicPlayer src={musicUrl} autoplay={autoplay} />}
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
