import type { InvitationBlock, TimelineData } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TimelineActIcon } from './icons'
import { TextEl } from './TextEl'

export function TimelineBlock({ block }: { block: InvitationBlock<'timeline'> }) {
  const data = block.data as TimelineData
  const align = data.alignment ?? 'left'
  const hideIcons = block.style?.hideIcons === true

  if (align === 'left') {
    return (
      <BlockWrapper style={block.style} align="left">
        {data.title && (
          <TextEl block={block} field="title" as="h2" className="mb-8 font-serif text-3xl">
            {data.title}
          </TextEl>
        )}
        <ol className={`relative space-y-6 ${hideIcons ? '' : 'border-l pl-8 accent-border'}`}>
          {data.items.map((item) => (
            <li key={item.id} className="relative">
              {!hideIcons && (
                <span className="absolute -left-[42px] flex h-7 w-7 items-center justify-center rounded-full accent-bg">
                  <TimelineActIcon kind={item.icon} className="h-4 w-4" />
                </span>
              )}
              <div className="flex items-baseline gap-4">
                <TextEl block={block} field="items.time" className="w-16 shrink-0 font-mono text-xs uppercase tracking-widest opacity-70">
                  {item.time}
                </TextEl>
                <div>
                  <TextEl block={block} field="items.title" as="p" className="font-medium">
                    {item.title}
                  </TextEl>
                  {item.description && (
                    <TextEl block={block} field="items.description" as="p" className="text-sm opacity-70">
                      {item.description}
                    </TextEl>
                  )}
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
      {data.title && (
        <TextEl block={block} field="title" as="h2" className="mb-8 font-serif text-3xl">
          {data.title}
        </TextEl>
      )}
      <ol className="space-y-5">
        {data.items.map((item) => (
          <li key={item.id} className={`flex flex-col gap-1 ${align === 'right' ? 'items-end' : 'items-center'}`}>
            <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest opacity-70">
              {!hideIcons && <TimelineActIcon kind={item.icon} className="h-4 w-4 accent" />}
              <TextEl block={block} field="items.time">{item.time}</TextEl>
            </span>
            <TextEl block={block} field="items.title" as="p" className="font-medium">
              {item.title}
            </TextEl>
            {item.description && (
              <TextEl block={block} field="items.description" as="p" className="text-sm opacity-70 max-w-md">
                {item.description}
              </TextEl>
            )}
          </li>
        ))}
      </ol>
    </BlockWrapper>
  )
}
