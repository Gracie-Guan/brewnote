import { useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useBrewProfiles } from '../../hooks/useBrewProfiles'
import beanIcon from '../../assets/bean_icon_fill.svg'

export default function LogBrewDrawer({ bean, householdId, onClose, onBeanUpdated, onBeanArchived }) {
  const { user } = useAuth()
  const { profiles, loading: profilesLoading } = useBrewProfiles(householdId)

  const [selectedMethod, setSelectedMethod] = useState(null)
  const [selectedPortion, setSelectedPortion] = useState(null)
  const [dose, setDose] = useState(15)
  const [isCustom, setIsCustom] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [closing, setClosing] = useState(false)

  function handleClose() {
    if (closing) return
    setClosing(true)
    setTimeout(onClose, 300)
  }

  // Unique method names from profiles
  const methodNames = useMemo(() => {
    return [...new Set(profiles.map(p => p.method_name))]
  }, [profiles])

  // Portions available for selected method
  const availablePortions = useMemo(() => {
    if (!selectedMethod) return []
    return profiles
      .filter(p => p.method_name === selectedMethod)
      .map(p => p.portion)
      .sort((a, b) => a - b)
  }, [profiles, selectedMethod])

  function handleMethodSelect(method) {
    setSelectedMethod(method)
    setIsCustom(false)
    const methodProfiles = profiles.filter(p => p.method_name === method)
    const defaultProfile = methodProfiles.find(p => p.portion === 1) ?? methodProfiles[0]
    if (defaultProfile) {
      setSelectedPortion(defaultProfile.portion)
      setDose(defaultProfile.grams)
    }
  }

  function handlePortionSelect(portion) {
    if (portion === 'custom') {
      setIsCustom(true)
      setSelectedPortion('custom')
      return
    }
    setIsCustom(false)
    setSelectedPortion(portion)
    const profile = profiles.find(p => p.method_name === selectedMethod && p.portion === portion)
    if (profile) setDose(profile.grams)
  }

  function handleDoseInput(val) {
    const n = parseInt(val, 10)
    if (!isNaN(n) && n >= 1) setDose(Math.min(n, bean.current_weight_g))
  }

  async function handleConfirm() {
    if (!dose || dose < 1 || submitting) return
    setSubmitting(true)

    const matchedProfile = (!isCustom && selectedMethod && selectedPortion && selectedPortion !== 'custom')
      ? profiles.find(p => p.method_name === selectedMethod && p.portion === selectedPortion)
      : null

    const { error: logErr } = await supabase
      .from('consumption_logs')
      .insert({
        bean_id: bean.id,
        household_id: householdId,
        user_id: user.id,
        brew_profile_id: matchedProfile?.id ?? null,
        grams_used: dose,
      })

    if (logErr) {
      setSubmitting(false)
      return
    }

    const newWeight = bean.current_weight_g - dose
    const willArchive = newWeight <= 0

    const updatePayload = { current_weight_g: Math.max(newWeight, 0) }
    if (willArchive) {
      updatePayload.status = 'archived'
      updatePayload.archived_at = new Date().toISOString()
    }

    await supabase.from('beans').update(updatePayload).eq('id', bean.id)

    setSubmitting(false)
    if (willArchive) {
      onBeanArchived?.(bean.name)
    } else {
      onBeanUpdated?.()
    }
    handleClose()
  }

  const sliderMax = Math.max(bean.current_weight_g, 1)
  const canConfirm = dose >= 1 && dose <= bean.current_weight_g && !submitting && (isCustom || selectedPortion !== null)
  const indicatorPct = ((dose - 1) / Math.max(sliderMax - 1, 1)) * 100

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          ...styles.backdrop,
          animation: closing ? 'fade-out 0.3s ease forwards' : 'fade-in 0.2s ease',
        }}
      />

      {/* Drawer */}
      <div style={{
        ...styles.drawer,
        animation: closing ? 'slide-down-out 0.3s ease-in forwards' : 'slide-up 0.3s ease-out',
      }}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.beanIconCircle}>
            <img src={beanIcon} width={28} height={28} alt="" style={{ display: 'block' }} />
          </div>
          <div style={styles.headerText}>
            <div style={styles.coffeLogLabel}>Coffee Log</div>
            <div style={styles.beanName}>{bean.name}</div>
          </div>
        </div>

        {/* Brew with */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Brew with</div>
          {profilesLoading ? (
            <div style={styles.loadingText}>loading…</div>
          ) : (
            <div style={styles.pillGrid}>
              {methodNames.map(method => (
                <button
                  key={method}
                  onClick={() => handleMethodSelect(method)}
                  style={{
                    ...styles.largePill,
                    ...(selectedMethod === method && !isCustom
                      ? styles.largePillSelected
                      : styles.largePillUnselected),
                  }}
                >
                  {method}
                </button>
              ))}
              <button style={{ ...styles.largePill, ...styles.largePillCustom }}>
                +
              </button>
            </div>
          )}
        </div>

        {/* Portion */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Portion</div>
          <div style={styles.pillRow}>
            {[1, 2].map(p => {
              const available = !selectedMethod || availablePortions.includes(p)
              const active = selectedPortion === p && !isCustom
              return (
                <button
                  key={p}
                  onClick={() => available && handlePortionSelect(p)}
                  disabled={!available}
                  style={{
                    ...styles.largePill,
                    ...styles.portionPillSize,
                    ...(active ? styles.largePillSelected : styles.largePillUnselected),
                    ...(!available ? styles.largePillCustom : {}),
                  }}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => handlePortionSelect('custom')}
              style={{
                ...styles.largePill,
                ...styles.portionPillSize,
                ...(isCustom ? styles.largePillSelected : styles.largePillCustom),
              }}
            >
              — g
            </button>
          </div>
        </div>

        {/* Dose */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Dose</div>
          <div style={styles.doseRow}>
            <span style={styles.doseValue}>{dose}</span>
            <span style={styles.gramsBadge}>grams</span>
          </div>

          {/* Tick-ruler slider */}
          <div style={styles.sliderWrapper}>
            {/* Tick marks + center line */}
            <div style={styles.tickTrack} />
            {/* Orange indicator */}
            <div
              style={{
                ...styles.tickIndicator,
                left: `${indicatorPct}%`,
              }}
            />
            {/* Invisible range input for interaction */}
            <input
              type="range"
              min={1}
              max={sliderMax}
              value={dose}
              onChange={e => setDose(Number(e.target.value))}
              className="tick-slider-input"
            />
          </div>
        </div>

        {/* Bottom buttons */}
        <div style={styles.bottomRow}>
          <button onClick={handleClose} style={styles.cancelBtn}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            style={{
              ...styles.confirmBtn,
              ...(!canConfirm ? styles.confirmBtnDisabled : {}),
            }}
          >
            {submitting ? 'Logging…' : 'Confirm Log'}
          </button>
        </div>

      </div>
    </>
  )
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(154, 143, 134, 0.45)',
    zIndex: 90,
  },
  drawer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(237, 235, 235, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px 20px 0 0',
    padding: '28px 24px 40px',
    zIndex: 100,
    maxHeight: '90dvh',
    overflowY: 'auto',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px',
  },
  beanIconCircle: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'var(--color-mid-roast)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  coffeLogLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    color: 'var(--color-taupe)',
    fontWeight: 400,
    letterSpacing: '0.02em',
  },
  beanName: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-heading-md)',
    fontWeight: 700,
    color: 'var(--color-dark)',
    lineHeight: 1.15,
  },

  // Sections
  section: {
    marginBottom: '28px',
  },
  sectionLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    fontWeight: 500,
    color: 'var(--color-dark)',
    marginBottom: '14px',
  },
  loadingText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-taupe)',
  },

  // Pill buttons (shared base)
  pillGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  pillRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  largePill: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    fontWeight: 500,
    padding: '14px 28px',
    borderRadius: '99px',
    border: 'none',
    cursor: 'pointer',
    lineHeight: 1,
    transition: 'background 0.15s, color 0.15s',
    whiteSpace: 'nowrap',
  },
  largePillUnselected: {
    background: 'var(--color-porcelain)',
    color: 'var(--color-dark)',
    boxShadow: '3px 4px 8px rgba(154,143,134,0.18), inset -1px -2px 3px rgba(255,255,255,0.8)',
  },
  largePillSelected: {
    background: 'var(--color-mid-roast)',
    color: 'var(--color-porcelain)',
    boxShadow: '2px 2px 6px rgba(74,57,51,0.25)',
  },
  largePillCustom: {
    background: 'rgba(154, 143, 134, 0.22)',
    color: 'var(--color-taupe)',
    boxShadow: 'none',
  },
  portionPillSize: {
    padding: '14px 24px',
    minWidth: '72px',
    textAlign: 'center',
  },

  // Dose display
  doseRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
    marginBottom: '20px',
  },
  doseValue: {
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    fontSize: '64px',
    lineHeight: 1,
    letterSpacing: '0.02em',
    color: 'var(--color-accent)',
    textShadow: '2px 4px 10px rgba(234, 104, 22, 0.3)',
  },
  gramsBadge: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    fontWeight: 500,
    color: 'var(--color-accent)',
    border: '1.5px solid rgba(234, 104, 22, 0.35)',
    borderRadius: '99px',
    padding: '4px 10px',
    marginBottom: '10px',
    background: 'rgba(234, 104, 22, 0.06)',
  },

  // Tick-ruler slider
  sliderWrapper: {
    position: 'relative',
    height: '40px',
    width: '100%',
  },
  tickTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    height: '28px',
    borderRadius: '4px',
    // Center horizontal line + vertical tick marks
    background: `
      linear-gradient(transparent 46%, rgba(154,143,134,0.3) 46%, rgba(154,143,134,0.3) 54%, transparent 54%),
      repeating-linear-gradient(
        90deg,
        rgba(154,143,134,0.3) 0px,
        rgba(154,143,134,0.3) 1.5px,
        transparent 1.5px,
        transparent 10px
      )
    `,
  },
  tickIndicator: {
    position: 'absolute',
    top: '4px',
    bottom: '4px',
    width: '3px',
    background: 'var(--color-accent)',
    borderRadius: '99px',
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
    boxShadow: '0 0 6px rgba(234,104,22,0.4)',
  },

  // Bottom buttons
  bottomRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  cancelBtn: {
    flex: '0 0 auto',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    fontWeight: 500,
    padding: '16px 28px',
    borderRadius: '99px',
    border: 'none',
    cursor: 'pointer',
    background: 'var(--color-porcelain)',
    color: 'var(--color-taupe)',
    boxShadow: '3px 4px 8px rgba(154,143,134,0.18), inset -1px -2px 3px rgba(255,255,255,0.8)',
  },
  confirmBtn: {
    flex: 1,
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    fontWeight: 600,
    padding: '16px',
    borderRadius: '99px',
    border: 'none',
    cursor: 'pointer',
    background: 'rgba(74, 57, 51, 0.85)',
    color: 'var(--color-porcelain)',
    boxShadow: '2px 2px 4px rgba(154,143,134,0.2), inset -2px -2px 2px rgba(255,255,255,0.3)',
    letterSpacing: '0.02em',
  },
  confirmBtnDisabled: {
    background: 'rgba(154, 143, 134, 0.3)',
    color: 'var(--color-taupe)',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
}
