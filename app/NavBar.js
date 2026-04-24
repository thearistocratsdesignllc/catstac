'use client'
import { useState } from 'react'
import Link from 'next/link'
import styles from './page.module.css'
import HamburgerMenu from './HamburgerMenu'

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav className={styles.nav}>
        <button
          className={styles.menuButton}
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <line x1="2" y1="2" x2="18" y2="18" stroke="var(--color-gold)" strokeWidth="2.2" strokeLinecap="round"/>
              <line x1="18" y1="2" x2="2" y2="18" stroke="var(--color-gold)" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          ) : (
            <>
              <img src="/assets/menu_large.png" className={`${styles.menuIcon} ${styles.menuLarge}`} alt="" />
              <img src="/assets/menu_small.png" className={`${styles.menuIcon} ${styles.menuSmall}`} alt="" />
            </>
          )}
        </button>

        <img src="/assets/wordmark_large.png" className={`${styles.wordmark} ${styles.wordmarkLarge}`} alt="catstac" />
        <img src="/assets/wordmark_small.png" className={`${styles.wordmark} ${styles.wordmarkSmall}`} alt="catstac" />

        <Link href="/submit" className={styles.addButton}>
          <img src="/assets/button_cat_top_large.png" className={styles.btnTopLarge} alt="Add a Cat" />
          <img src="/assets/button_cat_top_small.png" className={styles.btnTopSmall} alt="Add a Cat" />
        </Link>
      </nav>

      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
