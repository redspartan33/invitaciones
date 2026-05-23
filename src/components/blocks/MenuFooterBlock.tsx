import type { InvitationBlock, MenuFooterData } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'

export function MenuFooterBlock({ block }: { block: InvitationBlock<'menu-footer'> }) {
  const data = block.data as MenuFooterData
  const rows: { label: string; value: string; href?: string }[] = []
  if (data.address) rows.push({ label: 'Dirección', value: data.address })
  if (data.hours) rows.push({ label: 'Horarios', value: data.hours })
  if (data.phone) rows.push({ label: 'Teléfono', value: data.phone, href: `tel:${data.phone.replace(/\s+/g, '')}` })
  if (data.website) rows.push({ label: 'Web', value: data.website, href: data.website })
  if (data.instagram) rows.push({ label: 'Instagram', value: data.instagram, href: `https://instagram.com/${data.instagram.replace('@', '')}` })
  if (data.whatsapp) rows.push({ label: 'WhatsApp', value: data.whatsapp, href: `https://wa.me/${data.whatsapp.replace(/\D/g, '')}` })

  return (
    <BlockWrapper style={block.style} align="center">
      <div className="mx-auto max-w-md space-y-1.5 text-sm">
        {rows.length === 0 ? (
          <p className="text-sm italic opacity-50">Añade la información de contacto del restaurante.</p>
        ) : (
          rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-center gap-2">
              <span className="text-[10px] uppercase tracking-widest opacity-50">{r.label}</span>
              {r.href ? (
                <a href={r.href} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
                  {r.value}
                </a>
              ) : (
                <span>{r.value}</span>
              )}
            </div>
          ))
        )}
      </div>
    </BlockWrapper>
  )
}
