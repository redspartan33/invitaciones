// Free anonymous URL shortener. Wraps a long invitation URL into something
// like `https://tinyurl.com/abc1234` (7-char code, ~27 chars total). CORS is
// open from any origin, so the call runs entirely from the browser.
const TINYURL_API = 'https://tinyurl.com/api-create.php'

export async function shortenUrl(longUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`${TINYURL_API}?url=${encodeURIComponent(longUrl)}`)
    if (!res.ok) return null
    const text = (await res.text()).trim()
    if (!text.startsWith('http')) return null
    return text
  } catch {
    return null
  }
}
