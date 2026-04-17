import styles from './page.module.css'

export default function NavBar() {
  return (
    <nav className={styles.nav}>
      <img src="/assets/menu_large.png" className={`${styles.menuIcon} ${styles.menuLarge}`} alt="Menu" />
      <img src="/assets/menu_small.png" className={`${styles.menuIcon} ${styles.menuSmall}`} alt="Menu" />

      <img src="/assets/wordmark_large.png" className={`${styles.wordmark} ${styles.wordmarkLarge}`} alt="catstac" />
      <img src="/assets/wordmark_small.png" className={`${styles.wordmark} ${styles.wordmarkSmall}`} alt="catstac" />

      <button className={styles.addButton}>
        <img src="/assets/button_cat_top_large.png" className={styles.btnTopLarge} alt="Add a Cat" />
        <img src="/assets/button_cat_top_small.png" className={styles.btnTopSmall} alt="Add a Cat" />
      </button>
    </nav>
  )
}
