import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import TagPill from '../ui/TagPill'
import PillButton from '../ui/PillButton'

const PRESET_TAGS = [
  'Lychee', 'Chardonnay', 'Chamomile', 'Honey', 'Berry',
  'Caramel', 'Chocolate', 'Citrus', 'Floral', 'Nutty', 'Spice', 'Stone Fruit',
]

const STORAGE_KEY = 'brewnote-add-coffee-draft'

function loadDraft() {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null') } catch { return null }
}
function saveDraft(d) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(d))
}
function clearDraft() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export default function AddCoffeeModal({ householdId, onClose, onAdded }) {
  const draft = loadDraft()
  const [roaster, setRoaster]     = useState(draft?.roaster ?? '')
  const [name, setName]           = useState(draft?.name ?? '')
  const [weight, setWeight]       = useState(draft?.weight ?? '')
  const [roastDate, setRoastDate] = useState(draft?.roastDate ?? '')
  const [process, setProcess]     = useState(draft?.process ?? '')
  const [selectedTags, setSelectedTags] = useState(draft?.selectedTags ?? [])
  const [customInput, setCustomInput]   = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState(null)
  const customInputRef = useRef(null)

  // Persist draft on every field change
  useEffect(() => {
    saveDraft({ roaster, name, weight, roastDate, process, selectedTags })
  }, [roaster, name, weight, roastDate, process, selectedTags])

  const canSubmit = roaster.trim() && name.trim() && weight.trim() && !submitting

  function togglePreset(tag) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  function commitCustom() {
    const val = customInput.trim()
    if (!val || selectedTags.includes(val)) { setCustomInput(''); return }
    setSelectedTags(prev => [...prev, val])
    setCustomInput('')
  }

  function handleCustomKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitCustom() }
    if (e.key === 'Backspace' && customInput === '') {
      setSelectedTags(prev => prev.slice(0, -1))
    }
  }

  function removeTag(tag) {
    setSelectedTags(prev => prev.filter(t => t !== tag))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const grams = parseFloat(weight)

    const { error: insertErr } = await supabase.from('beans').insert({
      household_id:      householdId,
      added_by:          user.id,
      name:              name.trim(),
      roaster:           roaster.trim(),
      total_weight_g:    grams,
      current_weight_g:  grams,
      status:            'active',
      process:           process.trim() || null,
      roast_date:        roastDate || null,
      flavor_tags:       selectedTags.length > 0 ? selectedTags : null,
    })

    if (insertErr) { setError(insertErr.message); setSubmitting(false); return }
    clearDraft()
    onAdded()
    onClose()
  }

  // Close on backdrop click — clear draft when user explicitly dismisses
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) { clearDraft(); onClose() }
  }

  // Trap Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') { clearDraft(); onClose() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const customTags = selectedTags.filter(t => !PRESET_TAGS.includes(t))
  const presetSelected = selectedTags.filter(t => PRESET_TAGS.includes(t))

  return (
    <div style={styles.backdrop} onClick={handleBackdrop}>
      <div style={styles.sheet}>
        <div style={styles.handle} />

        <h2 style={styles.title}>Add Beans</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Required fields */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Coffee Roaster <span style={styles.req}>*</span></label>
            <input
              className="field-input"
              style={styles.input}
              placeholder="e.g. Badger & Dodo"
              value={roaster}
              onChange={e => setRoaster(e.target.value)}
              autoFocus
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Coffee Name <span style={styles.req}>*</span></label>
            <input
              className="field-input"
              style={styles.input}
              placeholder="e.g. Ethiopia Daniso Horsa"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Total Weight (g) <span style={styles.req}>*</span></label>
            <input
              className="field-input"
              style={styles.input}
              type="number"
              inputMode="decimal"
              placeholder="250"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              min="1"
            />
          </div>

          {/* Optional fields */}
          <div style={styles.optionalRow}>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label}>Roast Date</label>
              <input
                className="field-input"
                style={{ ...styles.input, color: roastDate ? 'var(--color-dark)' : 'var(--color-taupe)' }}
                type="date"
                value={roastDate}
                onChange={e => setRoastDate(e.target.value)}
              />
            </div>
            <div style={{ ...styles.fieldGroup, flex: 1 }}>
              <label style={styles.label}>Process</label>
              <input
                className="field-input"
                style={styles.input}
                placeholder="e.g. Washed"
                value={process}
                onChange={e => setProcess(e.target.value)}
              />
            </div>
          </div>

          {/* Flavour tags */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Flavour Tags</label>

            {/* Preset chips */}
            <div style={styles.chipRow}>
              {PRESET_TAGS.map(tag => (
                <TagPill
                  key={tag}
                  label={tag}
                  selected={selectedTags.includes(tag)}
                  onToggle={() => togglePreset(tag)}
                />
              ))}
            </div>

            {/* Custom tag input + confirmed custom pills */}
            <div style={styles.customRow} onClick={() => customInputRef.current?.focus()}>
              {customTags.map(tag => (
                <span key={tag} style={styles.customPill}>
                  {tag}
                  <button
                    type="button"
                    style={styles.removeBtn}
                    onClick={e => { e.stopPropagation(); removeTag(tag) }}
                  >×</button>
                </span>
              ))}
              <input
                ref={customInputRef}
                style={styles.customInput}
                placeholder={customTags.length === 0 ? 'Type a tag, press Enter' : ''}
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={handleCustomKeyDown}
                onBlur={commitCustom}
              />
            </div>
          </div>

          {error && <p style={styles.errorText}>{error}</p>}

          <div style={styles.buttonRow}>
            <PillButton
              variant="glass"
              onClick={() => { clearDraft(); onClose() }}
              style={styles.cancelBtn}
            >
              Cancel
            </PillButton>
            <PillButton
              type="submit"
              variant="dark"
              disabled={!canSubmit}
              style={styles.submitBtn}
            >
              {submitting ? 'Adding…' : 'Add Beans'}
            </PillButton>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(154, 143, 134, 0.5)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'flex-end',
    animation: 'fade-in 0.2s ease',
  },
  sheet: {
    width: '100%',
    maxHeight: '92svh',
    overflowY: 'auto',
    background: 'rgba(237, 235, 235, 0.7)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '16px 16px 0 0',
    padding: '12px 20px 40px',
    animation: 'slide-up 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
  },
  handle: {
    width: '36px',
    height: '4px',
    background: 'rgba(154, 143, 134, 0.4)',
    borderRadius: '99px',
    margin: '0 auto 20px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-heading-md)',
    fontWeight: 700,
    color: 'var(--color-dark)',
    margin: '0 0 20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  optionalRow: {
    display: 'flex',
    gap: '12px',
  },
  label: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    fontWeight: 400,
    color: 'var(--color-light-roast)',
  },
  req: {
    color: 'var(--color-accent)',
  },
  input: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-dark)',
    background: 'rgba(154, 143, 134, 0.3)',
    borderRadius: '99px',
    padding: '12px 18px',
    width: '100%',
    boxSizing: 'border-box',
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  customRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
    minHeight: '44px',
    background: 'rgba(154, 143, 134, 0.3)',
    border: 'none',
    borderRadius: '99px',
    padding: '6px 18px',
    cursor: 'text',
    marginTop: '8px',
  },
  customPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    background: 'rgba(154, 143, 134, 0.3)',
    border: '2px solid var(--color-porcelain)',
    borderRadius: '99px',
    padding: '4px 10px',
    color: 'var(--color-mid-roast)',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-taupe)',
    fontSize: '14px',
    lineHeight: 1,
    padding: 0,
  },
  customInput: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    color: 'var(--color-dark)',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    flex: 1,
    minWidth: '120px',
  },
  errorText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    color: 'var(--color-lychee)',
    margin: 0,
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  cancelBtn: {
    fontSize: 'var(--text-label)',
    fontWeight: 500,
    padding: '14px 24px',
    flexShrink: 0,
  },
  submitBtn: {
    fontSize: 'var(--text-body)',
    fontWeight: 500,
    letterSpacing: '0.02em',
    padding: '14px 24px',
    flex: 1,
  },
}
