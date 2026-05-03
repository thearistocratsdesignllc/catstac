'use client'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'

// Horizontal swipe must be at least this many pixels to count as a navigation.
const MIN_HORIZONTAL = 50
// If the swipe's vertical component exceeds this, treat it as a scroll
// gesture and ignore — keeps page scrolling responsive on tall layouts.
const MAX_VERTICAL = 80

export default function SwipeNav({ prevHref, nextHref, children, className }) {
  const router = useRouter()
  const startRef = useRef(null)

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) {
      startRef.current = null
      return
    }
    const t = e.touches[0]
    startRef.current = { x: t.clientX, y: t.clientY }
  }

  const handleTouchEnd = (e) => {
    const start = startRef.current
    startRef.current = null
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.abs(dy) > MAX_VERTICAL) return
    if (Math.abs(dx) < MIN_HORIZONTAL) return
    if (dx < 0) router.push(nextHref)
    else router.push(prevHref)
  }

  const handleTouchCancel = () => {
    startRef.current = null
  }

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
    </div>
  )
}
