export default function WeatherIcon({ code = '01d', size = 44 }) {
  const base = typeof code === 'string' ? code.replace(/n$/, 'd') : '01d'
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 48 48',
    fill: 'none',
    stroke: 'white',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  if (base === '01d') {
    return (
      <svg {...p}>
        <circle cx="24" cy="24" r="9" />
        <line x1="24" y1="3" x2="24" y2="9" />
        <line x1="24" y1="39" x2="24" y2="45" />
        <line x1="3" y1="24" x2="9" y2="24" />
        <line x1="39" y1="24" x2="45" y2="24" />
        <line x1="9.6" y1="9.6" x2="13.9" y2="13.9" />
        <line x1="34.1" y1="34.1" x2="38.4" y2="38.4" />
        <line x1="38.4" y1="9.6" x2="34.1" y2="13.9" />
        <line x1="13.9" y1="34.1" x2="9.6" y2="38.4" />
      </svg>
    )
  }

  const cloud = 'M14 34c-4.4 0-8-3.6-8-8s3.6-8 8-8c.7 0 1.3.1 1.9.3C17 14.7 20.7 12 25 12c5.5 0 10 4.5 10 10h1c3.3 0 6 2.7 6 6s-2.7 6-6 6H14z'

  if (base === '02d') {
    return (
      <svg {...p}>
        <circle cx="13" cy="15" r="5" />
        <line x1="13" y1="4" x2="13" y2="7" />
        <line x1="13" y1="23" x2="13" y2="26" />
        <line x1="2" y1="15" x2="5" y2="15" />
        <line x1="21" y1="15" x2="24" y2="15" />
        <line x1="5.9" y1="7.9" x2="8.1" y2="10.1" />
        <line x1="17.9" y1="19.9" x2="20.1" y2="22.1" />
        <line x1="20.1" y1="7.9" x2="17.9" y2="10.1" />
        <line x1="8.1" y1="19.9" x2="5.9" y2="22.1" />
        <path d={cloud} strokeWidth="1.8" />
      </svg>
    )
  }

  if (base === '03d') {
    return (
      <svg {...p}>
        <path d={cloud} />
      </svg>
    )
  }

  if (base === '04d') {
    return (
      <svg {...p}>
        <path
          d="M10 30c-3.3 0-6-2.7-6-6s2.7-6 6-6c.4 0 .8 0 1.2.1C12.3 15.1 15.4 13 19 13c4.4 0 8 3.6 8 8h.5c2.5 0 4.5 2 4.5 4.5S30 30 27.5 30"
          strokeWidth="1.8"
        />
        <path
          d="M16 38c-4.4 0-8-3.6-8-8s3.6-8 8-8c.7 0 1.3.1 1.9.3C19 18.7 22.7 16 27 16c5.5 0 10 4.5 10 10h1c3.3 0 6 2.7 6 6s-2.7 6-6 6H16z"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  if (base === '09d') {
    return (
      <svg {...p}>
        <path d={cloud} strokeWidth="1.8" />
        <line x1="16" y1="38" x2="14" y2="45" strokeWidth="2.5" />
        <line x1="25" y1="38" x2="23" y2="45" strokeWidth="2.5" />
        <line x1="34" y1="38" x2="32" y2="45" strokeWidth="2.5" />
      </svg>
    )
  }

  if (base === '10d') {
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
        <line x1="4.9" y1="4.9" x2="7.5" y2="7.5" />
        <line x1="16.5" y1="16.5" x2="19.1" y2="19.1" />
        <line x1="19.1" y1="4.9" x2="16.5" y2="7.5" />
        <line x1="7.5" y1="16.5" x2="4.9" y2="19.1" />
        <path d={cloud} strokeWidth="1.8" />
        <line x1="20" y1="38" x2="18" y2="45" strokeWidth="2.5" />
        <line x1="30" y1="38" x2="28" y2="45" strokeWidth="2.5" />
      </svg>
    )
  }

  if (base === '11d') {
    return (
      <svg {...p}>
        <path d={cloud} strokeWidth="1.8" />
        <polyline points="26,34 21,42 27,42 21,50" strokeWidth="2.5" />
      </svg>
    )
  }

  if (base === '13d') {
    return (
      <svg {...p}>
        <path d={cloud} strokeWidth="1.8" />
        <circle cx="18" cy="41" r="2" fill="white" stroke="none" />
        <circle cx="26" cy="44" r="2" fill="white" stroke="none" />
        <circle cx="34" cy="41" r="2" fill="white" stroke="none" />
      </svg>
    )
  }

  if (base === '50d') {
    return (
      <svg {...p}>
        <line x1="6" y1="16" x2="42" y2="16" />
        <line x1="6" y1="24" x2="38" y2="24" />
        <line x1="6" y1="32" x2="42" y2="32" />
      </svg>
    )
  }

  return (
    <svg {...p}>
      <path d={cloud} />
    </svg>
  )
}
