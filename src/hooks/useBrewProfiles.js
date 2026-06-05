import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useBrewProfiles(householdId) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchProfiles = useCallback(async () => {
    if (!householdId) return
    setLoading(true)
    const { data } = await supabase
      .from('brew_profiles')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true })
    setProfiles(data ?? [])
    setLoading(false)
  }, [householdId])

  useEffect(() => { fetchProfiles() }, [fetchProfiles])

  return { profiles, loading, refetch: fetchProfiles }
}
