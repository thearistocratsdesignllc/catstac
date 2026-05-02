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

export async function getTodaysCats() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('catestants')
    .select('id, photo_url, created_at')
    .eq('voting_date', pacificVotingDate())
    .eq('admin_status', 'approved')
    .order('created_at', { ascending: true })

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
    .select('id, created_at, voting_date')
    .eq('id', id)
    .eq('admin_status', 'approved')
    .maybeSingle()

  if (catError || !cat) return null

  const baseQuery = () =>
    supabase
      .from('catestants')
      .select('id, photo_url')
      .eq('voting_date', cat.voting_date)
      .eq('admin_status', 'approved')

  const [{ data: prevRows }, { data: nextRows }] = await Promise.all([
    baseQuery()
      .lt('created_at', cat.created_at)
      .order('created_at', { ascending: false })
      .limit(1),
    baseQuery()
      .gt('created_at', cat.created_at)
      .order('created_at', { ascending: true })
      .limit(1),
  ])

  let prev = prevRows?.[0] ?? null
  let next = nextRows?.[0] ?? null

  if (!prev) {
    const { data } = await baseQuery()
      .order('created_at', { ascending: false })
      .limit(1)
    prev = data?.[0] ?? null
  }
  if (!next) {
    const { data } = await baseQuery()
      .order('created_at', { ascending: true })
      .limit(1)
    next = data?.[0] ?? null
  }

  return {
    prev: prev ? { id: prev.id, src: prev.photo_url } : null,
    next: next ? { id: next.id, src: next.photo_url } : null,
  }
}
