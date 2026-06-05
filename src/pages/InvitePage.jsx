import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PillButton from '../components/ui/PillButton'

export default function InvitePage() {
  const { token } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [invite, setInvite] = useState(null)
  const [status, setStatus] = useState('loading') // loading | valid | invalid | joining | joined | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (authLoading) return

    async function validateToken() {
      const { data, error } = await supabase
        .from('household_invites')
        .select('id, household_id, expires_at, used, households(name)')
        .eq('token', token)
        .single()

      if (error || !data) {
        setStatus('invalid')
        setErrorMsg('This invite link is invalid.')
        return
      }

      if (data.used || new Date(data.expires_at) < new Date()) {
        setStatus('invalid')
        setErrorMsg('This invite link has expired or already been used.')
        return
      }

      setInvite(data)
      setStatus('valid')
    }

    validateToken()
  }, [token, authLoading])

  async function handleJoin() {
    setStatus('joining')

    // Check if already a member
    const { data: existing } = await supabase
      .from('household_members')
      .select('id')
      .eq('household_id', invite.household_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase
        .from('household_members')
        .insert({ household_id: invite.household_id, user_id: user.id })

      if (error) {
        setStatus('error')
        setErrorMsg('Could not join household. Please try again.')
        return
      }
    }

    // Mark invite used
    await supabase.from('household_invites').update({ used: true }).eq('id', invite.id)

    setStatus('joined')
    setTimeout(() => navigate('/beans'), 1500)
  }

  const householdName = invite?.households?.name ?? 'a household'

  if (authLoading || status === 'loading') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <span style={styles.muted}>Checking invite…</span>
        </div>
      </div>
    )
  }

  if (status === 'invalid' || status === 'error') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>BrewNote</h1>
          <p style={styles.errorText}>{errorMsg}</p>
          <Link to="/beans" style={styles.link}>Go to app</Link>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>BrewNote</h1>
          <p style={styles.subtitle}>You've been invited to join</p>
          <p style={styles.householdName}>{householdName}</p>
          <p style={styles.muted}>Create an account or log in to accept this invite.</p>
          <div style={styles.authActions}>
            <Link to={`/register?invite=${token}`} style={styles.linkBtn}>Create Account</Link>
            <Link to={`/login?invite=${token}`} style={styles.linkBtnSecondary}>Log In</Link>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'joined') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>BrewNote</h1>
          <p style={styles.successText}>You've joined {householdName}! Redirecting…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>BrewNote</h1>
        <p style={styles.subtitle}>You've been invited to join</p>
        <p style={styles.householdName}>{householdName}</p>
        <PillButton
          onClick={handleJoin}
          variant="dark"
          disabled={status === 'joining'}
          style={styles.joinBtn}
        >
          {status === 'joining' ? 'Joining…' : 'Join Household'}
        </PillButton>
        <Link to="/beans" style={styles.link}>Maybe later</Link>
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
    padding: '24px',
    background: 'linear-gradient(360deg, rgba(74,57,51,0.1) 0%, rgba(100,77,66,0.1) 18.27%, rgba(154,143,134,0.1) 34.13%, rgba(237,235,235,0.1) 100%), var(--color-bg)',
  },
  card: {
    background: 'rgba(237, 235, 235, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '20px',
    padding: '32px 28px',
    boxShadow: '2px 5px 16px rgba(62, 50, 50, 0.15)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    width: '100%',
    maxWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    textAlign: 'center',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-heading-lg)',
    color: 'var(--color-dark)',
    margin: 0,
  },
  subtitle: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-taupe)',
    margin: 0,
  },
  householdName: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-heading-sm)',
    color: 'var(--color-accent)',
    margin: 0,
  },
  muted: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-taupe)',
    margin: 0,
  },
  joinBtn: {
    width: '100%',
    height: '48px',
    fontSize: 'var(--text-label)',
    fontWeight: 600,
    marginTop: '8px',
  },
  link: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-taupe)',
    textDecoration: 'none',
  },
  linkBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    fontWeight: 500,
    color: 'var(--color-porcelain)',
    background: 'rgba(74, 57, 51, 0.8)',
    borderRadius: '99px',
    padding: '12px 24px',
    textDecoration: 'none',
    width: '100%',
    display: 'block',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  linkBtnSecondary: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-dark)',
    background: 'rgba(245, 244, 237, 0.6)',
    borderRadius: '99px',
    padding: '12px 24px',
    textDecoration: 'none',
    width: '100%',
    display: 'block',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  authActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
    marginTop: '8px',
  },
  errorText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-lychee)',
    margin: 0,
  },
  successText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-taupe)',
    margin: 0,
    fontStyle: 'italic',
  },
}
