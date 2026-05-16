import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useBrewProfiles(householdId) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!householdId) return
    setLoading(true)
    supabase
      .from('brew_profiles')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setProfiles(data ?? [])
        setLoading(false)
      })
  }, [householdId])

  return { profiles, loading }
}
