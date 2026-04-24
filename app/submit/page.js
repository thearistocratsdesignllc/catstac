'use client'
import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

const MAX_CATS = 10
let nextIdCounter = 2

function newCat() {
  return { id: nextIdCounter++, name: '', sex: 'tom', imageUrl: null }
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M1 3h11M4 3V2a1 1 0 011-1h3a1 1 0 011 1v1M5 6v4M8 6v4M2 3l.8 8a1 1 0 001 .9h5.4a1 1 0 001-.9L11 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" aria-hidden="true" className={styles.uploadIcon}>
      <rect x="3" y="5" width="32" height="26" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 25l9-9 5 5 4-4 9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M26 3v8M23 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CatForm({ cat, index, showRemove, onRemove, onChange }) {
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onChange('imageUrl', url)
  }

  return (
    <div className={styles.card}>
      <div className={styles.catCardTop}>
        <span className={styles.cardLabel}>Catestant #{index + 1}</span>
        {showRemove && (
          <button className={styles.removeBtn} onClick={onRemove} type="button">
            <TrashIcon />
            Remove
          </button>
        )}
      </div>
      <hr className={styles.cardDivider} />

      <div className={styles.catFormBody}>
        <div
          className={styles.uploadArea}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          aria-label="Upload cat photo"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg"
            className={styles.fileInput}
            onChange={handleFileChange}
            tabIndex={-1}
          />
          {cat.imageUrl ? (
            <img src={cat.imageUrl} className={styles.uploadPreview} alt="Cat preview" />
          ) : (
            <>
              <UploadIcon />
              <span className={styles.uploadLabel}>Upload Cat Pic</span>
              <span className={styles.uploadHint}>PNG or JPG</span>
            </>
          )}
        </div>

        <div className={styles.catFields}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor={`cat-name-${cat.id}`}>Cat Name</label>
            <input
              id={`cat-name-${cat.id}`}
              className={styles.input}
              type="text"
              placeholder="e.g. Whiskers"
              value={cat.name}
              onChange={(e) => onChange('name', e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Cat Sex</span>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name={`sex-${cat.id}`}
                  value="tom"
                  checked={cat.sex === 'tom'}
                  onChange={() => onChange('sex', 'tom')}
                  className={styles.radioInput}
                />
                <span className={styles.radioCustom} />
                ♂ Tom
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name={`sex-${cat.id}`}
                  value="queen"
                  checked={cat.sex === 'queen'}
                  onChange={() => onChange('sex', 'queen')}
                  className={styles.radioInput}
                />
                <span className={styles.radioCustom} />
                ♀ Queen
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SubmitPage() {
  const [cats, setCats] = useState([{ id: 1, name: '', sex: 'tom', imageUrl: null }])
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')
  const [agreed, setAgreed] = useState(false)

  const addCat = () => {
    if (cats.length >= MAX_CATS) return
    setCats((prev) => [...prev, newCat()])
  }

  const removeCat = useCallback((id) => {
    setCats((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const updateCat = useCallback((id, field, value) => {
    setCats((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }, [])

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.pageTitle}>Submit a Catestant</h1>

        <div className={styles.intro}>
          <p>
            You can submit as many Catestants as you want, one at a time, but please:{' '}
            <strong>just one cat per picture, no humans in whole or in part, and no AI.</strong>{' '}
            These are things that&rsquo;ll keep the Catstac nice for everyone.
          </p>
          <p>While voting is open, Catestant names will not be shown, and vote totals won&rsquo;t be shown.</p>
        </div>

        <div className={styles.catForms}>
          {cats.map((cat, index) => (
            <CatForm
              key={cat.id}
              cat={cat}
              index={index}
              showRemove={cats.length > 1}
              onRemove={() => removeCat(cat.id)}
              onChange={(field, value) => updateCat(cat.id, field, value)}
            />
          ))}
        </div>

        {cats.length < MAX_CATS && (
          <div className={styles.addRow}>
            <button className={styles.addBtn} onClick={addCat} type="button">
              + Add another Catestant
            </button>
          </div>
        )}

        <div className={styles.card}>
          <div className={styles.catCardTop}>
            <span className={styles.cardLabel}>About You</span>
          </div>
          <hr className={styles.cardDivider} />

          <div className={styles.aboutFields}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="submitter-email">Your Email</label>
              <input
                id="submitter-email"
                className={styles.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="submitter-instagram">Your Instagram</label>
              <input
                id="submitter-instagram"
                className={styles.input}
                type="text"
                placeholder="@yourhandle"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
            </div>
          </div>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              className={styles.checkboxInput}
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className={styles.checkboxCustom} />
            <span className={styles.checkboxText}>
              I confirm this cat is mine (or I have permission to submit), and I consent to Catstac
              featuring this submission. I&rsquo;ve read and agree to the{' '}
              <Link href="/terms" className={styles.link}>terms</Link>.
            </span>
          </label>
        </div>

        <div className={styles.actions}>
          <Link href="/" className={styles.cancelBtn}>Cancel</Link>
          <button className={styles.submitBtn} type="button">
            Submit to the Catstac &rarr;
          </button>
        </div>
      </div>
    </main>
  )
}
