import styles from './page.module.css'
import NavBar from './NavBar'
import IntroModal from './IntroModal'

const cats = [
  { id: 1, src: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=500&fit=crop' },
  { id: 2, src: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=500&fit=crop' },
  { id: 3, src: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=400&h=500&fit=crop' },
  { id: 4, src: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400&h=500&fit=crop' },
  { id: 5, src: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&h=500&fit=crop' },
  { id: 6, src: 'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=400&h=500&fit=crop' },
  { id: 7, src: 'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=400&h=500&fit=crop' },
  { id: 8, src: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400&h=500&fit=crop' },
  { id: 9, src: 'https://images.unsplash.com/photo-1495360010541-f48722b35f7d?w=400&h=500&fit=crop' },
  { id: 10, src: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=400&h=500&fit=crop' },
  { id: 11, src: 'https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=400&h=500&fit=crop' },
  { id: 12, src: 'https://images.unsplash.com/photo-1506755855567-92ff770e8d00?w=400&h=500&fit=crop' },
]

export default function Home() {
  return (
    <main className={styles.main}>
      <IntroModal />
      <NavBar />

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
          <div key={cat.id} className={styles.card}>
            <img src={cat.src} alt="Catestant" className={styles.cardImage} />
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p>You've reached the end of the Catstac.</p>
        <p>It'll be updated until 11:59:59 tonight, and tomorrow it'll be full of new Catestants.</p>
        <p>Please add your own, or tell a friend who'd get it.</p>
        <button className={styles.addButtonBottom}>
          <img src="/assets/button_cat_bottom.png" alt="Add a Cat" className={styles.btnBottom} />
        </button>
      </div>
    </main>
  )
}
