import type { InvitationBlock, TimelineData } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TimelineActIcon } from './icons'

export function TimelineBlock({ block }: { block: InvitationBlock<'timeline'> }) {
  const data = block.data as TimelineData
  return (
    <BlockWrapper style={block.style}>
      <div className="text-center">
        {data.title && <h2 className="font-serif text-3xl">{data.title}</h2>}
      </div>
      <div className="mt-10">
        <ol className="relative space-y-6 border-l border-ink-200 pl-8">
          {data.items.map((item) => (
            <li key={item.id} className="relative">
              <span className="absolute -left-[42px] flex h-7 w-7 items-center justify-center rounded-full border border-ink-200 bg-white">
                <TimelineActIcon kind={item.icon} className="h-4 w-4" />
              </span>
              <div className="flex items-baseline gap-4">
                <span className="w-16 shrink-0 font-mono text-xs uppercase tracking-widest text-ink-500">{item.time}</span>
                <div>
                  <p className="font-medium text-ink-900">{item.title}</p>
                  {item.description && <p className="text-sm text-ink-500">{item.description}</p>}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </BlockWrapper>
  )
}
