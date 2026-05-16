import { useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useBrewProfiles } from '../../hooks/useBrewProfiles'

export default function LogBrewDrawer({ bean, householdId, onClose, onBeanUpdated, onBeanArchived }) {
  const { user } = useAuth()
  const { profiles, loading: profilesLoading } = useBrewProfiles(householdId)

  const [selectedMethod, setSelectedMethod] = useState(null)
  const [selectedPortion, setSelectedPortion] = useState(null)
  const [dose, setDose] = useState(15)
  const [isCustom, setIsCustom] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
    // Auto-select portion 1 if available, else first available
    const methodProfiles = profiles.filter(p => p.method_name === method)
    const defaultProfile = methodProfiles.find(p => p.portion === 1) ?? methodProfiles[0]
    if (defaultProfile) {
      setSelectedPortion(defaultProfile.portion)
      setDose(defaultProfile.grams)
    }
  }

  function handlePortionSelect(portion) {
    setSelectedPortion(portion)
    const profile = profiles.find(p => p.method_name === selectedMethod && p.portion === portion)
    if (profile) setDose(profile.grams)
  }

  function handleCustom() {
    setIsCustom(true)
    setSelectedMethod(null)
    setSelectedPortion(null)
  }

  function handleDoseInput(val) {
    const n = parseInt(val, 10)
    if (!isNaN(n) && n >= 1) setDose(Math.min(n, bean.current_weight_g))
  }

  async function handleConfirm() {
    if (!dose || dose < 1 || submitting) return
    setSubmitting(true)

    const matchedProfile = (!isCustom && selectedMethod && selectedPortion)
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
    onClose()
    if (willArchive) {
      onBeanArchived?.(bean.name)
    } else {
      onBeanUpdated?.()
    }
  }

  const canConfirm = dose >= 1 && dose <= bean.current_weight_g && !submitting && (isCustom || (selectedMethod && selectedPortion))
  const sliderMax = Math.max(bean.current_weight_g, 1)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={styles.backdrop}
      />

      {/* Drawer */}
      <div style={styles.drawer}>
        {/* Drag handle */}
        <div style={styles.handle} />

        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.headerLabel}>Logging brew for</div>
            <div style={styles.beanName}>{bean.name}</div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Brew with */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Brew with</div>
          {profilesLoading ? (
            <div style={styles.loadingText}>loading…</div>
          ) : (
            <div style={styles.methodRow}>
              {methodNames.map(method => (
                <button
                  key={method}
                  onClick={() => handleMethodSelect(method)}
                  style={{
                    ...styles.methodBtn,
                    ...(selectedMethod === method && !isCustom ? styles.methodBtnActive : {}),
                  }}
                >
                  {method}
                </button>
              ))}
              <button
                onClick={handleCustom}
                style={{
                  ...styles.methodBtn,
                  ...(isCustom ? styles.methodBtnActive : {}),
                }}
              >
                +
              </button>
            </div>
          )}
        </div>

        {/* Portion selector — only when a profile method is selected */}
        {selectedMethod && !isCustom && availablePortions.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionLabel}>Portion</div>
            <div style={styles.portionRow}>
              {[1, 2].map(p => {
                const available = availablePortions.includes(p)
                return (
                  <button
                    key={p}
                    onClick={() => available && handlePortionSelect(p)}
                    style={{
                      ...styles.portionBtn,
                      ...(selectedPortion === p ? styles.portionBtnActive : {}),
                      ...(!available ? styles.portionBtnDisabled : {}),
                    }}
                    disabled={!available}
                  >
                    {p}×
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Dose display */}
        <div style={styles.doseSection}>
          <div style={styles.doseNumber}>
            <span style={styles.doseValue}>{dose}</span>
            <span style={styles.doseUnit}>g</span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={1}
            max={sliderMax}
            value={dose}
            onChange={e => setDose(Number(e.target.value))}
            style={styles.slider}
          />

          {/* Inline editable dose */}
          <div style={styles.doseInputRow}>
            <input
              type="number"
              min={1}
              max={bean.current_weight_g}
              value={dose}
              onChange={e => handleDoseInput(e.target.value)}
              style={styles.doseInput}
            />
            <span style={styles.doseInputLabel}>g  ·  {bean.current_weight_g}g remaining</span>
          </div>
        </div>

        {/* Confirm button */}
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
    </>
  )
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(154, 143, 134, 0.5)',
    zIndex: 90,
    animation: 'fade-in 0.2s ease',
  },
  drawer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(237, 235, 235, 0.85)',
    border: '3px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0px -4px 16px 4px rgba(154, 143, 134, 0.2)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '16px 16px 0 0',
    padding: '0 20px 40px',
    zIndex: 100,
    animation: 'slide-up 0.3s ease-out',
  },
  handle: {
    width: '36px',
    height: '4px',
    borderRadius: '99px',
    background: 'rgba(154, 143, 134, 0.4)',
    margin: '12px auto 20px',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  headerLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    color: 'var(--color-taupe)',
    marginBottom: '2px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  beanName: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-heading-sm)',
    fontWeight: 700,
    color: 'var(--color-dark)',
    lineHeight: 1.2,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-taupe)',
    padding: '4px 8px',
    lineHeight: 1,
  },
  section: {
    marginBottom: '20px',
  },
  sectionLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    color: 'var(--color-taupe)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '10px',
  },
  loadingText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-taupe)',
  },
  methodRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  methodBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    fontWeight: 500,
    padding: '8px 16px',
    borderRadius: '99px',
    border: '1.5px solid rgba(154, 143, 134, 0.3)',
    background: 'var(--color-porcelain)',
    color: 'var(--color-light-roast)',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  },
  methodBtnActive: {
    background: 'var(--color-mid-roast)',
    color: 'var(--color-porcelain)',
    border: '1.5px solid var(--color-mid-roast)',
  },
  portionRow: {
    display: 'flex',
    gap: '8px',
  },
  portionBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    fontWeight: 500,
    width: '52px',
    height: '36px',
    borderRadius: '99px',
    border: '1.5px solid rgba(154, 143, 134, 0.3)',
    background: 'var(--color-porcelain)',
    color: 'var(--color-light-roast)',
    cursor: 'pointer',
  },
  portionBtnActive: {
    background: 'var(--color-mid-roast)',
    color: 'var(--color-porcelain)',
    border: '1.5px solid var(--color-mid-roast)',
  },
  portionBtnDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
  },
  doseSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '28px',
  },
  doseNumber: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
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
  doseUnit: {
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    fontSize: 'var(--text-heading-sm)',
    color: 'var(--color-accent)',
    opacity: 0.7,
  },
  slider: {
    width: '100%',
    accentColor: 'var(--color-accent)',
    cursor: 'pointer',
  },
  doseInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  doseInput: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    fontWeight: 500,
    width: '60px',
    textAlign: 'center',
    padding: '6px 8px',
    borderRadius: '8px',
    border: '1.5px solid rgba(154, 143, 134, 0.3)',
    background: 'var(--color-porcelain)',
    color: 'var(--color-dark)',
    outline: 'none',
  },
  doseInputLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    color: 'var(--color-taupe)',
  },
  confirmBtn: {
    width: '100%',
    padding: '16px',
    borderRadius: '99px',
    border: 'none',
    background: 'rgba(74, 57, 51, 0.8)',
    boxShadow: '2px 2px 4px rgba(154,143,134,0.2), inset -2px -2px 2px rgba(255,255,255,0.3)',
    color: 'var(--color-porcelain)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    fontWeight: 600,
    letterSpacing: '0.04em',
    cursor: 'pointer',
  },
  confirmBtnDisabled: {
    background: 'rgba(154, 143, 134, 0.3)',
    boxShadow: 'none',
    color: 'var(--color-taupe)',
    cursor: 'not-allowed',
  },
}
