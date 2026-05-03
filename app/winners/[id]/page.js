import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getWinnerById, getWinnerNeighbors } from '../../winnersData'
import WinnerFrame from './WinnerFrame'
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

        <WinnerFrame key={winner.id} src={winner.src} name={winner.name} date={winner.date} />

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
