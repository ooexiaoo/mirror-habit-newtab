export function MirrorMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="mirror-mark"
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
    >
      <ellipse cx="18" cy="15.5" rx="8.3" ry="11.3" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M12.6 15.1c1.5 4.1 6.7 5.3 10.3 1.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M18 26.8v4.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M14.8 30.9h6.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="18" cy="15.5" r="2.2" fill="currentColor" opacity=".18" />
    </svg>
  )
}
