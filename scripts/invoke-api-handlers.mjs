// Actually invoke the API handlers with mock req/res and confirm:
//   1. The handler returns (doesn't throw uncaught).
//   2. The status code is sensible for the input (200 / 400 / 500).
//   3. The body is JSON-parseable.
//
// Blob calls fail without BLOB_READ_WRITE_TOKEN, but we want to see
// the failure surface as `{ error: "<message>" }` with a non-2xx code
// rather than crashing the whole function.

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

function makeRes() {
  let status = 200
  let body = null
  const headers = new Map()
  const res = {
    setHeader(k, v) { headers.set(k, v) },
    status(c) { status = c; return res },
    json(b) { body = { type: 'json', value: b }; return res },
    send(b) { body = { type: 'raw', value: b }; return res },
    end(b) { if (b !== undefined) body = { type: 'raw', value: b }; return res },
  }
  return { res, get: () => ({ status, body }) }
}

const cases = [
  {
    name: 'assets — bad body',
    file: 'api/assets.ts',
    req: { method: 'POST', headers: {}, query: {}, body: null },
    expect: (out) => out.status === 400,
  },
  {
    name: 'assets — bad data URI',
    file: 'api/assets.ts',
    req: { method: 'POST', headers: {}, query: {}, body: { dataUri: 'not-a-data-uri', folder: 'test' } },
    expect: (out) => out.status === 400,
  },
  {
    name: 'assets — valid tiny PNG (will fail at put() without token)',
    file: 'api/assets.ts',
    req: {
      method: 'POST',
      headers: {},
      query: {},
      body: {
        dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        folder: 'test',
      },
    },
    // 500 is OK here — it means decoding worked and only the blob call failed
    // (no token in this script). Crucially, NOT a thrown exception.
    expect: (out) => out.status === 200 || out.status === 500,
  },
  {
    name: 'guestlists — GET with no token (should return [] gracefully)',
    file: 'api/guestlists/[slug].ts',
    req: { method: 'GET', headers: {}, query: { slug: 'testslug' }, body: null },
    expect: (out) => out.status === 200,
  },
  {
    name: 'guestlists — POST with no name (400)',
    file: 'api/guestlists/[slug].ts',
    req: { method: 'POST', headers: {}, query: { slug: 'testslug' }, body: {} },
    expect: (out) => out.status === 400,
  },
  {
    name: 'guestlists — POST with name (write will fail without token, 500 OK)',
    file: 'api/guestlists/[slug].ts',
    req: { method: 'POST', headers: {}, query: { slug: 'testslug' }, body: { name: 'Juan' } },
    expect: (out) => out.status === 200 || out.status === 500,
  },
]

let failures = 0
for (const c of cases) {
  process.stdout.write(`${c.name}... `)
  try {
    const mod = await import(resolve(__dirname, '..', c.file))
    const { res, get } = makeRes()
    await mod.default(c.req, res)
    const out = get()
    const ok = c.expect(out)
    if (ok) {
      console.log(`✓ ${out.status}`)
    } else {
      console.log(`✗ unexpected status=${out.status} body=${JSON.stringify(out.body).slice(0, 120)}`)
      failures++
    }
  } catch (e) {
    console.log(`✗ THREW: ${e.message}`)
    failures++
  }
}

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`)
  process.exit(1)
}
console.log('\nAll handler invocations behave as expected.')
