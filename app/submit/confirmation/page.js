'use client'
import { useState } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

// Mock data — replace with real submissions once the backend is wired up.
// Trim to one entry to preview the single-cat confirmation layout.
const MOCK_SUBMISSIONS = [
  { id: '1234567', name: 'Catestant A', imageUrl: null, date: 'mmddyyyy' },
  { id: '7654321', name: 'Catestant B', imageUrl: null, date: 'mmddyyyy' },
]

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

function SubmissionCard({ submission }) {
  const [copied, setCopied] = useState(false)
  const url = `https://www.catstac.com/${submission.date}/${submission.id}`

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
          {submission.imageUrl ? (
            <img src={submission.imageUrl} className={styles.preview} alt={submission.name} />
          ) : (
            <>
              <UploadIcon />
              <span className={styles.placeholderLabel}>Upload Cat Pic</span>
              <span className={styles.placeholderHint}>PNG or JPG</span>
            </>
          )}
        </div>

        <div className={styles.linkCol}>
          <label className={styles.fieldLabel} htmlFor={`link-${submission.id}`}>Direct Link</label>
          <input
            id={`link-${submission.id}`}
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
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.pageTitle}>Thank you, and good luck!</h1>

        <div className={styles.intro}>
          <p>
            Your cat is eligible to be the Cat of the Day tomorrow, mm/dd/yyyy. Voting will be open
            until 11:59:59pm Pacific time today. We&rsquo;ll send you an email to let you know how they did.
          </p>
          <p>
            While your cat is sure to get some attention for their cuteness, it&rsquo;ll help their chances
            if you put the word out, so be sure to copy the link to their Catestant page, and post it
            where their friends will see it!
          </p>
        </div>

        <div className={styles.cards}>
          {MOCK_SUBMISSIONS.map((s) => (
            <SubmissionCard key={s.id} submission={s} />
          ))}
        </div>

        <div className={styles.backRow}>
          <Link href="/" className={styles.backBtn}>Back to the Catstac</Link>
        </div>
      </div>
    </main>
  )
}
