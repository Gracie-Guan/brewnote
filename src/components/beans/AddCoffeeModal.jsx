import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import TagPill from '../ui/TagPill'
import PillButton from '../ui/PillButton'

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const MAX = 2048
      let { naturalWidth: w, naturalHeight: h } = img
      if (w > MAX || h > MAX) {
        const r = Math.min(MAX / w, MAX / h)
        w = Math.round(w * r)
        h = Math.round(h * r)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.88).split(',')[1])
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      // Fallback for formats canvas can't render
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    }
    img.src = url
  })
}

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
  const [beanType, setBeanType]   = useState(draft?.beanType ?? 'blend')
  const [roaster, setRoaster]     = useState(draft?.roaster ?? '')
  const [name, setName]           = useState(draft?.name ?? '')
  const [origin, setOrigin]       = useState(draft?.origin ?? '')
  const [farm, setFarm]           = useState(draft?.farm ?? '')
  const [weight, setWeight]       = useState(draft?.weight ?? '')
  const [roastDate, setRoastDate] = useState(draft?.roastDate ?? '')
  const [process, setProcess]     = useState(draft?.process ?? '')
  const [selectedTags, setSelectedTags] = useState(draft?.selectedTags ?? [])
  const [customInput, setCustomInput]   = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState(null)
  const [ocrLoading, setOcrLoading]     = useState(false)
  const [ocrPhoto, setOcrPhoto]         = useState(null) // { url: objectURL } for preview
  const customInputRef = useRef(null)
  const photoInputRef  = useRef(null)

  // Persist draft on every field change
  useEffect(() => {
    saveDraft({ beanType, roaster, name, origin, farm, weight, roastDate, process, selectedTags })
  }, [beanType, roaster, name, origin, farm, weight, roastDate, process, selectedTags])

  const canSubmit = !submitting && roaster.trim() && weight.trim() &&
    (beanType === 'blend' ? name.trim() : origin.trim())

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

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setOcrPhoto({ url })
    setOcrLoading(true)

    try {
      const base64 = await fileToBase64(file)
      const { data, error: fnErr } = await supabase.functions.invoke('ocr', {
        body: { image: base64 },
      })

      if (!fnErr && data && Object.keys(data).length > 0) {
        if (data.roaster)       setRoaster(data.roaster)
        if (data.name)          setName(data.name)
        if (data.origin)        { setOrigin(data.origin); setBeanType('single_origin') }
        if (data.farm)          setFarm(data.farm)
        if (data.total_weight_g) setWeight(String(data.total_weight_g))
        if (data.roast_date)    setRoastDate(data.roast_date)
        if (data.process)       setProcess(data.process)
        if (data.flavor_tags?.length) {
          setSelectedTags(prev => {
            const merged = [...prev]
            for (const t of data.flavor_tags) {
              if (!merged.includes(t)) merged.push(t)
            }
            return merged
          })
        }
      }
    } catch {
      // Silent failure — user can fill fields manually
    } finally {
      setOcrLoading(false)
    }
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
      name:              beanType === 'blend' ? name.trim() : null,
      origin:            beanType === 'single_origin' ? origin.trim() : null,
      farm:              beanType === 'single_origin' && farm.trim() ? farm.trim() : null,
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

        {/* Photo upload — OCR path */}
        <label style={styles.photoArea}>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />
          {ocrLoading ? (
            <span style={styles.spinner} />
          ) : ocrPhoto ? (
            <img src={ocrPhoto.url} alt="bag" style={styles.photoThumb} />
          ) : (
            <div style={styles.photoPrompt}>
              <svg width="32" height="28" viewBox="0 0 32 28" fill="none">
                <path d="M1 8V3a2 2 0 0 1 2-2h5" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M31 8V3a2 2 0 0 0-2-2h-5" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M1 20v5a2 2 0 0 0 2 2h5" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M31 20v5a2 2 0 0 1-2 2h-5" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
              <span style={styles.photoTitle}>Upload Bag Photo for Scan</span>
              <span style={styles.photoSubtitle}>Please make sure the photo include{'\n'}core information of the bean.</span>
            </div>
          )}
        </label>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Blend / Single Origin toggle */}
          <div style={styles.typeToggle}>
            <button
              type="button"
              style={{ ...styles.typeBtn, ...(beanType === 'blend' ? styles.typeBtnActive : {}) }}
              onClick={() => setBeanType('blend')}
            >Blend</button>
            <button
              type="button"
              style={{ ...styles.typeBtn, ...(beanType === 'single_origin' ? styles.typeBtnActive : {}) }}
              onClick={() => setBeanType('single_origin')}
            >Single Origin</button>
          </div>

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

          {beanType === 'blend' ? (
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Coffee Name <span style={styles.req}>*</span></label>
              <input
                className="field-input"
                style={styles.input}
                placeholder="e.g. House Blend No.3"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          ) : (
            <div style={styles.optionalRow}>
              <div style={{ ...styles.fieldGroup, flex: 1, minWidth: 0 }}>
                <label style={styles.label}>Origin <span style={styles.req}>*</span></label>
                <input
                  className="field-input"
                  style={styles.input}
                  placeholder="e.g. Ethiopia"
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                />
              </div>
              <div style={{ ...styles.fieldGroup, flex: 1, minWidth: 0 }}>
                <label style={styles.label}>Farm</label>
                <input
                  className="field-input"
                  style={styles.input}
                  placeholder="e.g. Daniso Horsa"
                  value={farm}
                  onChange={e => setFarm(e.target.value)}
                />
              </div>
            </div>
          )}

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
            <div style={{ ...styles.fieldGroup, flex: 1, minWidth: 0 }}>
              <label style={styles.label}>Roast Date</label>
              <input
                className="field-input"
                style={styles.input}
                type="text"
                placeholder="e.g. 2024-06-15"
                value={roastDate}
                onChange={e => setRoastDate(e.target.value)}
              />
            </div>
            <div style={{ ...styles.fieldGroup, flex: 1, minWidth: 0 }}>
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
  typeToggle: {
    display: 'flex',
    background: 'rgba(154,143,134,0.2)',
    borderRadius: '99px',
    padding: '3px',
    gap: '2px',
  },
  typeBtn: {
    flex: 1,
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    fontWeight: 500,
    color: 'var(--color-taupe)',
    background: 'none',
    border: 'none',
    borderRadius: '99px',
    padding: '8px 12px',
    cursor: 'pointer',
    transition: 'background 0.18s, color 0.18s',
  },
  typeBtnActive: {
    background: 'var(--color-porcelain)',
    color: 'var(--color-dark)',
    boxShadow: '0 1px 4px rgba(62,50,50,0.12)',
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
    fontSize: '16px',
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
  photoArea: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '180px',
    borderRadius: '16px',
    background: 'rgba(237, 235, 235, 0.6)',
    border: '1.5px solid rgba(154, 143, 134, 0.25)',
    cursor: 'pointer',
    marginBottom: '16px',
    overflow: 'hidden',
    flexShrink: 0,
  },
  photoPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '32px 24px',
  },
  photoTitle: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    fontWeight: 500,
    color: 'var(--color-dark)',
    textAlign: 'center',
  },
  photoSubtitle: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    color: 'var(--color-taupe)',
    textAlign: 'center',
    whiteSpace: 'pre-line',
    lineHeight: 1.5,
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  spinner: {
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '2px solid rgba(154, 143, 134, 0.3)',
    borderTopColor: 'var(--color-accent)',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
}
