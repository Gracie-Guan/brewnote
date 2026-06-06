import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../../lib/supabase'
import PillButton from '../ui/PillButton'
import ConfirmDialog from '../ui/ConfirmDialog'

function SortableRow({ profile, editingId, editGrams, onEditStart, onEditGramsChange, onSaveGrams, onDelete, setEditingId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: profile.id })

  const rowStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.85 : 1,
    position: 'relative',
  }

  const isEditing = editingId === profile.id

  return (
    <div ref={setNodeRef} style={rowStyle} {...attributes}>
      <div style={styles.profileRow}>
        {/* Drag handle — listeners and touchAction only here so page can still scroll */}
        <div style={styles.dragHandle} {...listeners} aria-hidden="true">
          <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
            <circle cx="4" cy="3" r="1.5" fill="var(--color-taupe)" />
            <circle cx="8" cy="3" r="1.5" fill="var(--color-taupe)" />
            <circle cx="4" cy="8" r="1.5" fill="var(--color-taupe)" />
            <circle cx="8" cy="8" r="1.5" fill="var(--color-taupe)" />
            <circle cx="4" cy="13" r="1.5" fill="var(--color-taupe)" />
            <circle cx="8" cy="13" r="1.5" fill="var(--color-taupe)" />
          </svg>
        </div>

        <div style={styles.profileInfo}>
          <span style={styles.profileName}>{profile.method_name} ×{profile.portion}</span>

          {isEditing ? (
            <div style={styles.gramEdit}>
              <input
                value={editGrams}
                onChange={e => onEditGramsChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') onSaveGrams(profile.id); if (e.key === 'Escape') setEditingId(null) }}
                style={styles.gramInput}
                type="number"
                min="1"
                autoFocus
              />
              <span style={styles.gramUnit}>g</span>
              <button type="button" onClick={() => onSaveGrams(profile.id)} style={styles.inlineBtn}>Save</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onEditStart(profile.id, String(profile.grams))}
              style={styles.gramBtn}
            >
              {profile.grams}g
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDelete(profile)}
          style={styles.deleteBtn}
          aria-label="Delete profile"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default function BrewProfileSettings({ profiles, householdId, refetch }) {
  const [localProfiles, setLocalProfiles] = useState(profiles)
  const [editingId, setEditingId] = useState(null)
  const [editGrams, setEditGrams] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [newMethod, setNewMethod] = useState('')
  const [newPortion, setNewPortion] = useState(1)
  const [customPortion, setCustomPortion] = useState('')
  const [useCustomPortion, setUseCustomPortion] = useState(false)
  const [newGrams, setNewGrams] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Sync local list from prop, but only when not mid-edit
  useEffect(() => {
    setLocalProfiles(profiles)
  }, [profiles])

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 10 },
    }),
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  async function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localProfiles.findIndex(p => p.id === active.id)
    const newIndex = localProfiles.findIndex(p => p.id === over.id)
    const reordered = arrayMove(localProfiles, oldIndex, newIndex)

    setLocalProfiles(reordered)

    // Persist new sort_order to DB
    await Promise.all(
      reordered.map((p, i) =>
        supabase.from('brew_profiles').update({ sort_order: i }).eq('id', p.id)
      )
    )
  }

  async function saveGrams(profileId) {
    const grams = parseInt(editGrams, 10)
    if (!grams || grams <= 0) return

    // Update locally so row stays in place
    setLocalProfiles(prev => prev.map(p => p.id === profileId ? { ...p, grams } : p))
    setEditingId(null)
    await supabase.from('brew_profiles').update({ grams }).eq('id', profileId)
  }

  async function addProfile() {
    const portion = useCustomPortion ? parseInt(customPortion, 10) : newPortion
    const grams = parseInt(newGrams, 10)
    if (!newMethod.trim() || !portion || portion <= 0 || !grams || grams <= 0) return

    const { error } = await supabase.from('brew_profiles').insert({
      household_id: householdId,
      method_name: newMethod.trim(),
      portion,
      grams,
    })

    if (error) {
      console.error('addProfile failed:', error)
      return
    }

    setNewMethod('')
    setNewPortion(1)
    setCustomPortion('')
    setUseCustomPortion(false)
    setNewGrams('')
    setAddingNew(false)
    refetch()
  }

  async function deleteProfile() {
    if (!confirmDelete) return
    setLocalProfiles(prev => prev.filter(p => p.id !== confirmDelete.id))
    setConfirmDelete(null)
    await supabase.from('brew_profiles').delete().eq('id', confirmDelete.id)
  }

  return (
    <div style={styles.section}>
      <span style={styles.sectionTitle}>Brew Profiles</span>

      <div style={styles.card}>
        {localProfiles.length === 0 && (
          <span style={styles.emptyText}>No brew profiles yet.</span>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localProfiles.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {localProfiles.map((p, i) => (
              <div key={p.id}>
                {i > 0 && <div style={styles.divider} />}
                <SortableRow
                  profile={p}
                  editingId={editingId}
                  editGrams={editGrams}
                  onEditStart={(id, grams) => { setEditingId(id); setEditGrams(grams) }}
                  onEditGramsChange={setEditGrams}
                  onSaveGrams={saveGrams}
                  onDelete={p => setConfirmDelete({ id: p.id, name: `${p.method_name} ×${p.portion}` })}
                  setEditingId={setEditingId}
                />
              </div>
            ))}
          </SortableContext>
        </DndContext>

        {/* Add new profile form — only shown inside card */}
        {addingNew && (
          <div style={styles.addForm}>
            {localProfiles.length > 0 && <div style={styles.divider} />}
            <div style={styles.addCol}>
              <span style={styles.label}>Brew Method</span>
              <input
                value={newMethod}
                onChange={e => setNewMethod(e.target.value)}
                style={styles.input}
                placeholder="e.g. Filter, Espresso, Moka Pot"
              />
            </div>
            <div style={styles.addCol}>
              <span style={styles.label}>Portion</span>
              <div style={styles.portionBtns}>
                {[1, 2].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => { setNewPortion(n); setUseCustomPortion(false) }}
                    style={{ ...styles.portionBtn, ...(!useCustomPortion && newPortion === n && styles.portionBtnActive) }}
                  >
                    ×{n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setUseCustomPortion(true)}
                  style={{ ...styles.portionBtn, ...(useCustomPortion && styles.portionBtnActive) }}
                >
                  Custom
                </button>
                {useCustomPortion && (
                  <input
                    value={customPortion}
                    onChange={e => setCustomPortion(e.target.value)}
                    style={styles.portionCustomInput}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="×?"
                    autoFocus
                  />
                )}
              </div>
            </div>
            <div style={styles.addCol}>
              <span style={styles.label}>Grams</span>
              <div style={styles.gramEdit}>
                <input
                  value={newGrams}
                  onChange={e => setNewGrams(e.target.value)}
                  style={styles.gramInput}
                  type="number"
                  min="1"
                  placeholder="15"
                />
                <span style={styles.gramUnit}>g</span>
              </div>
            </div>
            <div style={styles.addActions}>
              <PillButton onClick={() => { setAddingNew(false); setUseCustomPortion(false) }} variant="glass" style={styles.actionBtn}>Cancel</PillButton>
              <PillButton onClick={addProfile} variant="dark" style={styles.actionBtn}>Add</PillButton>
            </div>
          </div>
        )}
      </div>

      {!addingNew && (
        <PillButton onClick={() => setAddingNew(true)} variant="glass" style={styles.addBtn}>
          + Add Profile
        </PillButton>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Profile?"
          message={`Remove "${confirmDelete.name}" from your brew profiles.`}
          confirmLabel="Delete"
          onConfirm={deleteProfile}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}

const styles = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionTitle: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    fontWeight: 600,
    color: 'var(--color-accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '8px',
  },
  card: {
    background: 'rgba(237, 235, 235, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '12px',
    padding: '16px 20px',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  divider: {
    height: '1px',
    background: 'rgba(154, 143, 134, 0.2)',
    margin: '8px 0',
  },
  emptyText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-taupe)',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '8px 0',
  },
  profileRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px 0',
  },
  dragHandle: {
    cursor: 'grab',
    padding: '4px 8px 4px 2px',
    flexShrink: 0,
    touchAction: 'none',
    display: 'flex',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  profileName: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-dark)',
    fontWeight: 500,
  },
  gramBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-accent)',
    background: 'rgba(234, 104, 22, 0.08)',
    border: '1px solid rgba(234, 104, 22, 0.2)',
    borderRadius: '8px',
    padding: '4px 10px',
    cursor: 'pointer',
    fontWeight: 500,
  },
  gramEdit: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  gramInput: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-dark)',
    background: 'var(--color-porcelain)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    borderRadius: '8px',
    padding: '4px 8px',
    width: '56px',
    outline: 'none',
  },
  gramUnit: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-taupe)',
  },
  inlineBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    fontWeight: 500,
    color: 'var(--color-accent)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },
  deleteBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    color: 'var(--color-taupe)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    flexShrink: 0,
  },
  addBtn: {
    width: '100%',
    height: '44px',
    fontSize: 'var(--text-body)',
    fontWeight: 500,
    color: 'var(--color-accent)',
  },
  addForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-dark)',
    background: 'var(--color-porcelain)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    borderRadius: '8px',
    padding: '8px 12px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  addCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  portionBtns: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  portionBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-taupe)',
    background: 'rgba(154, 143, 134, 0.15)',
    border: '1px solid rgba(154, 143, 134, 0.2)',
    borderRadius: '8px',
    padding: '6px 12px',
    cursor: 'pointer',
  },
  portionBtnActive: {
    background: 'var(--color-dark)',
    color: 'var(--color-porcelain)',
    border: '1px solid var(--color-dark)',
  },
  portionCustomInput: {
    fontFamily: 'var(--font-body)',
    fontSize: '16px',
    color: 'var(--color-dark)',
    background: 'var(--color-porcelain)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    borderRadius: '8px',
    padding: '6px 8px',
    width: '56px',
    outline: 'none',
  },
  label: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    fontWeight: 500,
    color: 'var(--color-taupe)',
  },
  addActions: {
    display: 'flex',
    gap: '8px',
  },
  actionBtn: {
    flex: 1,
    height: '40px',
    fontSize: 'var(--text-label)',
    fontWeight: 500,
  },
}
