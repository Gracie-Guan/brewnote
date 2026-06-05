import { useState, useMemo, useRef, useLayoutEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useBrewProfiles } from '../../hooks/useBrewProfiles'
import beanIcon from '../../assets/bean_icon_fill.svg'

const PX_PER_GRAM = 8

// Scrolling ruler: the tick strip moves, the center indicator stays fixed.
function TickRuler({ dose, sliderMax, onChange }) {
  const outerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(300)
  const isDraggingRef = useRef(false)
  const dragStartXRef = useRef(0)
  const dragStartDoseRef = useRef(0)

  useLayoutEffect(() => {
    if (outerRef.current) setContainerWidth(outerRef.current.clientWidth)
  }, [])

  // Ruler left edge = containerWidth/2 (places the 0g mark at center when dose=0)
  // translateX shifts left as dose increases, keeping the current-dose mark at center
  const rulerTranslateX = containerWidth / 2 - dose * PX_PER_GRAM
  const rulerWidth = sliderMax * PX_PER_GRAM + containerWidth

  function onPointerDown(e) {
    isDraggingRef.current = true
    dragStartXRef.current = e.clientX
    dragStartDoseRef.current = dose
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function onPointerMove(e) {
    if (!isDraggingRef.current) return
    const deltaPx = dragStartXRef.current - e.clientX
    const next = Math.max(1, Math.min(sliderMax, Math.round(dragStartDoseRef.current + deltaPx / PX_PER_GRAM)))
    onChange(next)
  }

  function onPointerUp() { isDraggingRef.current = false }

  return (
    <div ref={outerRef} style={ruler.outer}>
      {/* Drag zone — masked for progressive blur */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={ruler.dragZone}
      >
        {/* Tick strip — translates based on dose */}
        <div
          style={{
            ...ruler.tickStrip,
            width: `${rulerWidth}px`,
            transform: `translateX(${rulerTranslateX}px)`,
          }}
        >
          {/* Thin horizontal baseline */}
          <div style={ruler.baseline} />
        </div>
      </div>

      {/* Fixed center indicator — lives outside the masked layer */}
      <div style={ruler.indicator} />
    </div>
  )
}

const ruler = {
  outer: {
    position: 'relative',
    height: '48px',
    userSelect: 'none',
  },
  dragZone: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    cursor: 'ew-resize',
    touchAction: 'none',
    WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 18%, black 82%, transparent 100%)',
    maskImage: 'linear-gradient(90deg, transparent 0%, black 18%, black 82%, transparent 100%)',
  },
  tickStrip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    // backgroundSize controls tick height: 8px wide tile, 16px tall — centered in 40px container
    backgroundImage: `linear-gradient(
      90deg,
      rgba(154,143,134,0.45) 0px,
      rgba(154,143,134,0.45) 1.5px,
      transparent 1.5px,
      transparent ${PX_PER_GRAM}px
    )`,
    backgroundSize: `${PX_PER_GRAM}px 16px`,
    backgroundRepeat: 'repeat-x',
    backgroundPosition: '0 50%',
  },

  baseline: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: '1px',
    background: 'rgba(154,143,134,0.2)',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  indicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    height: '32px',
    width: '2.5px',
    background: 'var(--color-accent)',
    borderRadius: '99px',
    boxShadow: '0 0 8px rgba(234,104,22,0.45)',
    pointerEvents: 'none',
  },
}

// ─────────────────────────────────────────

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

  const methodNames = useMemo(() => [...new Set(profiles.map(p => p.method_name))], [profiles])

  const availablePortions = useMemo(() => {
    if (!selectedMethod) return []
    return profiles.filter(p => p.method_name === selectedMethod).map(p => p.portion).sort((a, b) => a - b)
  }, [profiles, selectedMethod])

  function handleMethodSelect(method) {
    setSelectedMethod(method)
    setIsCustom(false)
    const defaultProfile = profiles.filter(p => p.method_name === method).find(p => p.portion === 1)
      ?? profiles.find(p => p.method_name === method)
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

  async function handleConfirm() {
    if (!dose || dose < 1 || submitting) return
    setSubmitting(true)

    const matchedProfile = (!isCustom && selectedMethod && selectedPortion && selectedPortion !== 'custom')
      ? profiles.find(p => p.method_name === selectedMethod && p.portion === selectedPortion)
      : null

    const { error: logErr } = await supabase.from('consumption_logs').insert({
      bean_id: bean.id,
      household_id: householdId,
      user_id: user.id,
      brew_profile_id: matchedProfile?.id ?? null,
      grams_used: dose,
    })

    if (logErr) { setSubmitting(false); return }

    const newWeight = bean.current_weight_g - dose
    const willArchive = newWeight <= 0
    const updatePayload = { current_weight_g: Math.max(newWeight, 0) }
    if (willArchive) { updatePayload.status = 'archived'; updatePayload.archived_at = new Date().toISOString() }

    await supabase.from('beans').update(updatePayload).eq('id', bean.id)

    setSubmitting(false)
    if (willArchive) onBeanArchived?.(bean.name)
    else onBeanUpdated?.()
    handleClose()
  }

  const sliderMax = Math.max(bean.current_weight_g, 1)
  const canConfirm = dose >= 1 && dose <= bean.current_weight_g && !submitting && (isCustom || selectedPortion !== null)

  return (
    <>
      <div
        onClick={handleClose}
        style={{
          ...styles.backdrop,
          animation: closing ? 'fade-out 0.3s ease forwards' : 'fade-in 0.2s ease',
        }}
      />

      <div style={{
        ...styles.drawer,
        animation: closing ? 'slide-down-out 0.3s ease-in forwards' : 'slide-up 0.3s ease-out',
      }}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.beanIconCircle}>
            <img src={beanIcon} width={26} height={26} alt="" style={{ display: 'block' }} />
          </div>
          <div>
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
            <div style={styles.chipRow}>
              {methodNames.map(method => (
                <button
                  key={method}
                  onClick={() => handleMethodSelect(method)}
                  style={selectedMethod === method && !isCustom ? chip.selected : chip.unselected}
                >
                  {method}
                </button>
              ))}
              <button style={chip.muted}>+</button>
            </div>
          )}
        </div>

        {/* Portion */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Portion</div>
          <div style={styles.chipRow}>
            {[1, 2].map(p => {
              const available = !selectedMethod || availablePortions.includes(p)
              const active = selectedPortion === p && !isCustom
              return (
                <button
                  key={p}
                  onClick={() => available && handlePortionSelect(p)}
                  disabled={!available}
                  style={active ? chip.selected : available ? chip.unselected : chip.muted}
                >
                  {p}
                </button>
              )
            })}
            <label style={{ ...(isCustom ? chip.selected : chip.muted), display: 'inline-flex', alignItems: 'center', gap: '2px', cursor: 'text' }}>
              <input
                type="number"
                min="1"
                max={sliderMax}
                value={isCustom ? dose : ''}
                placeholder="—"
                className="dose-input"
                onFocus={() => { setIsCustom(true); setSelectedPortion('custom') }}
                onChange={e => {
                  const v = parseInt(e.target.value, 10)
                  if (!isNaN(v)) setDose(Math.max(1, Math.min(sliderMax, v)))
                }}
                style={{
                  background: 'none', border: 'none', outline: 'none',
                  width: '28px', fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-label)', fontWeight: 400,
                  color: 'inherit', textAlign: 'center', padding: 0,
                }}
              />
              <span>g</span>
            </label>
          </div>
        </div>

        {/* Dose */}
        <div style={styles.section}>
          <div style={styles.doseLabelRow}>
            <span style={{ ...styles.sectionLabel, marginBottom: 0 }}>Dose</span>
            <span style={styles.gramsBadge}>grams</span>
          </div>
          <div style={styles.doseRow}>
            <span style={styles.doseValue}>{dose}</span>
          </div>
          <TickRuler dose={dose} sliderMax={sliderMax} onChange={setDose} />
        </div>

        {/* Bottom */}
        <div style={styles.bottomRow}>
          <button onClick={handleClose} style={styles.cancelBtn}>Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            style={{ ...styles.confirmBtn, ...(!canConfirm ? styles.confirmBtnDisabled : {}) }}
          >
            {submitting ? 'Logging…' : 'Confirm Log'}
          </button>
        </div>

      </div>
    </>
  )
}

// Chip label styles (matches TagPill)
const chipBase = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-label)',
  fontWeight: 400,
  borderRadius: '99px',
  padding: '6px 14px',
  cursor: 'pointer',
  border: 'none',
  lineHeight: 1,
  transition: 'background 0.15s ease, color 0.15s ease',
  whiteSpace: 'nowrap',
}
const chip = {
  unselected: { ...chipBase, background: 'var(--color-porcelain)', border: '1px solid #FFFFFF', color: 'var(--color-mid-roast)' },
  selected:   { ...chipBase, background: 'var(--color-mid-roast)', border: '1px solid #3E3232', color: 'var(--color-porcelain)' },
  muted:      { ...chipBase, background: 'rgba(154,143,134,0.2)', color: 'var(--color-taupe)' },
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
    borderRadius: '16px 16px 0 0',
    padding: '28px 24px 40px',
    zIndex: 100,
    maxHeight: '90dvh',
    overflowY: 'auto',
  },
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
  coffeLogLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-mid-roast)',
    marginBottom: '2px',
  },
  beanName: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-heading-md)',
    fontWeight: 700,
    color: 'var(--color-dark)',
    lineHeight: 1.15,
  },
  section: {
    marginBottom: '28px',
  },
  doseLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '14px',
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
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  doseRow: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: 0,
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
    background: 'rgba(234, 104, 22, 0.06)',
  },
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
