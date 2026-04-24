import styles from './page.module.css'

export const metadata = {
  title: 'Why, Catstac?',
}

export default function WhyPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.pageTitle}>Why, Catstac?</h1>

        <div className={styles.card}>
          <p className={styles.salutation}>Dear Visitor,</p>

          <div className={styles.body}>
            <p>I remember when the Internet was all fun and possibility. I created Catstac to recover some of that feeling, and to share it with all of you!</p>
            <p>You&rsquo;re not going to find some of what you&rsquo;re used to online here. Comments, algorithm-enhanced presentation order and vote totals aren&rsquo;t a part of it. I hope that visitors just come by and scroll a grid of cat pics, and that it makes them smile. Comments and things would just pollute it.</p>
            <p>The whole idea of a &ldquo;best cat&rdquo; is just so funny to me. I think that every cat is hilarious, and uniquely appreciated by the people and animals that they share their lives with on any given day; so deciding which cat is best should be a daily thing, determined by those who know them, and by enthusiasts in general, based on a single photograph.</p>
            <p>That&rsquo;s why anybody can vote once a day, and why voters and the people who submit their cats are encouraged to share their vote and the pure joy of Catstac.</p>
            <p className={styles.bodyItalic}>I hope that it makes you as happy as it makes me!</p>
          </div>

          <p className={styles.welcome}>Welcome!</p>

          <p className={styles.signature}>Sandy Foote</p>
          <hr className={styles.signatureDivider} />
          <p className={styles.signerName}>Sandy Foote</p>
          <p className={styles.signerTitle}>Founder, Catstac.</p>
        </div>
      </div>
    </main>
  )
}
