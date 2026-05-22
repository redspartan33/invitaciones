import type { InvitationBlock } from '../../types/invitation.types'
import { DressCodeBlock } from './DressCodeBlock'
import { EventDetailsBlock } from './EventDetailsBlock'
import { FooterBlock } from './FooterBlock'
import { GalleryBlock } from './GalleryBlock'
import { GiftRegistryBlock } from './GiftRegistryBlock'
import { HeroBlock } from './HeroBlock'
import { RsvpInfoBlock } from './RsvpInfoBlock'
import { TimelineBlock } from './TimelineBlock'

export function BlockRenderer({ block }: { block: InvitationBlock }) {
  switch (block.type) {
    case 'hero':
      return <HeroBlock block={block as InvitationBlock<'hero'>} />
    case 'event-details':
      return <EventDetailsBlock block={block as InvitationBlock<'event-details'>} />
    case 'timeline':
      return <TimelineBlock block={block as InvitationBlock<'timeline'>} />
    case 'dress-code':
      return <DressCodeBlock block={block as InvitationBlock<'dress-code'>} />
    case 'gift-registry':
      return <GiftRegistryBlock block={block as InvitationBlock<'gift-registry'>} />
    case 'rsvp-info':
      return <RsvpInfoBlock block={block as InvitationBlock<'rsvp-info'>} />
    case 'footer':
      return <FooterBlock block={block as InvitationBlock<'footer'>} />
    case 'gallery':
      return <GalleryBlock block={block as InvitationBlock<'gallery'>} />
    default:
      return null
  }
}
