import type { FaqData, InvitationBlock } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

export function FaqBlock({ block }: { block: InvitationBlock<'faq'> }) {
  const data = block.data as FaqData
  return (
    <BlockWrapper style={block.style}>
      {data.title && (
        <TextEl block={block} field="title" as="h2" className="text-center font-serif text-3xl">
          {data.title}
        </TextEl>
      )}
      <div className="mt-8 flex flex-col" style={{ gap: 'var(--item-gap)' }}>
        {data.items.map((item) => (
          <details key={item.id} className="group border-b accent-border pb-3 text-left">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-2">
              <TextEl block={block} field="items.question" as="span" className="font-medium">
                {item.question}
              </TextEl>
              <span className="accent shrink-0 transition-transform group-open:rotate-45">+</span>
            </summary>
            {item.answer && (
              <TextEl block={block} field="items.answer" as="p" className="pb-1 pt-1 text-sm opacity-80">
                {item.answer}
              </TextEl>
            )}
          </details>
        ))}
      </div>
    </BlockWrapper>
  )
}
