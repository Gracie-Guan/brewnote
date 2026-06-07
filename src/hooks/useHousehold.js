import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useHousehold() {
  const { user } = useAuth()
  const [household, setHousehold] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHousehold = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: rows } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .limit(1)

    const membership = rows?.[0] ?? null
    if (!membership) { setLoading(false); return }

    const [{ data: hh }, { data: mems }] = await Promise.all([
      supabase.from('households').select('*').eq('id', membership.household_id).single(),
      supabase.from('household_members').select('user_id, joined_at, profiles(display_name, email)').eq('household_id', membership.household_id),
    ])

    setHousehold(hh)
    setMembers(mems ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchHousehold() }, [fetchHousehold])

  return { household, members, loading, refetch: fetchHousehold }
}
