import { createClient } from '../lib/supabase/server'

function pacificVotingDate(now = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return fmt.format(now)
}

// Deterministic ordering used by both the home grid and the detail-page
// prev/next nav. Includes id as a tie-breaker so batched inserts (stock cats)
// — which can share an identical created_at down to the millisecond — still
// resolve to a stable order. The detail-page nav fetches the same list and
// indexes into it, guaranteeing prev/next match the grid sequence exactly.
async function fetchTodayCatestants(supabase, votingDate) {
  return supabase
    .from('catestants')
    .select('id, photo_url')
    .eq('voting_date', votingDate)
    .eq('admin_status', 'approved')
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
}

export async function getTodaysCats() {
  const supabase = await createClient()
  const { data, error } = await fetchTodayCatestants(supabase, pacificVotingDate())

  if (error) {
    console.error('getTodaysCats error:', error)
    return []
  }
  return data.map((row) => ({ id: row.id, src: row.photo_url }))
}

export async function getCatNeighbors(id) {
  const supabase = await createClient()

  const { data: cat, error: catError } = await supabase
    .from('catestants')
    .select('voting_date')
    .eq('id', id)
    .eq('admin_status', 'approved')
    .maybeSingle()

  if (catError || !cat) return null

  const { data: cats, error } = await fetchTodayCatestants(supabase, cat.voting_date)
  if (error || !cats || cats.length === 0) return { prev: null, next: null }

  const idx = cats.findIndex((c) => c.id === id)
  if (idx === -1) return { prev: null, next: null }

  const prev = cats[(idx - 1 + cats.length) % cats.length]
  const next = cats[(idx + 1) % cats.length]

  return {
    prev: { id: prev.id, src: prev.photo_url },
    next: { id: next.id, src: next.photo_url },
  }
}
