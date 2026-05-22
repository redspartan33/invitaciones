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
    </div>
  )
}

export function NotFoundView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 p-8 text-center">
      <div>
        <p className="font-serif text-4xl text-ink-900">Invitación no encontrada</p>
        <p className="mt-2 text-sm text-ink-500">
          El link puede haber expirado o aún no ha sido publicado en este navegador.
        </p>
        <a href="/" className="mt-6 inline-block btn-primary">Volver al editor</a>
      </div>
    </div>
  )
}
