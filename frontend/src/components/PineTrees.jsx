/**
 * Animated pine-tree loading indicator.
 * Three trees grow in sequence, loop indefinitely.
 * Uses .pine-grow / .pine-grow-2 / .pine-grow-3 keyframes from index.css.
 *
 * Props:
 *   size    – 'sm' | 'md' | 'lg'  (default 'md')
 *   label   – optional text below trees
 *   light   – render trees in white/translucent (for dark backgrounds)
 *   fullPage – center in a full-viewport overlay
 */
export default function PineTrees({ size = 'md', label, light = false, fullPage = false }) {
  const widths = { sm: 72, md: 108, lg: 160 }
  const w = widths[size] ?? 108
  const h = Math.round(w * 0.72)

  const fill1 = light ? 'rgba(255,255,255,0.55)' : 'var(--bd-moss-deep)'
  const fill2 = light ? 'rgba(255,255,255,0.85)' : 'var(--bd-moss)'
  const trunk  = light ? 'rgba(255,255,255,0.35)' : 'rgba(26,32,36,0.30)'
  const ground = light ? 'rgba(255,255,255,0.20)' : 'var(--bd-rule)'

  // All coordinates are in the 100×72 viewBox
  const Tree = ({ cx, topY, trunkY, classes }) => {
    const h1 = 16, h2 = 14, h3 = 14
    const w1 = 13, w2 = 17, w3 = 20
    return (
      <g
        className={classes}
        style={{ transformOrigin: `${cx}px ${trunkY + 8}px` }}
      >
        <polygon
          points={`${cx},${topY} ${cx + w1},${topY + h1} ${cx - w1},${topY + h1}`}
          fill={fill1}
        />
        <polygon
          points={`${cx},${topY + h1 - 4} ${cx + w2},${topY + h1 + h2 - 4} ${cx - w2},${topY + h1 + h2 - 4}`}
          fill={fill2}
        />
        <polygon
          points={`${cx},${topY + h1 + h2 - 8} ${cx + w3},${trunkY} ${cx - w3},${trunkY}`}
          fill={fill1}
          opacity="0.92"
        />
        <rect x={cx - 2.5} y={trunkY} width="5" height="7" rx="1" fill={trunk} />
      </g>
    )
  }

  const svg = (
    <svg
      width={w}
      height={h}
      viewBox="0 0 100 72"
      fill="none"
      aria-label="Loading…"
      role="img"
    >
      <Tree cx={18}  topY={16} trunkY={52} classes="pine-grow"   />
      <Tree cx={50}  topY={8}  trunkY={56} classes="pine-grow-2" />
      <Tree cx={82}  topY={18} trunkY={50} classes="pine-grow-3" />
      <line x1="2" y1="64" x2="98" y2="64" stroke={ground} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )

  const inner = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
      {svg}
      {label && (
        <p style={{
          fontSize: '0.8rem',
          fontWeight: 500,
          color: light ? 'rgba(255,255,255,0.60)' : 'var(--bd-ink-mute)',
          margin: 0,
        }}>
          {label}
        </p>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bd-bg)',
        zIndex: 50,
      }}>
        {inner}
      </div>
    )
  }

  return inner
}
