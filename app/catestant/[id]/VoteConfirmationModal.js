'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './VoteConfirmationModal.module.css'

export default function VoteConfirmationModal({ open, onClose, catId }) {
  const [copied, setCopied] = useState(false)
  const url = `https://www.catstac.com/mmddyyyy/${catId}`

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard API unavailable — silently ignore.
    }
  }

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vote-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h1 id="vote-confirm-title" className={styles.title}>Great choice!</h1>
        <hr className={styles.divider} />

        <p className={styles.body}>That cat can get votes until 11:59:59pm tonight.</p>
        <p className={styles.body}>
          If you want to help them out, copy their direct link, and tell their friends!
        </p>

        <input
          className={styles.input}
          type="text"
          value={url}
          readOnly
          aria-label="Direct link to this catestant"
        />

        <button type="button" className={styles.copyBtn} onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy that link!'}
        </button>

        <Link href="/" className={styles.backBtn}>Back to the Catstac</Link>
      </div>
    </div>
  )
}
