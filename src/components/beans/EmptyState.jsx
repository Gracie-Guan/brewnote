export default function EmptyState() {
  return (
    <div style={styles.container}>
      <div style={styles.jarWrapper}>
        {/* Lid */}
        <div style={styles.lid} />
        {/* Body — empty jar with sticky note inside */}
        <div style={styles.jarBody}>
          <div style={styles.stickyNote}>
            <p style={styles.noteHeading}>
              Jar is empty<br />Brew is ready
            </p>
            <p style={styles.noteSubtext}>
              Add the coffee you're brewing, remember the ones worth buying again.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '20px',
    paddingBottom: '16px',
    gap: '32px',
  },
  jarWrapper: {
    position: 'relative',
    width: '320px',
    height: '530px',
  },
  lid: {
    position: 'absolute',
    width: '300px',
    height: '40px',
    left: '10px',
    top: '0px',
    background: 'rgba(237, 235, 235, 0.1)',
    boxShadow: '6px 18px 16px rgba(154,143,134,0.25), inset 3px -1px 10px 8px rgba(255,255,255,0.8), inset 0px -20px 8px 8px rgba(100,77,66,0.2)',
    borderRadius: '8px',
    zIndex: 2,
  },
  jarBody: {
    position: 'absolute',
    boxSizing: 'border-box',
    width: '320px',
    height: '490px',
    left: '0px',
    top: '40px',
    background: 'rgba(245, 244, 237, 0.1)',
    boxShadow: '6px 18px 16px rgba(154,143,134,0.25), inset -2px -8px 10px 8px rgba(255,255,255,0.8)',
    borderRadius: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stickyNote: {
    width: '230px',
    padding: '20px',
    background: 'linear-gradient(160deg, #F5F0E8 0%, #EDE8D8 100%)',
    border: '1px solid #E0D9C8',
    borderRadius: '4px',
    boxShadow: '2px 4px 12px rgba(62,50,50,0.15)',
    transform: 'rotate(-1.5deg)',
  },
  noteHeading: {
    fontFamily: '"Courier Prime", monospace',
    fontSize: '20px',
    fontWeight: 700,
    color: '#130801',
    lineHeight: 1.35,
    margin: '0 0 12px 0',
  },
  noteSubtext: {
    fontFamily: '"Courier Prime", monospace',
    fontSize: '13px',
    fontWeight: 400,
    color: '#4A3933',
    lineHeight: 1.5,
    margin: 0,
  },
}
