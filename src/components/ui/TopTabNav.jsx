import { Link, useLocation } from 'react-router-dom'

export default function TopTabNav() {
  const location = useLocation()
  const tabs = [
    { path: '/beans', label: 'Beans' },
    { path: '/past',  label: 'Past' },
  ]
  return (
    <div style={styles.topNav}>
      {tabs.map(tab => {
        const active = location.pathname === tab.path
        return (
          <div key={tab.path} style={styles.tabWrapper}>
            <Link
              to={tab.path}
              style={{ ...styles.tab, color: active ? 'var(--color-dark)' : 'var(--color-taupe)', fontWeight: active ? 600 : 400 }}
            >
              {tab.label}
            </Link>
            {active && <span style={styles.dot} />}
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  topNav: {
    display: 'flex',
    flexDirection: 'row',
    gap: '24px',
    padding: '12px 20px 0',
  },
  tabWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  tab: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-heading-sm)',
    textDecoration: 'none',
    lineHeight: 1,
    letterSpacing: '0.02em',
    transition: 'color 0.15s',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'transparent',
    border: '2px solid var(--color-accent)',
  },
}
