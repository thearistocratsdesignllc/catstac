'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import VoteConfirmationModal from './VoteConfirmationModal'
import VoteUsedModal from './VoteUsedModal'

export default function VoteButton({ catId, initialVoted = false }) {
  const router = useRouter()
  const [voted, setVoted] = useState(initialVoted)
  const [pending, setPending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [usedOpen, setUsedOpen] = useState(false)

  const largeSrc = voted ? '/assets/vote_confirmed_button_large.png' : '/assets/vote_button_large.png'
  const smallSrc = voted ? '/assets/vote_confirmed_button_small.png' : '/assets/vote_button_small.png'

  const handleClick = async () => {
    if (voted || pending) return
    setPending(true)
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catestant_id: catId }),
      })

      if (res.status === 401) {
        router.push(`/signin?redirectTo=/catestant/${catId}`)
        return
      }

      let body = {}
      try {
        body = await res.json()
      } catch {}

      if (res.ok) {
        setVoted(true)
        setConfirmOpen(true)
        return
      }

      if (body?.error === 'already_voted') {
        setVoted(true)
        return
      }
      if (body?.error === 'no_credits') {
        setUsedOpen(true)
        return
      }
      console.error('vote failed', res.status, body)
    } catch (err) {
      console.error('vote request failed', err)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={styles.voteButton}
        onClick={handleClick}
        disabled={pending}
        aria-pressed={voted}
        aria-label={voted ? 'Vote recorded' : 'Vote for this catestant'}
      >
        <img src={largeSrc} className={`${styles.voteImg} ${styles.voteImgLarge}`} alt="" />
        <img src={smallSrc} className={`${styles.voteImg} ${styles.voteImgSmall}`} alt="" />
      </button>
      <VoteConfirmationModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        catId={catId}
      />
      <VoteUsedModal
        open={usedOpen}
        onClose={() => setUsedOpen(false)}
      />
    </>
  )
}
