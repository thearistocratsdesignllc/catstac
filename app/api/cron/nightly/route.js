import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const TARGET_GRID_SIZE = 100

function pacificDateString(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const y = parts.find((p) => p.type === 'year').value
  const m = parts.find((p) => p.type === 'month').value
  const d = parts.find((p) => p.type === 'day').value
  return `${y}-${m}-${d}`
}

function shiftDay(yyyyMmDd, deltaDays) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + deltaDays))
  const yy = next.getUTCFullYear()
  const mm = String(next.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(next.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

async function tallyWinners(votingDate, cotdDate) {
  const { data: votes, error: votesErr } = await supabaseAdmin
    .from('votes')
    .select('catestant_id')
    .eq('voting_date', votingDate)
  if (votesErr) throw votesErr
  if (!votes || votes.length === 0) return { inserted: 0, vote_count: 0 }

  const tallies = new Map()
  for (const v of votes) {
    tallies.set(v.catestant_id, (tallies.get(v.catestant_id) || 0) + 1)
  }

  const { data: cats, error: catsErr } = await supabaseAdmin
    .from('catestants')
    .select('id, created_at, is_stock, admin_status')
    .in('id', Array.from(tallies.keys()))
  if (catsErr) throw catsErr

  const eligible = (cats || []).filter(
    (c) => c.is_stock === false && c.admin_status === 'approved',
  )
  if (eligible.length === 0) return { inserted: 0, vote_count: 0 }

  let maxVotes = 0
  for (const c of eligible) {
    const count = tallies.get(c.id) || 0
    if (count > maxVotes) maxVotes = count
  }
  if (maxVotes === 0) return { inserted: 0, vote_count: 0 }

  const winners = eligible
    .filter((c) => (tallies.get(c.id) || 0) === maxVotes)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  const rows = winners.map((c, idx) => ({
    cotd_date: cotdDate,
    catestant_id: c.id,
    vote_count: maxVotes,
    tie_sequence: idx + 1,
  }))

  const { error: insertErr } = await supabaseAdmin.from('winners').insert(rows)
  if (insertErr) throw insertErr

  return { inserted: rows.length, vote_count: maxVotes }
}

async function backfillStockCats(votingDate) {
  const { count, error: countErr } = await supabaseAdmin
    .from('catestants')
    .select('id', { count: 'exact', head: true })
    .eq('voting_date', votingDate)
    .eq('is_stock', false)
    .eq('admin_status', 'approved')
  if (countErr) throw countErr

  const realCount = count ?? 0
  const needed = TARGET_GRID_SIZE - realCount
  if (needed <= 0) return { added: 0, real_count: realCount }

  const { data: stock, error: stockErr } = await supabaseAdmin
    .from('stock_cats')
    .select('id, cat_name, cat_sex, photo_url, photo_storage_path')
  if (stockErr) throw stockErr
  if (!stock || stock.length === 0) return { added: 0, real_count: realCount }

  const pool = [...stock]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const picks = pool.slice(0, Math.min(needed, pool.length))

  const rows = picks.map((s) => ({
    submission_id: null,
    voting_date: votingDate,
    cat_name: s.cat_name,
    cat_sex: s.cat_sex,
    photo_url: s.photo_url,
    photo_storage_path: s.photo_storage_path,
    is_stock: true,
    ai_status: 'passed',
    admin_status: 'approved',
  }))

  const { error: insertErr } = await supabaseAdmin.from('catestants').insert(rows)
  if (insertErr) throw insertErr

  return { added: rows.length, real_count: realCount }
}

export async function GET(request) {
  const expected = process.env.CRON_SECRET
  const auth = request.headers.get('authorization') || ''
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const today = pacificDateString()
  const yesterday = shiftDay(today, -1)
  const cotdDate = today

  try {
    const winnersResult = await tallyWinners(yesterday, cotdDate)
    const stockResult = await backfillStockCats(today)
    return NextResponse.json({
      ok: true,
      voting_date_tallied: yesterday,
      cotd_date: cotdDate,
      winners: winnersResult,
      stock: stockResult,
    })
  } catch (err) {
    console.error('nightly cron failed', err)
    return NextResponse.json(
      { error: 'cron_failed', message: err.message },
      { status: 500 },
    )
  }
}
