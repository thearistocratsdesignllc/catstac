import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

async function getCreditBalance(userId) {
  const { data, error } = await supabaseAdmin
    .from('vote_credits')
    .select('delta')
    .eq('user_id', userId)
  if (error) throw error
  return (data || []).reduce((sum, row) => sum + row.delta, 0)
}

export async function POST(request) {
  // Auth gate — uses the cookie SSR client only for getUser().
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  const catestantId = body?.catestant_id
  if (!catestantId || typeof catestantId !== 'string') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  // Verify catestant exists and is approved (stock cats are approved & voteable).
  const { data: cat, error: catError } = await supabaseAdmin
    .from('catestants')
    .select('id, voting_date, admin_status')
    .eq('id', catestantId)
    .maybeSingle()
  if (catError || !cat || cat.admin_status !== 'approved') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  // Rule 1: one vote per user per catestant.
  const { data: existing } = await supabaseAdmin
    .from('votes')
    .select('id')
    .eq('user_id', user.id)
    .eq('catestant_id', catestantId)
    .maybeSingle()
  if (existing) {
    const balance = await getCreditBalance(user.id)
    return NextResponse.json(
      { error: 'already_voted', credit_balance: balance },
      { status: 409 },
    )
  }

  // Rule 2: one free vote per user per voting day.
  const { data: freeRow } = await supabaseAdmin
    .from('votes')
    .select('id')
    .eq('user_id', user.id)
    .eq('voting_date', cat.voting_date)
    .eq('vote_type', 'free')
    .maybeSingle()

  if (!freeRow) {
    const { error: voteErr } = await supabaseAdmin.from('votes').insert({
      user_id: user.id,
      catestant_id: catestantId,
      voting_date: cat.voting_date,
      vote_type: 'free',
    })
    if (voteErr) {
      if (voteErr.code === '23505') {
        const balance = await getCreditBalance(user.id)
        return NextResponse.json(
          { error: 'already_voted', credit_balance: balance },
          { status: 409 },
        )
      }
      console.error('free vote insert failed', voteErr)
      return NextResponse.json({ error: 'vote_failed' }, { status: 500 })
    }
    const balance = await getCreditBalance(user.id)
    return NextResponse.json({ vote_type: 'free', credit_balance: balance })
  }

  // Free already used today — fall back to a purchased credit.
  const balance = await getCreditBalance(user.id)
  if (balance <= 0) {
    return NextResponse.json(
      { error: 'no_credits', credit_balance: 0 },
      { status: 402 },
    )
  }

  // Insert vote first — the unique index is the source of truth, the ledger tracks the cost.
  const { error: voteErr } = await supabaseAdmin.from('votes').insert({
    user_id: user.id,
    catestant_id: catestantId,
    voting_date: cat.voting_date,
    vote_type: 'purchased',
  })
  if (voteErr) {
    if (voteErr.code === '23505') {
      return NextResponse.json(
        { error: 'already_voted', credit_balance: balance },
        { status: 409 },
      )
    }
    console.error('purchased vote insert failed', voteErr)
    return NextResponse.json({ error: 'vote_failed' }, { status: 500 })
  }

  const { error: spendErr } = await supabaseAdmin.from('vote_credits').insert({
    user_id: user.id,
    delta: -1,
    source: 'spent',
    catestant_id: catestantId,
  })
  if (spendErr) {
    // Vote is already cast; ledger is now off by one and needs reconciliation.
    console.error('credit deduction failed AFTER purchased vote was recorded', spendErr)
  }

  return NextResponse.json({
    vote_type: 'purchased',
    credit_balance: balance - 1,
  })
}
