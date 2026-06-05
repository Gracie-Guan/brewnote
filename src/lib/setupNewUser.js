import { supabase } from './supabase'

const DEFAULT_BREW_PROFILES = [
  { method_name: 'Filter', portion: 1, grams: 15 },
  { method_name: 'Filter', portion: 2, grams: 30 },
  { method_name: 'Espresso', portion: 1, grams: 18 },
  { method_name: 'Moka Pot', portion: 1, grams: 20 },
]

export async function setupNewUser(user) {
  const { data: existing } = await supabase
    .from('household_members')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  if (existing && existing.length > 0) return

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'My'
  const householdName = `${displayName}'s Household`

  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({ name: householdName, owner_id: user.id })
    .select()
    .single()

  if (householdError) {
    console.error('setupNewUser: failed to create household', householdError)
    return
  }

  const { error: memberError } = await supabase
    .from('household_members')
    .insert({ household_id: household.id, user_id: user.id })

  if (memberError) {
    console.error('setupNewUser: failed to insert household_member', memberError)
    return
  }

  const { error: profilesError } = await supabase
    .from('brew_profiles')
    .insert(
      DEFAULT_BREW_PROFILES.map(p => ({ ...p, household_id: household.id }))
    )

  if (profilesError) {
    console.error('setupNewUser: failed to seed brew_profiles', profilesError)
  }
}
