import type { Invitation } from '../types/invitation.types'

// Single shared JSONBlob acting as a tiny key-value store. Every published
// invitation lives at `registry.invitations[<slug>]`. The slug is 9 chars and
// is the public id in the share URL. Zero-config, no auth.
//
// To rotate the registry (e.g. it grew too big), POST a fresh blob to
// https://jsonblob.com/api/jsonBlob and replace REGISTRY_BLOB_ID below.
const REGISTRY_BLOB_ID = '019e520f-c2da-7332-b404-a229be2ce628'
const REGISTRY_URL = `https://jsonblob.com/api/jsonBlob/${REGISTRY_BLOB_ID}`

interface Registry {
  _meta: string
  _version: number
  invitations: Record<string, Invitation>
}

function emptyRegistry(): Registry {
  return { _meta: 'invitation-builder-index', _version: 1, invitations: {} }
}

async function readRegistry(): Promise<Registry | null> {
  try {
    const res = await fetch(REGISTRY_URL, { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as Registry
    if (!data?.invitations || typeof data.invitations !== 'object') return null
    return data
  } catch {
    return null
  }
}

async function writeRegistry(reg: Registry): Promise<boolean> {
  try {
    const res = await fetch(REGISTRY_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reg),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function saveToRegistry(slug: string, inv: Invitation): Promise<boolean> {
  const reg = (await readRegistry()) ?? emptyRegistry()
  reg.invitations[slug] = inv
  return writeRegistry(reg)
}

export async function loadFromRegistry(slug: string): Promise<Invitation | null> {
  const reg = await readRegistry()
  return reg?.invitations[slug] ?? null
}

export async function deleteFromRegistry(slug: string): Promise<boolean> {
  const reg = await readRegistry()
  if (!reg) return false
  if (!(slug in reg.invitations)) return true
  delete reg.invitations[slug]
  return writeRegistry(reg)
}
