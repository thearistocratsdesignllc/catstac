import styles from './page.module.css'

export const metadata = {
  title: 'The Rules — Catstac',
}

const rules = [
  {
    number: 1,
    title: 'The Daily Catstac',
    items: [
      'The Catstac is updated in its entirety daily.',
      'Catestants remain in the Catstac until 11:59:59pm Pacific time on the day they\'re submitted.',
      'The presentation order of Catestants is randomized.',
      'Names are not displayed.',
      'Vote totals are not displayed.',
    ],
  },
  {
    number: 2,
    title: 'Cat of the Day',
    items: [
      'The Catestant with the most votes at 11:59:59pm Pacific time each day is declared Cat of the Day. We\'d encourage adding your Catestant to the Catstac earlier in the day to maximize chances of winning. If your Catestant doesn\'t win, you should try again on any other day!',
      'Cats of the Day will be posted with their name and the date of their victory to the Catstac Winners\' Grid.',
      'A portrait of each Cat of the Day, in the style of the 17th-century Dutch Masters, along with the original image, will be posted to the Catstac Instagram Grid (of Winners).',
    ],
  },
  {
    number: 3,
    title: 'Voting',
    items: null,
    votingItems: [
      'One vote per person, per day is free.',
      null, // vote buttons placeholder
      'To preserve the integrity of the Catstac, the math for extra votes does not encourage outsized influence.',
    ],
  },
]

export default function RulesPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.pageTitle}>The Rules</h1>
        <p className={styles.pageSubtitle}>Every cat is a winner, but only one can be Cat of the Day, every day.</p>

        <div className={styles.cards}>
          {rules.map((rule) => (
            <div key={rule.number} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardNumber}>{rule.number}</span>
                <h2 className={styles.cardTitle}>{rule.title}</h2>
              </div>

              {rule.items && (
                <ul className={styles.ruleList}>
                  {rule.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}

              {rule.votingItems && (
                <ul className={styles.ruleList}>
                  <li>{rule.votingItems[0]}</li>
                  <li>
                    Need more than one vote? Extra votes are available for a nominal fee.
                    <span style={{ display: 'block', marginTop: 2 }} />
                  </li>
                </ul>
              )}

              {rule.votingItems && (
                <>
                  <div className={styles.voteButtons}>
                    <button className={styles.voteBtn}>
                      <span className={styles.voteBtnPrice}>$1</span>
                      <span className={styles.voteBtnLabel}>2 votes</span>
                    </button>
                    <button className={styles.voteBtn}>
                      <span className={styles.voteBtnPrice}>$5</span>
                      <span className={styles.voteBtnLabel}>10 votes</span>
                    </button>
                  </div>
                  <ul className={styles.ruleList}>
                    <li>{rule.votingItems[2]}</li>
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
