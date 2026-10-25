interface ProgressRingProps {
  completed: number
  total: number
  size?: number
  stroke?: number
  className?: string
}

export function ProgressRing({
  completed,
  total,
  size = 72,
  stroke = 4,
  className = '',
}: ProgressRingProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = total > 0 ? Math.min(completed / total, 1) : 0
  const offset = circumference * (1 - ratio)

  return (
    <div
      className={`progress-ring ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${completed} of ${total} habits complete today`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className="progress-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="progress-ring__value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="progress-ring__label">
        <strong>{completed}</strong>
        <span>/</span>
        <span>{total}</span>
      </span>
    </div>
  )
}
