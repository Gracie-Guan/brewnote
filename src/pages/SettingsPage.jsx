import { useNavigate } from 'react-router-dom'
import { useHousehold } from '../hooks/useHousehold'
import { useBrewProfiles } from '../hooks/useBrewProfiles'
import AccountSettings from '../components/settings/AccountSettings'
import HouseholdSettings from '../components/settings/HouseholdSettings'
import BrewProfileSettings from '../components/settings/BrewProfileSettings'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { household, members, loading: hhLoading, refetch: refetchHousehold } = useHousehold()
  const { profiles, refetch: refetchProfiles } = useBrewProfiles(household?.id)

  if (hhLoading) {
    return (
      <div style={styles.loading}>
        <span style={styles.loadingText}>Loading…</span>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button type="button" style={styles.backBtn} onClick={() => navigate('/beans')} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="var(--color-dark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 style={styles.heading}>Settings</h1>
      </div>

      <div style={styles.sections}>
        <AccountSettings />

        {household && (
          <HouseholdSettings
            household={household}
            members={members}
            refetch={refetchHousehold}
          />
        )}

        {household && (
          <BrewProfileSettings
            profiles={profiles}
            householdId={household.id}
            refetch={refetchProfiles}
          />
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    padding: '16px 20px 48px',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '24px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    marginLeft: '-4px',
    flexShrink: 0,
  },
  heading: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-light-roast)',
    margin: 0,
  },
  sections: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '40vh',
  },
  loadingText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-taupe)',
  },
}
