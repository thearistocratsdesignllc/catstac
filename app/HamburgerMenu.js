'use client'
import Link from 'next/link'
import styles from './HamburgerMenu.module.css'

export default function HamburgerMenu({ isOpen, onClose }) {
  return (
    <>
      <div
        className={styles.backdrop}
        style={{ display: isOpen ? 'block' : 'none' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
        aria-hidden={!isOpen}
      >
        <nav className={styles.topNav}>
          <Link href="/" className={styles.navLink} onClick={onClose}>Home</Link>
          <Link href="/winners" className={styles.navLink} onClick={onClose}>Winners</Link>
          <Link href="/rules" className={styles.navLink} onClick={onClose}>Rules</Link>
          <Link href="/why" className={styles.navLink} onClick={onClose}>Why, Catstac?</Link>
        </nav>
        <div className={styles.bottomNav}>
          <Link href="/signin" className={styles.navLink} onClick={onClose}>Sign In / Sign Out</Link>
        </div>
      </div>
    </>
  )
}
