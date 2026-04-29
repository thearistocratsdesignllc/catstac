import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getWinnerById, getWinnerNeighbors } from '../../winnersData'
import styles from './page.module.css'

export async function generateMetadata({ params }) {
  const { id } = await params
  const winner = await getWinnerById(id)
  return {
    title: winner ? `${winner.name} — Cat of the Day | Catstac` : 'Catstac',
  }
}

export default async function WinnerDetailPage({ params }) {
  const { id } = await params
  const data = await getWinnerNeighbors(id)
  if (!data) notFound()
  const { winner, prev, next } = data

  return (
    <main className={styles.main}>
      <div className={styles.stage}>
        <Link
          href={`/winners/${prev.id}`}
          className={`${styles.arrowLink} ${styles.prev}`}
          aria-label="Previous winner"
          scroll={false}
        >
          <img src="/assets/previous_arrow_large.png" className={`${styles.arrow} ${styles.arrowLarge}`} alt="" />
          <img src="/assets/previous_arrow_small.png" className={`${styles.arrow} ${styles.arrowSmall}`} alt="" />
        </Link>

        <div className={styles.frame}>
          <div className={styles.imageWrap}>
            <img src={winner.src} alt={winner.name} className={styles.catImage} />
          </div>

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
              <span className={styles.name}>{winner.name}</span>
              <div className={styles.meta}>
                <span className={styles.metaTitle}>Official Catstac Cat of the Day</span>
                <span className={styles.metaDate}>{winner.date}</span>
              </div>
            </div>
          </div>
        </div>

        <Link
          href={`/winners/${next.id}`}
          className={`${styles.arrowLink} ${styles.next}`}
          aria-label="Next winner"
          scroll={false}
        >
          <img src="/assets/next_arrow_large.png" className={`${styles.arrow} ${styles.arrowLarge}`} alt="" />
          <img src="/assets/next_arrow_small.png" className={`${styles.arrow} ${styles.arrowSmall}`} alt="" />
        </Link>
      </div>
    </main>
  )
}
