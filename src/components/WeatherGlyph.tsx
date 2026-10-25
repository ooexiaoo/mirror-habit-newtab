import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { weatherCondition } from '../lib/weather'

interface WeatherGlyphProps {
  code: number
  isDay?: boolean
  size?: number
  strokeWidth?: number
}

export function WeatherGlyph({ code, isDay = true, size = 18, strokeWidth = 1.6 }: WeatherGlyphProps) {
  const condition = weatherCondition(code)
  let Icon: LucideIcon = isDay ? Sun : Moon

  switch (condition.kind) {
    case 'clear':
      Icon = isDay ? Sun : Moon
      break
    case 'partly':
      Icon = isDay ? CloudSun : CloudMoon
      break
    case 'cloudy':
      Icon = Cloud
      break
    case 'fog':
      Icon = CloudFog
      break
    case 'drizzle':
      Icon = CloudDrizzle
      break
    case 'rain':
    case 'showers':
      Icon = CloudRain
      break
    case 'snow':
      Icon = CloudSnow
      break
    case 'storm':
      Icon = CloudLightning
      break
    case 'hail':
      Icon = CloudHail
      break
  }

  return <Icon aria-hidden="true" size={size} strokeWidth={strokeWidth} />
}
