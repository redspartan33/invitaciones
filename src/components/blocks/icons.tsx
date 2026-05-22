import type { SVGProps } from 'react'

const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const EventIcon = ({ kind, ...props }: { kind: string } & SVGProps<SVGSVGElement>) => {
  switch (kind) {
    case 'wedding':
      return (
        <svg {...base} {...props}><circle cx="9" cy="14" r="4" /><circle cx="15" cy="14" r="4" /><path d="M7 8l2 2M17 8l-2 2" /></svg>
      )
    case 'birthday':
      return (
        <svg {...base} {...props}><path d="M5 12h14v8H5z" /><path d="M7 12V8a2 2 0 014 0M13 12V8a2 2 0 014 0" /><path d="M12 4v2" /></svg>
      )
    case 'corporate':
      return (
        <svg {...base} {...props}><rect x="3" y="6" width="18" height="14" rx="1" /><path d="M3 10h18M8 14h2M14 14h2" /></svg>
      )
    case 'baby':
      return (
        <svg {...base} {...props}><circle cx="12" cy="12" r="9" /><circle cx="9" cy="11" r="0.5" fill="currentColor" /><circle cx="15" cy="11" r="0.5" fill="currentColor" /><path d="M9 15c1 1 4 1 6 0" /></svg>
      )
    case 'graduation':
      return (
        <svg {...base} {...props}><path d="M2 9l10-4 10 4-10 4-10-4z" /><path d="M6 11v5c0 1 3 2 6 2s6-1 6-2v-5" /></svg>
      )
    default:
      return <svg {...base} {...props}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /></svg>
  }
}

export const TimelineActIcon = ({ kind, ...props }: { kind: string } & SVGProps<SVGSVGElement>) => {
  switch (kind) {
    case 'ceremony':
      return <svg {...base} {...props}><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" /></svg>
    case 'cocktail':
      return <svg {...base} {...props}><path d="M4 4h16l-8 9-8-9z" /><path d="M12 13v7M8 20h8" /></svg>
    case 'dinner':
      return <svg {...base} {...props}><path d="M4 3v8a2 2 0 002 2v8M6 3v6M20 3c-2 0-3 2-3 5s1 5 3 5v8" /></svg>
    case 'dance':
      return <svg {...base} {...props}><circle cx="9" cy="5" r="2" /><path d="M9 7v6l-3 8M9 13l3 4M14 11l4-2 2 4" /></svg>
    case 'cake':
      return <svg {...base} {...props}><path d="M4 21V11h16v10z" /><path d="M4 16h16" /><path d="M12 4v3M9 6l3 1 3-1" /></svg>
    case 'speech':
      return <svg {...base} {...props}><path d="M4 4h16v12H7l-3 3z" /><path d="M8 9h8M8 12h5" /></svg>
    default:
      return <svg {...base} {...props}><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" /></svg>
  }
}

export const ChevronIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}><path d="M9 6l6 6-6 6" /></svg>
)

export const PlusIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}><path d="M12 5v14M5 12h14" /></svg>
)

export const TrashIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
)

export const EyeIcon = ({ open = true, ...props }: { open?: boolean } & SVGProps<SVGSVGElement>) =>
  open ? (
    <svg {...base} {...props}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>
  ) : (
    <svg {...base} {...props}><path d="M3 3l18 18" /><path d="M10.6 6.1A11 11 0 0112 6c7 0 11 6 11 6a16 16 0 01-3.4 3.9M6.6 6.6A16 16 0 001 12s4 7 11 7c1.7 0 3.3-.4 4.7-1" /></svg>
  )

export const DragIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}><circle cx="9" cy="6" r="1" fill="currentColor" /><circle cx="15" cy="6" r="1" fill="currentColor" /><circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" /><circle cx="9" cy="18" r="1" fill="currentColor" /><circle cx="15" cy="18" r="1" fill="currentColor" /></svg>
)

export const CopyIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}><rect x="9" y="9" width="11" height="11" rx="1" /><path d="M5 15V5a1 1 0 011-1h10" /></svg>
)

export const ShareIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...props}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.5 10.5l7-4M8.5 13.5l7 4" /></svg>
)
