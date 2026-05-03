import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCatNeighbors } from '../../catsData'
import CatImage from './CatImage'
import VoteButton from './VoteButton'
import styles from './page.module.css'

export default async function CatestantPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: cat, error } = await supabase
    .from('catestants')
    .select('id, photo_url, admin_status')
    .eq('id', id)
    .maybeSingle()

  if (error || !cat || cat.admin_status !== 'approved') notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialVoted = false
  if (user) {
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('user_id', user.id)
      .eq('catestant_id', id)
      .maybeSingle()
    initialVoted = !!existingVote
  }

  const neighbors = await getCatNeighbors(id)
  const self = { id: cat.id, src: cat.photo_url }
  const prev = neighbors?.prev ?? self
  const next = neighbors?.next ?? self

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

        <CatImage key={cat.id} src={cat.photo_url} alt="Catestant" />


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
          <VoteButton catId={cat.id} initialVoted={initialVoted} />
        </div>
      </div>
    </main>
  )
}
