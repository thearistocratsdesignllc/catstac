import Link from 'next/link'
import styles from './page.module.css'
import { getWinners } from '../winnersData'

export const metadata = {
  title: 'Winners — Catstac',
}

export const dynamic = 'force-dynamic'

export default async function WinnersPage() {
  const winners = await getWinners()
  return (
    <main className={styles.main}>
      <p className={styles.pageTitle}>Look at the winning Catestants!</p>

      <div className={styles.grid}>
        {winners.map((winner) => (
          <Link key={winner.id} href={`/winners/${winner.id}`} className={styles.card}>
            <img src={winner.src} alt={winner.name} className={styles.cardImage} />
            <div className={styles.sash}>
              <span className={styles.sashName}>{winner.name}</span>
              <span className={styles.sashDate}>{winner.date}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.footer}>
        <p>You&rsquo;ve reached the end of the Catstac Winner&rsquo;s grid.</p>
        <p>There will be a new winner tomorrow, so be sure to visit again!</p>
        <Link href="/submit" className={styles.addButtonBottom}>
          <img src="/assets/button_cat_bottom.png" alt="Add a Cat" className={styles.btnBottom} />
        </Link>
      </div>
    </main>
  )
}
