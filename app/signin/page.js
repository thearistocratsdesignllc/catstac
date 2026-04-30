import { Suspense } from 'react'
import SignInClient from './SignInClient'
import styles from './page.module.css'

export const metadata = {
  title: 'Sign In — Catstac',
}

export default function SignInPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Sign In</h1>
        <div className={styles.divider} />
        <p className={styles.body}>
          Sign in to vote for your favorite Catestant and to add your own cat to the Catstac.
        </p>
        <Suspense fallback={null}>
          <SignInClient />
        </Suspense>
      </div>
    </main>
  )
}
