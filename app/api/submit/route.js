import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const VALIDATION_MODEL = 'gpt-4o-mini'

// Pacific-time YYYY-MM-DD for the voting_date column.
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

function addOneDay(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + 1))
  const yy = next.getUTCFullYear()
  const mm = String(next.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(next.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function validateCatPhoto(openai, photoUrl) {
  const response = await openai.chat.completions.create({
    model: VALIDATION_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are validating photos for a cat photo contest. Look at the image and answer three independent yes/no questions. Be conservative: if uncertain about humans or AI generation, mark them true.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              'Answer these three questions about the image:\n' +
              '1. contains_cat — Does the image contain at least one real cat as the subject?\n' +
              '2. has_humans — Is any human visible in whole or in part (face, hand, body, silhouette)?\n' +
              '3. is_ai_generated — Does the image look AI-generated (Midjourney/Stable Diffusion/DALL-E/etc.) rather than a real photograph?\n' +
              'Then provide a short reason explaining the most relevant finding.',
          },
          { type: 'image_url', image_url: { url: photoUrl } },
        ],
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'cat_validation',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['contains_cat', 'has_humans', 'is_ai_generated', 'reason'],
          properties: {
            contains_cat: { type: 'boolean' },
            has_humans: { type: 'boolean' },
            is_ai_generated: { type: 'boolean' },
            reason: { type: 'string' },
          },
        },
      },
    },
  })

  const raw = response.choices[0]?.message?.content
  if (!raw) throw new Error('OpenAI returned no content')
  return JSON.parse(raw)
}

function summarizeFailure(result) {
  const reasons = []
  if (!result.contains_cat) reasons.push('No cat detected in the photo.')
  if (result.has_humans) reasons.push('A human is visible in the photo.')
  if (result.is_ai_generated) reasons.push('The photo appears to be AI-generated.')
  if (reasons.length === 0) return result.reason || 'Did not pass validation.'
  return reasons.join(' ')
}

export async function POST(request) {
  // 1. Auth gate
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  // 2. Parse JSON body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const email = (body?.email || '').toString().trim()
  const instagramRaw = (body?.instagram || '').toString().trim()
  const agreed = body?.agreed === true
  const cats = Array.isArray(body?.cats) ? body.cats : []

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }
  if (!agreed) {
    return NextResponse.json({ error: 'You must agree to the terms.' }, { status: 400 })
  }
  if (cats.length === 0) {
    return NextResponse.json({ error: 'At least one cat is required.' }, { status: 400 })
  }

  // Validate each cat payload + verify the storage path is in the user's folder.
  // The storage RLS policy already enforces this on upload, but a malicious
  // client could still send a URL pointing at someone else's photo — reject it here.
  const userPrefix = `${user.id}/`
  for (let i = 0; i < cats.length; i++) {
    const c = cats[i]
    if (!c || typeof c !== 'object') {
      return NextResponse.json(
        { error: `Catestant #${i + 1} is malformed.` },
        { status: 400 },
      )
    }
    if (!c.id || typeof c.id !== 'string' || !UUID_RE.test(c.id)) {
      return NextResponse.json(
        { error: `Catestant #${i + 1} is missing a valid id.` },
        { status: 400 },
      )
    }
    if (!c.name || typeof c.name !== 'string' || !c.name.trim()) {
      return NextResponse.json(
        { error: `Catestant #${i + 1} is missing a name.` },
        { status: 400 },
      )
    }
    if (c.sex !== 'tom' && c.sex !== 'queen') {
      return NextResponse.json(
        { error: `Catestant #${i + 1} has an invalid sex.` },
        { status: 400 },
      )
    }
    if (!c.photo_url || typeof c.photo_url !== 'string') {
      return NextResponse.json(
        { error: `Catestant #${i + 1} is missing a photo URL.` },
        { status: 400 },
      )
    }
    if (
      !c.photo_storage_path ||
      typeof c.photo_storage_path !== 'string' ||
      !c.photo_storage_path.startsWith(userPrefix)
    ) {
      return NextResponse.json(
        { error: `Catestant #${i + 1} has an invalid photo path.` },
        { status: 403 },
      )
    }
  }

  const instagram = instagramRaw.startsWith('@') ? instagramRaw.slice(1) : instagramRaw

  // 3. Create submission
  const votingDate = pacificDateString()
  const { data: submission, error: submissionError } = await supabaseAdmin
    .from('submissions')
    .insert({
      voting_date: votingDate,
      submitter_email: email,
      submitter_instagram: instagram || null,
      consent_given: agreed,
      user_id: user.id,
    })
    .select()
    .single()

  if (submissionError || !submission) {
    console.error('submission insert failed', submissionError)
    return NextResponse.json(
      { error: 'Could not create submission.' },
      { status: 500 },
    )
  }

  // 4. Per-cat: insert pending row, validate, update row.
  // The photo is already in storage by this point — uploaded by the browser.
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const passed = []
  const failed = []

  for (const cat of cats) {
    const name = cat.name.trim()
    const sex = cat.sex
    const catestantId = cat.id
    const photoUrl = cat.photo_url
    const storagePath = cat.photo_storage_path

    // Insert pending row
    const { data: catRow, error: insertError } = await supabaseAdmin
      .from('catestants')
      .insert({
        id: catestantId,
        submission_id: submission.id,
        voting_date: votingDate,
        cat_name: name,
        cat_sex: sex,
        photo_url: photoUrl,
        photo_storage_path: storagePath,
        is_stock: false,
        ai_status: 'pending',
        admin_status: 'pending_review',
      })
      .select()
      .single()

    if (insertError || !catRow) {
      console.error('catestant insert failed', insertError)
      failed.push({ name, reason: 'Could not save catestant. Please try again.' })
      continue
    }

    // Validate via OpenAI
    let result
    try {
      result = await validateCatPhoto(openai, photoUrl)
    } catch (err) {
      console.error('openai validation failed', err)
      failed.push({
        name,
        reason: 'Photo could not be validated automatically. It will be reviewed manually.',
      })
      continue
    }

    const didPass =
      result.contains_cat && !result.has_humans && !result.is_ai_generated

    if (didPass) {
      // Auto-approve on AI pass — the cat goes straight into today's grid.
      // Failed cats stay at admin_status='pending_review' for the manual queue.
      const now = new Date().toISOString()
      const { error: updateError } = await supabaseAdmin
        .from('catestants')
        .update({
          ai_status: 'passed',
          ai_result: result,
          ai_validated_at: now,
          admin_status: 'approved',
          admin_reviewed_at: now,
        })
        .eq('id', catestantId)
      if (updateError) console.error('passed update failed', updateError)
      passed.push({
        id: catestantId,
        name,
        photo_url: photoUrl,
      })
    } else {
      const reason = summarizeFailure(result)
      const { error: updateError } = await supabaseAdmin
        .from('catestants')
        .update({
          ai_status: 'failed',
          ai_result: result,
          ai_validated_at: new Date().toISOString(),
        })
        .eq('id', catestantId)
      if (updateError) console.error('failed update failed', updateError)
      failed.push({ name, reason })
    }
  }

  return NextResponse.json({
    submission_id: submission.id,
    voting_date: votingDate,
    cotd_date: addOneDay(votingDate),
    passed,
    failed,
  })
}
