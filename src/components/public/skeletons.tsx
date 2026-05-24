import type { InvitationKind } from '../../types/invitation.types'

const KIND_CACHE_PREFIX = 'invitation-builder:kind-cache:'

export function readKindCache(slug: string): InvitationKind | null {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(KIND_CACHE_PREFIX + slug)
    if (v === 'menu' || v === 'invitation') return v
  } catch { /* ignore */ }
  return null
}

export function writeKindCache(slug: string, kind: InvitationKind) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KIND_CACHE_PREFIX + slug, kind)
  } catch { /* ignore */ }
}

function Pulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-ink-200 ${className}`} />
}

export function PublicSkeleton({ kind }: { kind: InvitationKind | null }) {
  if (kind === 'menu') return <MenuSkeleton />
  if (kind === 'invitation') return <InvitationSkeleton />
  return <NeutralSkeleton />
}

export function InvitationSkeleton() {
  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-[920px] border-x border-black/5 bg-ink-50">
        {/* Hero */}
        <div className="relative flex h-[60vh] min-h-[420px] flex-col items-center justify-center gap-5 bg-ink-100 px-6">
          <Pulse className="h-3 w-24" />
          <Pulse className="h-10 w-72 max-w-[80%]" />
          <Pulse className="h-3 w-48" />
          <div className="mt-4 flex gap-2">
            <Pulse className="h-2 w-10" />
            <Pulse className="h-2 w-10" />
          </div>
        </div>

        {/* Event details card */}
        <div className="px-8 py-12">
          <div className="mx-auto max-w-md space-y-4 rounded border border-ink-200 bg-white p-6">
            <Pulse className="mx-auto h-4 w-40" />
            <Pulse className="mx-auto h-3 w-56" />
            <Pulse className="mx-auto h-3 w-32" />
            <Pulse className="mx-auto mt-2 h-3 w-48" />
          </div>
        </div>

        {/* Timeline */}
        <div className="px-8 py-10">
          <Pulse className="mx-auto mb-8 h-4 w-32" />
          <div className="mx-auto max-w-md space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Pulse className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Pulse className="h-3 w-24" />
                  <Pulse className="h-3 w-full max-w-[260px]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RSVP-ish */}
        <div className="px-8 py-10">
          <div className="mx-auto max-w-sm space-y-3 text-center">
            <Pulse className="mx-auto h-3 w-40" />
            <Pulse className="mx-auto h-3 w-56" />
            <Pulse className="mx-auto mt-3 h-9 w-40 rounded-full" />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-ink-200 bg-ink-100 px-8 py-8">
          <div className="mx-auto max-w-sm space-y-2">
            <Pulse className="mx-auto h-3 w-32" />
            <Pulse className="mx-auto h-3 w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function MenuSkeleton() {
  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-[920px] border-x border-black/5 bg-ink-50">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 bg-ink-100 px-6 py-10">
          <Pulse className="h-14 w-14 rounded-full" />
          <Pulse className="h-6 w-56" />
          <Pulse className="h-3 w-40" />
        </div>

        {/* Sticky nav strip */}
        <div className="flex gap-2 overflow-x-auto border-y border-ink-200 bg-white px-4 py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Pulse key={i} className="h-7 w-20 shrink-0 rounded-full" />
          ))}
        </div>

        {/* Two sections of items */}
        {Array.from({ length: 2 }).map((_, sec) => (
          <div key={sec} className="px-6 py-8">
            <Pulse className="mb-5 h-5 w-40" />
            <div className="space-y-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <Pulse className="h-4 w-3/5" />
                    <Pulse className="h-3 w-4/5" />
                  </div>
                  <Pulse className="h-4 w-12 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="border-t border-ink-200 bg-ink-100 px-6 py-8">
          <div className="space-y-2">
            <Pulse className="h-3 w-48" />
            <Pulse className="h-3 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function NeutralSkeleton() {
  return (
    <div className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-[920px] border-x border-black/5 bg-ink-50">
        <div className="bg-ink-100 px-6 py-16">
          <Pulse className="mx-auto h-8 w-64 max-w-[80%]" />
        </div>
        <div className="space-y-8 px-8 py-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Pulse className="h-4 w-40" />
              <Pulse className="h-3 w-full" />
              <Pulse className="h-3 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
