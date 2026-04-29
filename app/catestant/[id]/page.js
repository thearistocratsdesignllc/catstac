import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCatNeighbors } from '../../catsData'
import VoteButton from './VoteButton'
import styles from './page.module.css'

export default async function CatestantPage({ params }) {
  const { id } = await params
  const data = await getCatNeighbors(id)
  if (!data) notFound()
  const { cat, prev, next } = data

  return (
    <main className={styles.main}>
      <div className={styles.stage}>
        <Link
          href={`/catestant/${prev.id}`}
          className={`${styles.arrowLink} ${styles.prev}`}
          aria-label="Previous catestant"
          scroll={false}
        >
          <img src="/assets/previous_arrow_large.png" className={`${styles.arrow} ${styles.arrowLarge}`} alt="" />
          <img src="/assets/previous_arrow_small.png" className={`${styles.arrow} ${styles.arrowSmall}`} alt="" />
        </Link>

        <div className={styles.imageWrap}>
          <img src={cat.src} alt="Catestant" className={styles.catImage} />
        </div>

        <Link
          href={`/catestant/${next.id}`}
          className={`${styles.arrowLink} ${styles.next}`}
          aria-label="Next catestant"
          scroll={false}
        >
          <img src="/assets/next_arrow_large.png" className={`${styles.arrow} ${styles.arrowLarge}`} alt="" />
          <img src="/assets/next_arrow_small.png" className={`${styles.arrow} ${styles.arrowSmall}`} alt="" />
        </Link>

        <div className={styles.voteCell}>
          <VoteButton catId={cat.id} />
        </div>
      </div>
    </main>
  )
}
