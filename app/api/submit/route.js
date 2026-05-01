import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const STORAGE_BUCKET = 'catestants'
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

function extensionFor(file) {
  const fromName = file.name?.split('.').pop()?.toLowerCase()
  if (fromName === 'jpg' || fromName === 'jpeg') return 'jpg'
  if (fromName === 'png') return 'png'
  if (file.type === 'image/png') return 'png'
  return 'jpg'
}

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

  // 2. Parse form data
  let formData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const email = (formData.get('email') || '').toString().trim()
  const instagramRaw = (formData.get('instagram') || '').toString().trim()
  const agreed = formData.get('agreed') === 'true'
  const names = formData.getAll('catNames').map((n) => n.toString().trim())
  const sexes = formData.getAll('catSexes').map((s) => s.toString())
  const photos = formData.getAll('catPhotos').filter((p) => p instanceof File)

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }
  if (!agreed) {
    return NextResponse.json({ error: 'You must agree to the terms.' }, { status: 400 })
  }
  if (
    photos.length === 0 ||
    photos.length !== names.length ||
    photos.length !== sexes.length
  ) {
    return NextResponse.json(
      { error: 'Each cat needs a photo, name, and sex.' },
      { status: 400 },
    )
  }
  for (let i = 0; i < photos.length; i++) {
    if (!names[i]) {
      return NextResponse.json(
        { error: `Catestant #${i + 1} is missing a name.` },
        { status: 400 },
      )
    }
    if (sexes[i] !== 'tom' && sexes[i] !== 'queen') {
      return NextResponse.json(
        { error: `Catestant #${i + 1} has an invalid sex.` },
        { status: 400 },
      )
    }
    if (!photos[i].size) {
      return NextResponse.json(
        { error: `Catestant #${i + 1} is missing a photo.` },
        { status: 400 },
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

  // 4. Per-cat: upload, insert pending row, validate, update row
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const passed = []
  const failed = []

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    const name = names[i]
    const sex = sexes[i]
    const ext = extensionFor(photo)
    const catestantId = crypto.randomUUID()
    const storagePath = `${submission.id}/${catestantId}.${ext}`

    // Upload
    const buffer = Buffer.from(await photo.arrayBuffer())
    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: photo.type || 'image/jpeg',
        upsert: false,
      })
    if (uploadError) {
      console.error('upload failed', uploadError)
      failed.push({ name, reason: 'Upload failed. Please try again.' })
      continue
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath)

    // Insert pending row
    const { data: catRow, error: insertError } = await supabaseAdmin
      .from('catestants')
      .insert({
        id: catestantId,
        submission_id: submission.id,
        voting_date: votingDate,
        cat_name: name,
        cat_sex: sex,
        photo_url: publicUrl,
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
      result = await validateCatPhoto(openai, publicUrl)
    } catch (err) {
      console.error('openai validation failed', err)
      // Leave row at ai_status=pending so it lands in the manual queue.
      failed.push({
        name,
        reason: 'Photo could not be validated automatically. It will be reviewed manually.',
      })
      continue
    }

    const didPass =
      result.contains_cat && !result.has_humans && !result.is_ai_generated

    if (didPass) {
      const { error: updateError } = await supabaseAdmin
        .from('catestants')
        .update({
          ai_status: 'passed',
          ai_result: result,
          ai_validated_at: new Date().toISOString(),
        })
        .eq('id', catestantId)
      if (updateError) console.error('passed update failed', updateError)
      passed.push({
        id: catestantId,
        name,
        photo_url: publicUrl,
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
