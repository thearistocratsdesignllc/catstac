'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import styles from './VoteUsedModal.module.css'

const PACKAGES = [
  { price: '$1', votes: '3 votes' },
  { price: '$5', votes: '10 votes' },
]

export default function VoteUsedModal({ open, onClose, onPurchase }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vote-used-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h1 id="vote-used-title" className={styles.title}>Hold up!</h1>
        <hr className={styles.divider} />

        <p className={styles.body}>
          You&rsquo;ve already used your free vote for the day, but not to worry,
          it&rsquo;s really cheap to get more, and you can keep unused votes for ever and ever.
        </p>
        <p className={styles.prompt}>Please choose from these excellent options!</p>

        <div className={styles.packages}>
          {PACKAGES.map((p) => (
            <button
              key={p.price}
              type="button"
              className={styles.package}
              onClick={() => onPurchase?.(p)}
              aria-label={`Buy ${p.votes} for ${p.price}`}
            >
              <span className={styles.price}>{p.price}</span>
              <span className={styles.votes}>{p.votes}</span>
            </button>
          ))}
        </div>

        <Link href="/" className={styles.backLink}>Back to the Catstac</Link>
      </div>
    </div>
  )
}
