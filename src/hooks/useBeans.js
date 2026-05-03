import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useBeans(status = 'active') {
  const { user } = useAuth()
  const [beans, setBeans] = useState([])
  const [householdId, setHouseholdId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBeans = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    const { data: membership, error: memberErr } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .single()

    if (memberErr || !membership) {
      setError(memberErr?.message ?? 'No household found')
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
  }, [user, status])

  useEffect(() => {
    fetchBeans()
  }, [fetchBeans])

  return { beans, householdId, loading, error, refetch: fetchBeans }
}
