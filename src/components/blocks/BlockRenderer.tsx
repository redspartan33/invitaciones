import type { InvitationBlock } from '../../types/invitation.types'
import { DressCodeBlock } from './DressCodeBlock'
import { EventDetailsBlock } from './EventDetailsBlock'
import { FooterBlock } from './FooterBlock'
import { GalleryBlock } from './GalleryBlock'
import { GiftRegistryBlock } from './GiftRegistryBlock'
import { HeroBlock } from './HeroBlock'
import { RsvpInfoBlock } from './RsvpInfoBlock'
import { TimelineBlock } from './TimelineBlock'
import { MapBlock } from './MapBlock'
import { MenuHeaderBlock } from './MenuHeaderBlock'
import { MenuSectionBlock } from './MenuSectionBlock'
import { MenuNoteBlock } from './MenuNoteBlock'
import { MenuFooterBlock } from './MenuFooterBlock'

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
    case 'map':
      return <MapBlock block={block as InvitationBlock<'map'>} />
    case 'menu-header':
      return <MenuHeaderBlock block={block as InvitationBlock<'menu-header'>} />
    case 'menu-section':
      return <MenuSectionBlock block={block as InvitationBlock<'menu-section'>} />
    case 'menu-note':
      return <MenuNoteBlock block={block as InvitationBlock<'menu-note'>} />
    case 'menu-footer':
      return <MenuFooterBlock block={block as InvitationBlock<'menu-footer'>} />
    default:
      return null
  }
}
