import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function SettingsPage() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={{ padding: '20px', fontFamily: '"DM Sans", sans-serif', color: '#130801' }}>
      <h2 style={{ fontFamily: '"Courier Prime", monospace' }}>Settings</h2>
      <p style={{ color: '#9A8F86' }}>Full settings — coming in step 10.</p>
      <button
        onClick={handleLogout}
        style={{
          marginTop: '16px',
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '16px',
          fontWeight: 500,
          padding: '12px 24px',
          borderRadius: '99px',
          border: 'none',
          background: 'rgba(74,57,51,0.8)',
          color: '#F5F4ED',
          cursor: 'pointer',
        }}
      >
        Log Out
      </button>
    </div>
  )
}
