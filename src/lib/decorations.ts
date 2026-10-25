/**
 * Profile decoration registry for the extension. The site's catalog has ~640
 * entries that weigh ~5.2 MB; the extension only needs to recognise an
 * equipped decoration and render its frames.
 *
 * Art loads over the network like the app does: stills come from the site
 * bundle (`decorations/…`), catalog loops stream from the immutable decorations
 * host. Nothing is bundled; one download per decoration per device, then
 * browser-cached.
 */

const SITE = 'https://mirrorhabit.pages.dev'
const LOOPS = 'https://mirror-habit-decorations.pages.dev'

/** The reward set, same keys and zooms as the site's REWARDS map. Still is the
 *  `_sm` frame; `anim` is the shipped loop (when art has one). */
const REWARDS: Record<string, { src: string; anim: string; zoom: number }> = {
  'dark-fantasy': { src: 'dark_fantasy_sm.webp', anim: 'dark_fantasy_lg_anim.webp', zoom: 1.5 },
  'shadow-portal': { src: 'shadow_portal_sm.webp', anim: 'shadow_portal_lg_anim.webp', zoom: 1.35 },
  'first-step': { src: 'first_step_sm.webp', anim: 'first_step_lg_anim.webp', zoom: 1.45 },
  'lvl-1_swift': { src: 'lvl-1_swift_sm.webp', anim: 'lvl-1_swift_lg_anim.webp', zoom: 1.6 },
  'lvl-2_sturdy': { src: 'lvl-2_sturdy_sm.webp', anim: 'lvl-2_sturdy_lg_anim.webp', zoom: 1.6 },
  'lvl-3_gritty': { src: 'lvl-3_gritty_sm.webp', anim: 'lvl-3_gritty_lg_anim.webp', zoom: 1.6 },
  'lvl-4_fearless': { src: 'lvl-4_fearless_sm.webp', anim: 'lvl-4_fearless_lg_anim.webp', zoom: 1.6 },
  'lvl-12_mythical': { src: 'lvl-12_mythical_sm.webp', anim: 'lvl-12_mythical_lg_anim.webp', zoom: 1.6 },
  'lvl-13_godslayer': { src: 'lvl-13_godslayer_sm.webp', anim: 'lvl-13_godslayer_lg_anim.webp', zoom: 1.6 },
}

const CATALOG_ZOOM = 1.2

/**
 * Legacy rows store achievement rewards snake_case (`first_step`, or
 * `ach-first_step`), while the art is keyed on the hyphenated id. Levels keep
 * their underscore (`lvl-1_swift`) verbatim, so try both forms.
 */
function rewardFor(effect: string) {
  return (
    REWARDS[effect] ??
    (effect.startsWith('ach-') ? REWARDS[effect.slice(4)] : undefined) ??
    REWARDS[effect.replace(/_/g, '-')] ??
    undefined
  )
}

export interface DecorationFrame {
  /** Small still — drawn first, hidden once the loop is ready. */
  still: string
  /** Looping variant; deferred until it decodes. */
  loop?: string
  zoom: number
}

export function decorationFor(effect: string | null | undefined): DecorationFrame | null {
  if (!effect) return null
  const reward = rewardFor(effect)
  if (reward) {
    return {
      still: `${SITE}/decorations/${reward.src}`,
      loop: `${SITE}/decorations/${reward.anim}`,
      zoom: reward.zoom,
    }
  }
  // Catalog ids always start with `dc-`; the suffix after `dc-` is the file stem.
  if (!effect.startsWith('dc-')) return null
  return {
    still: `${SITE}/decorations/catalog/${effect.slice(3)}.avif`,
    loop: `${LOOPS}/${effect.slice(3)}.png`,
    zoom: CATALOG_ZOOM,
  }
}
