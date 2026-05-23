import type { InvitationBlock, MenuNoteData } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

export function MenuNoteBlock({ block }: { block: InvitationBlock<'menu-note'> }) {
  const data = block.data as MenuNoteData
  const align = data.alignment ?? 'center'
  return (
    <BlockWrapper style={block.style} align={align}>
      <TextEl block={block} field="text" as="p" className="text-sm italic opacity-80">
        {data.text}
      </TextEl>
    </BlockWrapper>
  )
}
