import type { InvitationBlock, TimelineData } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TimelineActIcon } from './icons'

export function TimelineBlock({ block }: { block: InvitationBlock<'timeline'> }) {
  const data = block.data as TimelineData
  const align = data.alignment ?? 'left'

  // El layout cambia según alineación: izquierda usa una línea vertical con
  // íconos; centro y derecha usan tarjetas apiladas centradas/derecha sin línea.
  if (align === 'left') {
    return (
      <BlockWrapper style={block.style} align="left">
        {data.title && <h2 className="mb-8 font-serif text-3xl">{data.title}</h2>}
        <ol className="relative space-y-6 border-l pl-8 accent-border">
          {data.items.map((item) => (
            <li key={item.id} className="relative">
              <span className="absolute -left-[42px] flex h-7 w-7 items-center justify-center rounded-full accent-bg">
                <TimelineActIcon kind={item.icon} className="h-4 w-4" />
              </span>
              <div className="flex items-baseline gap-4">
                <span className="w-16 shrink-0 font-mono text-xs uppercase tracking-widest opacity-70">{item.time}</span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.description && <p className="text-sm opacity-70">{item.description}</p>}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </BlockWrapper>
    )
  }

  return (
    <BlockWrapper style={block.style} align={align}>
      {data.title && <h2 className="mb-8 font-serif text-3xl">{data.title}</h2>}
      <ol className="space-y-5">
        {data.items.map((item) => (
          <li key={item.id} className={`flex flex-col gap-1 ${align === 'right' ? 'items-end' : 'items-center'}`}>
            <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest opacity-70">
              <TimelineActIcon kind={item.icon} className="h-4 w-4 accent" />
              {item.time}
            </span>
            <p className="font-medium">{item.title}</p>
            {item.description && <p className="text-sm opacity-70 max-w-md">{item.description}</p>}
          </li>
        ))}
      </ol>
    </BlockWrapper>
  )
}
