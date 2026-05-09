export default function TagPill({ label, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={selected ? styles.selected : styles.unselected}
    >
      {label}
    </button>
  )
}

const base = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-small)',
  fontWeight: 400,
  borderRadius: '99px',
  padding: '6px 14px',
  cursor: 'pointer',
  border: 'none',
  lineHeight: 1,
  transition: 'background 0.15s ease, color 0.15s ease',
  whiteSpace: 'nowrap',
}

const styles = {
  unselected: {
    ...base,
    background: 'var(--color-porcelain)',
    border: '1px solid #FFFFFF',
    color: 'var(--color-mid-roast)',
  },
  selected: {
    ...base,
    background: 'var(--color-mid-roast)',
    border: '1px solid #3E3232',
    color: 'var(--color-porcelain)',
  },
}
