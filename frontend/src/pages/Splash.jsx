import { Link } from 'react-router-dom'

// Large decorative pine silhouettes for the background
function ForestSilhouette() {
  const trees = [
    { cx: -2,  h: 220, w: 70 },
    { cx: 60,  h: 290, w: 85 },
    { cx: 130, h: 240, w: 78 },
    { cx: 195, h: 310, w: 90 },
    { cx: 270, h: 260, w: 80 },
    { cx: 335, h: 330, w: 96 },
    { cx: 410, h: 270, w: 82 },
    { cx: 472, h: 300, w: 88 },
    { cx: 540, h: 245, w: 75 },
    { cx: 600, h: 310, w: 90 },
    { cx: 670, h: 255, w: 78 },
    { cx: 725, h: 280, w: 84 },
    { cx: 790, h: 230, w: 72 },
  ]

  const vbH = 360
  return (
    <svg
      viewBox={`0 0 800 ${vbH}`}
      preserveAspectRatio="xMidYMax slice"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: '55%',
        opacity: 0.28,
        pointerEvents: 'none',
      }}
    >
      {trees.map(({ cx, h, w }, i) => {
        const base = vbH
        const l1h = Math.round(h * 0.32)
        const l2h = Math.round(h * 0.34)
        const l3h = Math.round(h * 0.34)
        const l1w = Math.round(w * 0.42)
        const l2w = Math.round(w * 0.72)
        const l3w = w
        const y1 = base - h
        const y2 = base - h + l1h + Math.round(l1h * 0.18)
        const y3 = base - h + l1h + l2h + Math.round(l2h * 0.16)
        const trunkW = 5
        const trunkH = 18
        return (
          <g key={i} fill="#8bba2e">
            <polygon points={`${cx},${y1} ${cx + l1w},${y1 + l1h} ${cx - l1w},${y1 + l1h}`} />
            <polygon points={`${cx},${y2} ${cx + l2w},${y2 + l2h} ${cx - l2w},${y2 + l2h}`} />
            <polygon points={`${cx},${y3} ${cx + l3w},${base} ${cx - l3w},${base}`} />
            <rect x={cx - trunkW / 2} y={base} width={trunkW} height={trunkH} rx="1" fill="#2c6e5a" />
          </g>
        )
      })}
    </svg>
  )
}

export default function Splash() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(168deg, #07140d 0%, #0f2a1c 30%, #1a4035 60%, #0d2218 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem 6rem',
      }}
    >
      {/* Stars / dots texture */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.18,
          pointerEvents: 'none',
        }}
      />

      {/* Forest silhouette */}
      <ForestSilhouette />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '520px',
          width: '100%',
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '1.1rem',
            fontStyle: 'italic',
            letterSpacing: '0.28em',
            color: 'rgba(255,255,255,0.55)',
            textTransform: 'uppercase',
            marginBottom: '3rem',
          }}
        >
          Wildr
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 'clamp(2.4rem, 9vw, 3.8rem)',
            fontWeight: 800,
            lineHeight: 1.08,
            color: '#ffffff',
            margin: '0 0 1.5rem',
            letterSpacing: '-0.02em',
          }}
        >
          Your city is{' '}
          <em
            style={{
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
              color: '#8bba2e',
            }}
          >
            wildr
          </em>{' '}
          than you think.
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontSize: '1.05rem',
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.58)',
            margin: '0 0 3rem',
            maxWidth: '380px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Discover the wildlife living right outside your door. Identify species, log sightings, explore your local wild.
        </p>

        {/* CTA */}
        <Link
          to="/register"
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '340px',
            margin: '0 auto 1.1rem',
            padding: '1rem 2rem',
            borderRadius: '999px',
            fontSize: '1rem',
            fontWeight: 700,
            textDecoration: 'none',
            background: '#8bba2e',
            color: '#0f2a1c',
            letterSpacing: '0.01em',
            boxShadow: '0 4px 24px rgba(139,186,46,0.30)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(139,186,46,0.40)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = ''
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(139,186,46,0.30)'
          }}
        >
          Start Exploring
        </Link>

        {/* Log in link */}
        <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.38)', margin: 0 }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: 'rgba(255,255,255,0.72)',
              fontWeight: 600,
              textDecoration: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.25)',
              paddingBottom: '1px',
            }}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
