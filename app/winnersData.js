import { createClient } from '../lib/supabase/server'

function formatCotdDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${m}.${d}.${y.slice(2)}`
}

function rowToWinner(row) {
  const cat = Array.isArray(row.catestants) ? row.catestants[0] : row.catestants
  return {
    id: row.id,
    name: cat?.cat_name ?? '',
    date: formatCotdDate(row.cotd_date),
    src: cat?.photo_url ?? '',
  }
}

export async function getWinners() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('winners')
    .select('id, cotd_date, tie_sequence, catestants ( cat_name, photo_url )')
    .order('cotd_date', { ascending: false })
    .order('tie_sequence', { ascending: true })

  if (error) {
    console.error('getWinners error:', error)
    return []
  }
  return data.map(rowToWinner)
}

export async function getLatestWinner() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('winners')
    .select('id, cotd_date, tie_sequence, catestants ( cat_name, photo_url )')
    .order('cotd_date', { ascending: false })
    .order('tie_sequence', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('getLatestWinner error:', error)
    return null
  }
  return data ? rowToWinner(data) : null
}

export async function getWinnerById(id) {
  const winners = await getWinners()
  return winners.find((w) => String(w.id) === String(id)) || null
}

export async function getWinnerNeighbors(id) {
  const winners = await getWinners()
  const idx = winners.findIndex((w) => String(w.id) === String(id))
  if (idx === -1) return null
  return {
    winner: winners[idx],
    prev: winners[(idx - 1 + winners.length) % winners.length],
    next: winners[(idx + 1) % winners.length],
  }
}
