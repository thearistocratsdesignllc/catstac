'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './HamburgerMenu.module.css'

export default function HamburgerMenu({ isOpen, onClose }) {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    onClose()
    router.refresh()
  }

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
          {user ? (
            <button type="button" className={styles.navLink} onClick={handleSignOut}>
              Sign Out
            </button>
          ) : (
            <Link href="/signin" className={styles.navLink} onClick={onClose}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
