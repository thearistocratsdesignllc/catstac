'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './page.module.css'

export default function SignInClient() {
  const searchParams = useSearchParams()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(searchParams.get('error') ? 'Sign in failed. Please try again.' : null)

  const redirectTo = searchParams.get('redirectTo') ?? '/'

  async function handleGoogleSignIn() {
    setPending(true)
    setError(null)

    const supabase = createClient()
    const callback = new URL('/auth/callback', window.location.origin)
    callback.searchParams.set('redirectTo', redirectTo)

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback.toString() },
    })

    if (oauthError) {
      setError('Sign in failed. Please try again.')
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={styles.googleBtn}
        onClick={handleGoogleSignIn}
        disabled={pending}
      >
        <GoogleMark />
        <span>{pending ? 'Redirecting…' : 'Continue with Google'}</span>
      </button>
      {error ? <p className={styles.error}>{error}</p> : null}
    </>
  )
}

function GoogleMark() {
  return (
    <svg className={styles.googleMark} viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.81 5.96-2.19l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.32A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l3.01-2.32z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l3.01 2.32C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  )
}
