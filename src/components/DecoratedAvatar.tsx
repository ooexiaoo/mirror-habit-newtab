import { useEffect, useState, type CSSProperties } from 'react'
import { decorationFor } from '../lib/decorations'
import { proxiedImageUrl } from '../lib/imageProxy'

/**
 * The site's avatar with its decoration overlay, in extension form: a circular
 * photo core plus the decoration art scaled around it. Mirrors the app's
 * AvatarAdornment two-layer swap — the still shows first, and the loop fades
 * in once it has decoded (no blank avatar while ~1 MB streams).
 */
export function DecoratedAvatar({
  effect,
  avatarUrl,
  name,
  size = 24,
  animate = true,
  className,
}: {
  effect?: string | null
  avatarUrl?: string | null
  name?: string | null
  size?: number
  animate?: boolean
  className?: string
}) {
  const layer = decorationFor(effect)
  const [decoFailed, setDecoFailed] = useState(false)
  const [loopState, setLoopState] = useState<'idle' | 'ready' | 'failed'>('idle')

  useEffect(() => {
    setLoopState('idle')
    setDecoFailed(false)
  }, [effect])

  const motionOff =
    document.documentElement.dataset.reduceMotion === 'true' ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  const loop = decoFailed || !animate || motionOff ? undefined : layer?.loop

  const initials =
    (name ?? '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('') || '?'

  return (
    <span
      className={`profile-avatar${className ? ` ${className}` : ''}`}
      style={{ '--profile-avatar-size': `${size}px` } as CSSProperties}
    >
      <span className="profile-avatar__core">
        {avatarUrl ? (
          <img
            src={proxiedImageUrl(avatarUrl, { w: size > 40 ? 96 : 64 })}
            alt=""
            className="profile-avatar__image"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="profile-avatar__initials">{initials}</span>
        )}
      </span>
      {layer && !decoFailed ? (
        <>
          <img
            src={layer.still}
            alt=""
            aria-hidden
            className={`profile-avatar__decoration profile-avatar__decoration--still${loopState === 'ready' ? ' profile-avatar__decoration--hidden' : ''}`}
            style={{ transform: `scale(${layer.zoom})` }}
            loading="lazy"
            decoding="async"
            onError={() => {
              setDecoFailed(true)
              console.info('[mirror-habit] decoration did not load:', effect, layer.still)
            }}
          />
          {loop && loopState !== 'failed' ? (
            <img
              src={loop}
              alt=""
              aria-hidden
              className={`profile-avatar__decoration profile-avatar__decoration--loop ${loopState === 'ready' ? 'profile-avatar__decoration--visible' : 'profile-avatar__decoration--hidden'}`}
              style={{ transform: `scale(${layer.zoom})` }}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoopState('ready')}
              onError={() => {
                setLoopState('failed')
                console.info('[mirror-habit] decoration loop did not load:', effect, loop)
              }}
            />
          ) : null}
        </>
      ) : null}
    </span>
  )
}
