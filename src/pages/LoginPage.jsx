import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/beans')
    }
  }

  async function handleGoogleLogin() {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/beans` },
    })
    if (error) setError(error.message)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>BrewNote</h1>
        <p style={styles.subtitle}>Coffee yet?</p>

        <form onSubmit={handleLogin} style={styles.form}>
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
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.primaryBtn}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerText}>or</span>
        </div>

        <button onClick={handleGoogleLogin} style={styles.ghostBtn}>
          Continue with Google
        </button>

        <p style={styles.switchText}>
          No account?{' '}
          <Link to="/register" style={styles.link}>
            Register
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
  title: {
    fontFamily: '"Courier Prime", monospace',
    fontSize: '32px',
    fontWeight: 700,
    color: '#130801',
    margin: 0,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '16px',
    color: '#9A8F86',
    margin: 0,
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '16px',
    padding: '12px 16px',
    borderRadius: '99px',
    border: '2px solid #F5F4ED',
    background: 'rgba(154,143,134,0.3)',
    color: '#130801',
    outline: 'none',
    transition: 'background 0.15s',
  },
  error: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '14px',
    color: '#B93006',
    margin: 0,
  },
  primaryBtn: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '16px',
    fontWeight: 500,
    padding: '13px 24px',
    borderRadius: '99px',
    border: 'none',
    background: 'rgba(74,57,51,0.8)',
    color: '#F5F4ED',
    boxShadow: '2px 2px 4px rgba(154,143,134,0.2), inset -2px -2px 2px rgba(255,255,255,0.3)',
    cursor: 'pointer',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dividerText: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '14px',
    color: '#9A8F86',
    margin: '0 auto',
  },
  ghostBtn: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '16px',
    fontWeight: 500,
    padding: '13px 24px',
    borderRadius: '99px',
    border: '1.5px solid rgba(154,143,134,0.5)',
    background: 'rgba(245,244,237,0.6)',
    color: '#130801',
    boxShadow: '4px 6px 8px rgba(154,143,134,0.2), inset -2px -2px 2px rgba(255,255,255,0.8)',
    cursor: 'pointer',
  },
  switchText: {
    fontFamily: '"DM Sans", sans-serif',
    fontSize: '14px',
    color: '#9A8F86',
    textAlign: 'center',
    margin: 0,
  },
  link: {
    color: '#EA6816',
    textDecoration: 'none',
    fontWeight: 500,
  },
}
