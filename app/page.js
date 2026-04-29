import Link from 'next/link'
import styles from './page.module.css'
import IntroModal from './IntroModal'
import { getTodaysCats } from './catsData'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const cats = await getTodaysCats()
  return (
    <main className={styles.main}>
      <IntroModal />

      <div className={styles.winnerBanner}>
        <p className={styles.congratsText}>Congratulations to Vincent!</p>
        <div className={styles.winnerCard}>
          <img
            src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=600&fit=crop"
            alt="Cat of the Day"
            className={styles.winnerImage}
          />
          <div className={styles.winnerSash}>
            <img src="/assets/winner_gradient_large.png" className={`${styles.sashGradient} ${styles.sashGradientLarge}`} alt="" />
            <img src="/assets/winner_text_large.png" className={`${styles.sashText} ${styles.sashTextLarge}`} alt="Cat of the Day" />
            <img src="/assets/rosette_large.png" className={`${styles.rosetteImg} ${styles.rosetteLarge}`} alt="" />
            <img src="/assets/winner_gradient_small.png" className={`${styles.sashGradient} ${styles.sashGradientSmall}`} alt="" />
            <img src="/assets/winner_text_small.png" className={`${styles.sashText} ${styles.sashTextSmall}`} alt="Cat of the Day" />
            <img src="/assets/rosette_small.png" className={`${styles.rosetteImg} ${styles.rosetteSmall}`} alt="" />
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <p className={styles.instructions}>
        Peruse these Catestants, and give your favorite a vote for tomorrow's Cat of the Day.
      </p>

      <div className={styles.grid}>
        {cats.map((cat) => (
          <Link key={cat.id} href={`/catestant/${cat.id}`} className={styles.card}>
            <img src={cat.src} alt="Catestant" className={styles.cardImage} />
          </Link>
        ))}
      </div>

      <div className={styles.footer}>
        <p>You've reached the end of the Catstac.</p>
        <p>It'll be updated until 11:59:59 tonight, and tomorrow it'll be full of new Catestants.</p>
        <p>Please add your own, or tell a friend who'd get it.</p>
        <Link href="/submit" className={styles.addButtonBottom}>
          <img src="/assets/button_cat_bottom.png" alt="Add a Cat" className={styles.btnBottom} />
        </Link>
      </div>
    </main>
  )
}
