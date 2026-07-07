const TEETH = 14

function Gear({ size, className }: { size: number; className: string }) {
  const step = 360 / TEETH
  return (
    <svg
      className={className}
      viewBox="-52 -52 104 104"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <g stroke="#1D1719" strokeWidth="1.2">
        {Array.from({ length: TEETH }, (_, i) => (
          <rect key={i} x="-4.5" y="-51" width="9" height="14" fill="#C9AEB2" transform={`rotate(${i * step})`} />
        ))}
        <circle r="40" fill="#E9DFC8" />
        <circle r="27" fill="#F5EDDC" />
        {Array.from({ length: 5 }, (_, i) => (
          <circle key={i} r="5.5" cx="17" fill="#E9DFC8" transform={`rotate(${i * 72})`} />
        ))}
        <circle r="8" fill="#A98F98" />
      </g>
    </svg>
  )
}

/** Fixed background layer: slow parallax gears + drifting steam wisps. */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <Gear size={460} className="gear gear--a" />
      <Gear size={380} className="gear gear--b" />
      <Gear size={260} className="gear gear--c" />
      <div className="steam steam--a" />
      <div className="steam steam--b" />
    </div>
  )
}
