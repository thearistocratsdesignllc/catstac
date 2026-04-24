'use client'
import { useState, useEffect } from 'react'
import styles from './page.module.css'
import VoteConfirmationModal from './VoteConfirmationModal'
import VoteUsedModal from './VoteUsedModal'

const STORAGE_KEY = 'catstac_daily_vote'

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function readTodayVote() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.date !== todayKey()) return null
    return parsed.catId ?? null
  } catch {
    return null
  }
}

export default function VoteButton({ catId }) {
  const [voted, setVoted] = useState(false)
  const [votedCatId, setVotedCatId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [usedOpen, setUsedOpen] = useState(false)

  useEffect(() => {
    const id = readTodayVote()
    setVotedCatId(id)
    setVoted(id === catId)
    setConfirmOpen(false)
    setUsedOpen(false)
  }, [catId])

  const largeSrc = voted ? '/assets/vote_confirmed_button_large.png' : '/assets/vote_button_large.png'
  const smallSrc = voted ? '/assets/vote_confirmed_button_small.png' : '/assets/vote_button_small.png'

  const handleClick = () => {
    if (votedCatId && votedCatId !== catId) {
      setUsedOpen(true)
      return
    }

    if (voted) {
      try { localStorage.removeItem(STORAGE_KEY) } catch {}
      setVoted(false)
      setVotedCatId(null)
      return
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ catId, date: todayKey() }))
    } catch {}
    setVoted(true)
    setVotedCatId(catId)
    setConfirmOpen(true)
  }

  return (
    <>
      <button
        type="button"
        className={styles.voteButton}
        onClick={handleClick}
        aria-pressed={voted}
        aria-label={voted ? 'Vote recorded — tap to undo' : 'Vote for this catestant'}
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
