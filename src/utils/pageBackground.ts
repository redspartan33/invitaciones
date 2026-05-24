import type { PageBackground } from '../types/invitation.types'

export type BackgroundSource =
  | { kind: 'image'; url: string }
  | { kind: 'video-file'; url: string }
  | { kind: 'youtube'; embedUrl: string }
  | { kind: 'vimeo'; embedUrl: string }
  | { kind: 'empty' }

const VIDEO_FILE_RE = /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i
const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/

export function detectBackgroundKind(url: string): 'image' | 'video' | 'empty' {
  const u = url?.trim()
  if (!u) return 'empty'
  if (VIDEO_FILE_RE.test(u)) return 'video'
  if (YOUTUBE_RE.test(u)) return 'video'
  if (VIMEO_RE.test(u)) return 'video'
  return 'image'
}

export function resolveBackgroundSource(bg?: PageBackground): BackgroundSource {
  if (!bg?.url?.trim()) return { kind: 'empty' }
  const url = bg.url.trim()

  // Explicit override wins.
  if (bg.kind === 'image') return { kind: 'image', url }
  if (bg.kind === 'video') {
    // Try every video form, fall back to file player.
    const yt = url.match(YOUTUBE_RE)
    if (yt) return { kind: 'youtube', embedUrl: youtubeEmbed(yt[1]) }
    const vm = url.match(VIMEO_RE)
    if (vm) return { kind: 'vimeo', embedUrl: vimeoEmbed(vm[1]) }
    return { kind: 'video-file', url }
  }

  // Auto-detect.
  const yt = url.match(YOUTUBE_RE)
  if (yt) return { kind: 'youtube', embedUrl: youtubeEmbed(yt[1]) }
  const vm = url.match(VIMEO_RE)
  if (vm) return { kind: 'vimeo', embedUrl: vimeoEmbed(vm[1]) }
  if (VIDEO_FILE_RE.test(url)) return { kind: 'video-file', url }
  return { kind: 'image', url }
}

function youtubeEmbed(id: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    controls: '0',
    showinfo: '0',
    modestbranding: '1',
    rel: '0',
    iv_load_policy: '3',
    playsinline: '1',
    disablekb: '1',
    playlist: id, // required for loop=1 on a single video
  })
  return `https://www.youtube.com/embed/${id}?${params.toString()}`
}

function vimeoEmbed(id: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    muted: '1',
    loop: '1',
    background: '1', // hides controls, autoplays muted, loops
    autopause: '0',
  })
  return `https://player.vimeo.com/video/${id}?${params.toString()}`
}

export function backgroundPositionStyle(pos?: PageBackground['position']): string {
  switch (pos) {
    case 'top': return 'center top'
    case 'bottom': return 'center bottom'
    case 'left': return 'left center'
    case 'right': return 'right center'
    case 'top-left': return 'left top'
    case 'top-right': return 'right top'
    case 'bottom-left': return 'left bottom'
    case 'bottom-right': return 'right bottom'
    case 'center':
    default:
      return 'center center'
  }
}

export function backgroundSizeStyle(fit?: PageBackground['fit']): string {
  switch (fit) {
    case 'contain': return 'contain'
    case 'tile': return 'auto'
    case 'auto': return 'auto'
    case 'cover':
    default:
      return 'cover'
  }
}
