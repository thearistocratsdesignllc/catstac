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
  const cats = await getTodaysCats()
  const idx = cats.findIndex((c) => String(c.id) === String(id))
  if (idx === -1) return null
  return {
    cat: cats[idx],
    prev: cats[(idx - 1 + cats.length) % cats.length],
    next: cats[(idx + 1) % cats.length],
  }
}
