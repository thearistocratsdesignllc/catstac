'use client'
import { useState } from 'react'
import styles from './page.module.css'

// The parent should pass key={cat.id} so a prev/next navigation remounts
// this component and orientation state resets cleanly.
export default function CatImage({ src, alt }) {
  const [orientation, setOrientation] = useState('landscape')

  const handleLoad = (e) => {
    const img = e.currentTarget
    setOrientation(
      img.naturalHeight > img.naturalWidth ? 'portrait' : 'landscape',
    )
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.imageWrap} ${styles[orientation]}`}
      aria-label="Open photo full size"
    >
      <img
        src={src}
        alt={alt}
        className={styles.catImage}
        onLoad={handleLoad}
      />
    </a>
  )
}
