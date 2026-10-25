import { useEffect, useState } from 'react'
import { loadWallpaper } from '../lib/wallpaper'
import type { BackgroundSettings } from '../lib/settings'

export function useWallpaper(background: BackgroundSettings): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    if (background.kind !== 'image' || !background.wallpaperId) {
      setUrl(null)
      return () => undefined
    }

    loadWallpaper(background.wallpaperId)
      .then((blob) => {
        if (cancelled) return
        if (!blob) {
          setUrl(null)
          return
        }
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [background.kind, background.wallpaperId])

  return url
}
