import { useEffect, useState } from 'react'
import type { InvitationBlock } from '../../types/invitation.types'
import { BlockWrapper } from './BlockWrapper'
import { TextEl } from './TextEl'

interface Remaining {
  done: boolean
  days: number
  hours: number
  minutes: number
  seconds: number
}

function computeRemaining(target: number): Remaining {
  const diff = target - Date.now()
  if (Number.isNaN(target) || diff <= 0) {
    return { done: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  const totalSeconds = Math.floor(diff / 1000)
  return {
    done: false,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

export function CountdownBlock({ block }: { block: InvitationBlock<'countdown'> }) {
  const d = block.data
  // `datetime-local` strings have no timezone; parsing them with `new Date`
  // interprets them in the visitor's local time, which is what we want for an
  // event countdown.
  const target = d.targetDate ? new Date(d.targetDate).getTime() : NaN
  const showLabels = d.showLabels !== false
  const hideSeconds = !!d.hideSeconds

  const [remaining, setRemaining] = useState<Remaining>(() => computeRemaining(target))

  useEffect(() => {
    setRemaining(computeRemaining(target))
    const id = window.setInterval(() => setRemaining(computeRemaining(target)), 1000)
    return () => window.clearInterval(id)
  }, [target])

  const segments: { value: number; label: string }[] = [
    { value: remaining.days, label: 'Días' },
    { value: remaining.hours, label: 'Horas' },
    { value: remaining.minutes, label: 'Min' },
    ...(hideSeconds ? [] : [{ value: remaining.seconds, label: 'Seg' }]),
  ]

  return (
    <BlockWrapper style={block.style}>
      <div className="text-center">
        {d.title && (
          <TextEl block={block} field="title" as="h2" className="mb-6 font-serif text-3xl">
            {d.title}
          </TextEl>
        )}

        {remaining.done ? (
          <TextEl
            block={block}
            field="completedMessage"
            as="p"
            className="font-serif text-2xl"
            style={{ color: 'var(--color-accent)' }}
          >
            {d.completedMessage || '¡Llegó el gran día!'}
          </TextEl>
        ) : (
          <div className="flex flex-wrap items-stretch justify-center gap-3 md:gap-5">
            {segments.map((seg) => (
              <div
                key={seg.label}
                className="flex min-w-[64px] flex-col items-center rounded-lg border accent-border px-3 py-3 md:min-w-[84px] md:px-5"
              >
                <span
                  className="font-serif text-4xl leading-none tabular-nums md:text-6xl"
                  style={{ color: 'var(--color-accent)' }}
                >
                  {String(seg.value).padStart(2, '0')}
                </span>
                {showLabels && (
                  <span className="mt-2 text-[10px] uppercase tracking-[0.2em] opacity-70 md:text-xs">
                    {seg.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </BlockWrapper>
  )
}
