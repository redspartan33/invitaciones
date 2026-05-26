import { createContext, useContext, type ReactNode } from 'react'

/**
 * When `suppress` is true, blocks must skip rendering their own
 * `backgroundColor` / `backgroundImage` so the global page background
 * (rendered behind the entire invitation) remains visible.
 */
const Ctx = createContext<{ suppress: boolean }>({ suppress: false })

export function BlockBackgroundProvider({
  suppress,
  children,
}: {
  suppress: boolean
  children: ReactNode
}) {
  return <Ctx.Provider value={{ suppress }}>{children}</Ctx.Provider>
}

export function useSuppressBlockBackgrounds(): boolean {
  return useContext(Ctx).suppress
}
