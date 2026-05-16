import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

export default function Splash() {
  const [photo, setPhoto] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/photos/auth-panel?page=splash`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.photo_url) setPhoto(d) })
      .catch(() => {})
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#07140d',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem 6rem',
      }}
    >
      {/* Photo background */}
      {photo?.photo_url && (
        <img
          src={photo.photo_url}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      )}

      {/* Gradient overlay — darker at top/bottom for legibility */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(168deg, rgba(7,20,13,0.72) 0%, rgba(15,42,28,0.45) 45%, rgba(7,20,13,0.80) 100%)',
        }}
      />

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

        <h1
          style={{
            fontSize: 'clamp(2.4rem, 9vw, 3.8rem)',
            fontWeight: 800,
            lineHeight: 1.08,
            color: '#ffffff',
            margin: '0 0 1.5rem',
            letterSpacing: '-0.02em',
            textShadow: '0 2px 24px rgba(0,0,0,0.40)',
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

        <p
          style={{
            fontSize: '1.05rem',
            lineHeight: 1.65,
            color: 'rgba(255,255,255,0.65)',
            margin: '0 0 3rem',
            maxWidth: '380px',
            marginLeft: 'auto',
            marginRight: 'auto',
            textShadow: '0 1px 8px rgba(0,0,0,0.30)',
          }}
        >
          Discover the wildlife living right outside your door. Identify species, log sightings, explore your local wild.
        </p>

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
            boxShadow: '0 4px 24px rgba(139,186,46,0.35)',
          }}
        >
          Start Exploring
        </Link>

        <Link
          to="/login"
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '340px',
            margin: '0 auto 2rem',
            padding: '1rem 2rem',
            borderRadius: '999px',
            fontSize: '1rem',
            fontWeight: 600,
            textDecoration: 'none',
            background: 'rgba(255,255,255,0.10)',
            color: 'rgba(255,255,255,0.85)',
            border: '1.5px solid rgba(255,255,255,0.22)',
            letterSpacing: '0.01em',
          }}
        >
          Log in
        </Link>

        {/* Unsplash attribution */}
        {photo?.photographer && (
          <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.30)', margin: 0 }}>
            Photo by{' '}
            <a
              href={photo.photographer_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'underline' }}
            >
              {photo.photographer}
            </a>{' '}
            on{' '}
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'underline' }}
            >
              Unsplash
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
