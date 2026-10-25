export interface ProxyOptions {
  w?: number
}

const WSXV_HOST = 'wsrv.nl'

/** Reuses the site's image proxy; the extension shares the same origin. */
export function proxiedImageUrl(url: string, opts: ProxyOptions = {}): string {
  if (!url) return url
  if (!/^https?:\/\//i.test(url)) return url
  try {
    const parsed = new URL(url)
    if (parsed.hostname === WSXV_HOST) return url
  } catch {
    return url
  }
  const params = new URLSearchParams({ url, output: 'webp' })
  if (opts.w) params.set('w', String(opts.w))
  return `https://${WSXV_HOST}/?${params.toString()}`
}
