import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useBeans(status = 'active') {
  const { user } = useAuth()
  const [beans, setBeans] = useState([])
  const [householdId, setHouseholdId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isFirstFetch = useRef(true)

  const fetchBeans = useCallback(async () => {
    if (!user) return
    if (isFirstFetch.current) setLoading(true)
    setError(null)

    const { data: membership, error: memberErr } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (memberErr) {
      setError(memberErr.message)
      setLoading(false)
      return
    }

    if (!membership) {
      setBeans([])
      setLoading(false)
      return
    }

    setHouseholdId(membership.household_id)

    const { data, error: beansErr } = await supabase
      .from('beans')
      .select('*, ratings(score)')
      .eq('household_id', membership.household_id)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (beansErr) {
      setError(beansErr.message)
    } else {
      setBeans(data ?? [])
    }
    setLoading(false)
    isFirstFetch.current = false
  }, [user, status])

  useEffect(() => {
    fetchBeans()
  }, [fetchBeans])

  // Realtime: merge bean and rating changes into local state
  useEffect(() => {
    if (!householdId) return

    const channel = supabase
      .channel(`beans-${householdId}-${status}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'beans',
        filter: `household_id=eq.${householdId}`,
      }, (payload) => {
        if (payload.new.status !== status) return
        setBeans(prev => [{ ...payload.new, ratings: [] }, ...prev])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'beans',
        filter: `household_id=eq.${householdId}`,
      }, (payload) => {
        if (payload.new.status !== status) {
          setBeans(prev => prev.filter(b => b.id !== payload.new.id))
        } else {
          setBeans(prev => prev.map(b =>
            b.id === payload.new.id ? { ...b, ...payload.new } : b
          ))
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'beans',
        filter: `household_id=eq.${householdId}`,
      }, (payload) => {
        setBeans(prev => prev.filter(b => b.id !== payload.old.id))
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ratings',
      }, (payload) => {
        setBeans(prev => prev.map(b =>
          b.id === payload.new.bean_id
            ? { ...b, ratings: [...(b.ratings ?? []), { score: payload.new.score }] }
            : b
        ))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [householdId, status])

  return { beans, householdId, loading, error, refetch: fetchBeans }
}
