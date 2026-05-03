'use client'
import { useState } from 'react'
import styles from './page.module.css'

// The parent should pass key={winner.id} so a prev/next navigation remounts
// this component and orientation state resets cleanly.
export default function WinnerFrame({ src, name, date }) {
  const [orientation, setOrientation] = useState('landscape')

  const handleLoad = (e) => {
    const img = e.currentTarget
    setOrientation(
      img.naturalHeight > img.naturalWidth ? 'portrait' : 'landscape',
    )
  }

  return (
    <div className={`${styles.frame} ${styles[orientation]}`}>
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.imageWrap}
        aria-label={`Open photo of ${name} full size`}
      >
        <img
          src={src}
          alt={name}
          className={styles.catImage}
          onLoad={handleLoad}
        />
      </a>

      <div className={styles.sash}>
        <img
          src="/assets/winner_gradient_large.png"
          className={`${styles.sashGradient} ${styles.sashGradientLarge}`}
          alt=""
        />
        <img
          src="/assets/winner_gradient_small.png"
          className={`${styles.sashGradient} ${styles.sashGradientSmall}`}
          alt=""
        />
        <div className={styles.sashContent}>
          <span className={styles.name}>{name}</span>
          <div className={styles.meta}>
            <span className={styles.metaTitle}>Official Catstac Cat of the Day</span>
            <span className={styles.metaDate}>{date}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
