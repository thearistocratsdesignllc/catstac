'use client'

import { useState, useEffect } from 'react'
import styles from './IntroModal.module.css'

export default function IntroModal() {
  const [visible, setVisible] = useState(false)
  const [neverShow, setNeverShow] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('catstac_intro_dismissed') !== 'true') {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    if (neverShow) {
      localStorage.setItem('catstac_intro_dismissed', 'true')
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="intro-title">
        <h1 id="intro-title" className={styles.title}>Welcome to Catstac</h1>
        <hr className={styles.divider} />
        <p className={styles.subtitle}>
          Every cat is a winner, but only one can be Cat of the Day, every day.
        </p>
        <p className={styles.body}>
          You get one free vote each day, and there&rsquo;s a completely new list of Catestants
          every day, so be sure to come back often!
        </p>
        <p className={styles.aside}>
          <em>If you just can&rsquo;t decide, extra votes are available for cheap.</em>
        </p>
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={neverShow}
            onChange={e => setNeverShow(e.target.checked)}
          />
          Never ever ever show me this message again.
        </label>
        <button className={styles.gotIt} onClick={dismiss}>
          Got it!
        </button>
      </div>
    </div>
  )
}
