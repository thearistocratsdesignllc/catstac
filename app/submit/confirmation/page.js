'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

const SITE_ORIGIN = 'https://www.catstac.com'

function formatDisplayDate(yyyyMmDd) {
  if (!yyyyMmDd) return ''
  const [y, m, d] = yyyyMmDd.split('-')
  return `${m}/${d}/${y}`
}

function SubmissionCard({ cat }) {
  const [copied, setCopied] = useState(false)
  const url = `${SITE_ORIGIN}/catestant/${cat.id}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard API unavailable — silently ignore.
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardBody}>
        <div className={styles.imageArea}>
          {cat.photo_url ? (
            <img src={cat.photo_url} className={styles.preview} alt={cat.name} />
          ) : null}
        </div>

        <div className={styles.linkCol}>
          <label className={styles.fieldLabel} htmlFor={`link-${cat.id}`}>
            Direct Link to {cat.name}
          </label>
          <input
            id={`link-${cat.id}`}
            className={styles.input}
            type="text"
            value={url}
            readOnly
          />
          <button type="button" className={styles.copyBtn} onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy this link'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  const [result, setResult] = useState(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('catstac_submission_result')
      if (raw) setResult(JSON.parse(raw))
    } catch {
      // ignore parse errors
    }
    setHydrated(true)
  }, [])

  if (!hydrated) return null

  if (!result || !result.passed?.length) {
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <h1 className={styles.pageTitle}>No recent submission</h1>
          <div className={styles.intro}>
            <p>We don&rsquo;t have a submission to confirm here. Submit a cat to get started.</p>
          </div>
          <div className={styles.backRow}>
            <Link href="/submit" className={styles.backBtn}>Submit a Catestant</Link>
          </div>
        </div>
      </main>
    )
  }

  const { passed, failed = [], cotd_date } = result
  const displayDate = formatDisplayDate(cotd_date)
  const catsLabel = passed.length === 1 ? 'cat is' : 'cats are'

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.pageTitle}>Thank you, and good luck!</h1>

        <div className={styles.intro}>
          <p>
            Your {catsLabel} eligible to be the Cat of the Day tomorrow{displayDate ? `, ${displayDate}` : ''}. Voting will be open
            until 11:59:59pm Pacific time today. We&rsquo;ll send you an email to let you know how they did.
          </p>
          <p>
            While your {passed.length === 1 ? 'cat is' : 'cats are'} sure to get some attention for {passed.length === 1 ? 'their' : 'their'} cuteness, it&rsquo;ll help {passed.length === 1 ? 'their' : 'their'} chances
            if you put the word out, so be sure to copy the {passed.length === 1 ? 'link' : 'links'} below and post {passed.length === 1 ? 'it' : 'them'}
            {' '}where {passed.length === 1 ? 'their' : 'their'} friends will see {passed.length === 1 ? 'it' : 'them'}!
          </p>
        </div>

        {failed.length > 0 && (
          <div className={styles.failedBanner}>
            <strong>A heads-up:</strong> these didn&rsquo;t pass validation and aren&rsquo;t in the contest:
            <ul>
              {failed.map((f, idx) => (
                <li key={idx}><strong>{f.name}:</strong> {f.reason}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.cards}>
          {passed.map((cat) => (
            <SubmissionCard key={cat.id} cat={cat} />
          ))}
        </div>

        <div className={styles.backRow}>
          <Link href="/" className={styles.backBtn}>Back to the Catstac</Link>
        </div>
      </div>
    </main>
  )
}
