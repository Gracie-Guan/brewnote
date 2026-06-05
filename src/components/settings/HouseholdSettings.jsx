import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import PillButton from '../ui/PillButton'
import ConfirmDialog from '../ui/ConfirmDialog'

export default function HouseholdSettings({ household, members, refetch }) {
  const { user } = useAuth()
  const isOwner = household?.owner_id === user?.id

  const [householdName, setHouseholdName] = useState(household?.name ?? '')
  const [editingName, setEditingName] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(null)

  async function saveName() {
    if (!householdName.trim()) return
    await supabase.from('households').update({ name: householdName.trim() }).eq('id', household.id)
    setEditingName(false)
    refetch()
  }

  async function generateInvite() {
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('household_invites').insert({
      household_id: household.id,
      token,
      created_by: user.id,
      expires_at: expiresAt,
    })
    setInviteUrl(`${window.location.origin}/invite/${token}`)
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function shareInvite() {
    if (navigator.share) {
      try { await navigator.share({ title: 'Join our BrewNote household', url: inviteUrl }) }
      catch { /* user dismissed */ }
    } else {
      copyInvite()
    }
  }

  async function handleConfirmRemove() {
    if (!confirmRemove) return

    await supabase
      .from('household_members')
      .delete()
      .eq('household_id', household.id)
      .eq('user_id', confirmRemove.userId)
    setConfirmRemove(null)
    refetch()
  }

  return (
    <div style={styles.section}>
      <span style={styles.sectionTitle}>Household</span>

      {/* Household name */}
      <div style={styles.card}>
        <div style={styles.fieldRow}>
          <span style={styles.label}>Household Name</span>
          {isOwner && !editingName && (
            <button type="button" onClick={() => setEditingName(true)} style={styles.inlineBtn}>Edit</button>
          )}
        </div>
        {editingName ? (
          <div style={styles.inputRow}>
            <input
              value={householdName}
              onChange={e => setHouseholdName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              style={styles.input}
              autoFocus
            />
            <button type="button" onClick={saveName} style={styles.inlineBtn}>Save</button>
            <button type="button" onClick={() => { setEditingName(false); setHouseholdName(household.name) }} style={styles.cancelBtn}>✕</button>
          </div>
        ) : (
          <span style={styles.householdName}>{household?.name}</span>
        )}
      </div>

      {/* Members */}
      <div style={styles.card}>
        <span style={styles.label}>Members</span>
        <div style={styles.memberList}>
          {members.map(m => {
            const isMe = m.user_id === user?.id
            const joinedDate = new Date(m.joined_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            return (
              <div key={m.user_id} style={styles.memberRow}>
                <div>
                  <span style={styles.memberName}>{isMe ? 'You' : 'Member'}</span>
                  <span style={styles.memberSub}>Joined {joinedDate}</span>
                </div>
                {!isMe && isOwner && (
                  <button
                    type="button"
                    style={styles.removeBtn}
                    onClick={() => setConfirmRemove({ userId: m.user_id, label: 'this member' })}
                  >
                    Remove
                  </button>
                )}

                {isMe && !isOwner && (
                  <button
                    type="button"
                    style={styles.removeBtn}
                    onClick={() => setConfirmRemove({ userId: user.id, label: 'yourself from this household' })}
                  >
                    Leave
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Invite */}
      {!inviteUrl ? (
        <PillButton onClick={generateInvite} variant="glass" style={styles.inviteBtn}>
          + Invite Member
        </PillButton>
      ) : (
        <div style={styles.card}>
          <span style={styles.inviteUrl}>{inviteUrl}</span>
          <div style={styles.inviteActions}>
            <PillButton onClick={copyInvite} variant="glass" style={styles.shareBtn}>
              {copied ? 'Copied!' : 'Copy'}
            </PillButton>
            <PillButton onClick={shareInvite} variant="dark" style={styles.shareBtn}>
              Share
            </PillButton>
          </div>
          <span style={styles.expireNote}>Link expires in 7 days</span>
        </div>
      )}

      {confirmRemove && (
        <ConfirmDialog
          title="Are you sure?"
          message={`This will remove ${confirmRemove.label} from the household.`}
          confirmLabel="Remove"
          onConfirm={handleConfirmRemove}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
    </div>
  )
}

const styles = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
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
    gap: '12px',
  },
  fieldRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    fontWeight: 500,
    color: 'var(--color-taupe)',
  },
  householdName: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-heading-sm)',
    color: 'var(--color-dark)',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-dark)',
    background: 'var(--color-porcelain)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    borderRadius: '8px',
    padding: '8px 12px',
    outline: 'none',
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
    flexShrink: 0,
  },
  cancelBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    color: 'var(--color-taupe)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    flexShrink: 0,
  },
  memberList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '8px',
  },
  memberRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    display: 'block',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)',
    color: 'var(--color-dark)',
    fontWeight: 500,
  },
  memberSub: {
    display: 'block',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-taupe)',
  },
  removeBtn: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-label)',
    color: 'var(--color-taupe)',
    background: 'none',
    border: '1px solid rgba(154, 143, 134, 0.3)',
    borderRadius: '99px',
    padding: '4px 12px',
    cursor: 'pointer',
  },
  inviteBtn: {
    width: '100%',
    height: '44px',
    fontSize: 'var(--text-body)',
    fontWeight: 500,
    color: 'var(--color-accent)',
    marginTop: '8px',
  },
  inviteBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  inviteUrl: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    color: 'var(--color-taupe)',
    wordBreak: 'break-all',
    background: 'rgba(154, 143, 134, 0.1)',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  inviteActions: {
    display: 'flex',
    gap: '8px',
  },
  shareBtn: {
    flex: 1,
    height: '40px',
    fontSize: 'var(--text-small)',
    fontWeight: 500,
  },
  expireNote: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-small)',
    color: 'var(--color-taupe)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
}
