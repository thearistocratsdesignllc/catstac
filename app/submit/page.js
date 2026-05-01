'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

const MAX_CATS = 10
let nextIdCounter = 2

function newCat() {
  return { id: nextIdCounter++, name: '', sex: 'tom', file: null, imageUrl: null }
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M1 3h11M4 3V2a1 1 0 011-1h3a1 1 0 011 1v1M5 6v4M8 6v4M2 3l.8 8a1 1 0 001 .9h5.4a1 1 0 001-.9L11 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true" className={styles.uploadIcon}>
      <rect x="3" y="5" width="32" height="26" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 25l9-9 5 5 4-4 9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M26 3v8M23 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CatForm({ cat, index, showRemove, onRemove, onChange }) {
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onChange('file', file)
    onChange('imageUrl', url)
  }

  return (
    <div className={styles.card}>
      <div className={styles.catCardTop}>
        <span className={styles.cardLabel}>Catestant #{index + 1}</span>
        {showRemove && (
          <button className={styles.removeBtn} onClick={onRemove} type="button">
            <TrashIcon />
            Remove
          </button>
        )}
      </div>
      <hr className={styles.cardDivider} />

      <div className={styles.catFormBody}>
        <div
          className={styles.uploadArea}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          aria-label="Upload cat photo"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg"
            className={styles.fileInput}
            onChange={handleFileChange}
            tabIndex={-1}
          />
          {cat.imageUrl ? (
            <img src={cat.imageUrl} className={styles.uploadPreview} alt="Cat preview" />
          ) : (
            <>
              <UploadIcon />
              <span className={styles.uploadLabel}>Upload Cat Pic</span>
              <span className={styles.uploadHint}>PNG or JPG</span>
            </>
          )}
        </div>

        <div className={styles.catFields}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor={`cat-name-${cat.id}`}>Cat Name</label>
            <input
              id={`cat-name-${cat.id}`}
              className={styles.input}
              type="text"
              placeholder="e.g. Whiskers"
              value={cat.name}
              onChange={(e) => onChange('name', e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Cat Sex</span>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name={`sex-${cat.id}`}
                  value="tom"
                  checked={cat.sex === 'tom'}
                  onChange={() => onChange('sex', 'tom')}
                  className={styles.radioInput}
                />
                <span className={styles.radioCustom} />
                ♂ Tom
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name={`sex-${cat.id}`}
                  value="queen"
                  checked={cat.sex === 'queen'}
                  onChange={() => onChange('sex', 'queen')}
                  className={styles.radioInput}
                />
                <span className={styles.radioCustom} />
                ♀ Queen
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SubmitPage() {
  const router = useRouter()
  const [cats, setCats] = useState([{ id: 1, name: '', sex: 'tom', file: null, imageUrl: null }])
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [failed, setFailed] = useState([])

  const addCat = () => {
    if (cats.length >= MAX_CATS) return
    setCats((prev) => [...prev, newCat()])
  }

  const removeCat = useCallback((id) => {
    setCats((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const updateCat = useCallback((id, field, value) => {
    setCats((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }, [])

  const handleSubmit = async () => {
    setError('')
    setFailed([])

    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    if (!agreed) {
      setError('Please agree to the terms before submitting.')
      return
    }
    for (let i = 0; i < cats.length; i++) {
      if (!cats[i].file) {
        setError(`Catestant #${i + 1} is missing a photo.`)
        return
      }
      if (!cats[i].name.trim()) {
        setError(`Catestant #${i + 1} is missing a name.`)
        return
      }
    }

    const formData = new FormData()
    formData.set('email', email.trim())
    formData.set('instagram', instagram.trim())
    formData.set('agreed', String(agreed))
    cats.forEach((cat) => {
      formData.append('catNames', cat.name.trim())
      formData.append('catSexes', cat.sex)
      formData.append('catPhotos', cat.file)
    })

    setSubmitting(true)
    try {
      const res = await fetch('/api/submit', { method: 'POST', body: formData })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }

      const passedCats = data.passed || []
      const failedCats = data.failed || []

      if (passedCats.length === 0) {
        setError(
          'None of your cats passed validation. Please check the issues below and try again.',
        )
        setFailed(failedCats)
        setSubmitting(false)
        return
      }

      // Some or all passed — proceed to confirmation. The page reads this on mount.
      sessionStorage.setItem(
        'catstac_submission_result',
        JSON.stringify({
          submission_id: data.submission_id,
          voting_date: data.voting_date,
          cotd_date: data.cotd_date,
          passed: passedCats,
          failed: failedCats,
        }),
      )
      router.push('/submit/confirmation')
    } catch (err) {
      console.error(err)
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.pageTitle}>Submit a Catestant</h1>

        <div className={styles.intro}>
          <p>
            You can submit as many Catestants as you want, one at a time, but please:{' '}
            <strong>just one cat per picture, no humans in whole or in part, and no AI.</strong>{' '}
            These are things that&rsquo;ll keep the Catstac nice for everyone.
          </p>
          <p>While voting is open, Catestant names will not be shown, and vote totals won&rsquo;t be shown.</p>
        </div>

        {error && <div className={styles.errorBanner} role="alert">{error}</div>}

        {failed.length > 0 && (
          <div className={styles.failedBanner}>
            <strong>These didn&rsquo;t pass validation:</strong>
            <ul>
              {failed.map((f, idx) => (
                <li key={idx}><strong>{f.name}:</strong> {f.reason}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.catForms}>
          {cats.map((cat, index) => (
            <CatForm
              key={cat.id}
              cat={cat}
              index={index}
              showRemove={cats.length > 1}
              onRemove={() => removeCat(cat.id)}
              onChange={(field, value) => updateCat(cat.id, field, value)}
            />
          ))}
        </div>

        {cats.length < MAX_CATS && (
          <div className={styles.addRow}>
            <button className={styles.addBtn} onClick={addCat} type="button" disabled={submitting}>
              + Add another Catestant
            </button>
          </div>
        )}

        <div className={styles.card}>
          <div className={styles.catCardTop}>
            <span className={styles.cardLabel}>About You</span>
          </div>
          <hr className={styles.cardDivider} />

          <div className={styles.aboutFields}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="submitter-email">Your Email</label>
              <input
                id="submitter-email"
                className={styles.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="submitter-instagram">Your Instagram</label>
              <input
                id="submitter-instagram"
                className={styles.input}
                type="text"
                placeholder="@yourhandle"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
            </div>
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className={styles.checkboxCustom} />
            <span className={styles.checkboxText}>
              I confirm this cat is mine (or I have permission to submit), and I consent to Catstac
              featuring this submission. I&rsquo;ve read and agree to the{' '}
              <Link href="/terms" className={styles.link}>terms</Link>.
            </span>
          </label>
        </div>

        <div className={styles.actions}>
          <Link href="/" className={styles.cancelBtn} aria-disabled={submitting}>Cancel</Link>
          <button
            className={styles.submitBtn}
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Validating your cats…' : 'Submit to the Catstac →'}
          </button>
        </div>
      </div>

      {submitting && (
        <div className={styles.loadingOverlay} role="status" aria-live="polite">
          <div className={styles.loadingCard}>
            <div className={styles.spinner} aria-hidden="true" />
            <p className={styles.loadingTitle}>Validating your cats…</p>
            <p className={styles.loadingSub}>This can take a few seconds per cat.</p>
          </div>
        </div>
      )}
    </main>
  )
}
