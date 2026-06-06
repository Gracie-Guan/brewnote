import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    if (data.session) {
      navigate(inviteToken ? `/invite/${inviteToken}` : '/beans')
    } else {
      setConfirmMessage('Check your email to confirm your account, then sign in.')
    }
  }

  async function handleGoogleRegister() {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/beans` },
    })
    if (error) setError(error.message)
  }

  if (confirmMessage) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.brandRow}>
            <img src="/icons/icon-512.png" alt="BrewNote" width={72} height={72} style={styles.logo} />
            <h1 style={styles.title}>BrewNote</h1>
          </div>
          <p style={styles.confirmText}>{confirmMessage}</p>
          <Link to="/login" style={{ ...styles.link, textAlign: 'center', display: 'block' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brandRow}>
          <img src="/icons/icon-512.png" alt="BrewNote" width={72} height={72} style={styles.logo} />
          <h1 style={styles.title}>BrewNote</h1>
        </div>

        <form onSubmit={handleRegister} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            style={styles.input}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.primaryBtn}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        <button onClick={handleGoogleRegister} style={styles.googleBtn}>
          Continue with Google
        </button>

        <p style={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(360deg, rgba(74,57,51,0.1) 0%, rgba(100,77,66,0.1) 18.27%, rgba(154,143,134,0.1) 34.13%, rgba(237,235,235,0.1) 100%), #EDEBEB',
  },
  card: {
    width: '100%',
    maxWidth: '360px',
    background: 'rgba(237,235,235,0.7)',
    border: '3px solid rgba(255,255,255,0.2)',
    boxShadow: '0px -4px 16px 4px rgba(154,143,134,0.2)',
    backdropFilter: 'blur(16px)',
    borderRadius: '16px',
    padding: '36px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  brandRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  logo: {
    display: 'block',
    borderRadius: '16px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '32px',
    fontWeight: 700,
    color: 'var(--color-mid-roast)',
    margin: 0,
    textAlign: 'center',
  },
  confirmText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-dark)',
    textAlign: 'center',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    padding: '12px 16px',
    borderRadius: '99px',
    border: '1px solid rgba(154,143,134,0.2)',
    background: 'rgba(154,143,134,0.3)',
    color: 'var(--color-dark)',
    outline: 'none',
    transition: 'background 0.15s',
  },
  error: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-lychee)',
    margin: 0,
  },
  primaryBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    fontWeight: 500,
    padding: '13px 24px',
    borderRadius: '99px',
    border: 'none',
    background: 'rgba(74,57,51,0.8)',
    color: 'var(--color-porcelain)',
    boxShadow: '2px 2px 4px rgba(154,143,134,0.2), inset -2px -2px 2px rgba(255,255,255,0.3)',
    cursor: 'pointer',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'rgba(154,143,134,0.3)',
  },
  dividerText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-taupe)',
  },
  googleBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    fontWeight: 500,
    padding: '13px 24px',
    borderRadius: '99px',
    border: '1.5px solid rgba(154,143,134,0.3)',
    background: 'rgba(245,244,237,0.6)',
    color: 'var(--color-accent)',
    boxShadow: '4px 6px 8px rgba(154,143,134,0.2), inset -2px -2px 2px rgba(255,255,255,0.8)',
    cursor: 'pointer',
  },
  switchText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-taupe)',
    textAlign: 'center',
    margin: 0,
  },
  link: {
    color: 'var(--color-accent)',
    textDecoration: 'none',
    fontWeight: 500,
  },
}
