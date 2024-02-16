import { Suspense } from 'hono/jsx'
import Counter from '../../islands/Counter'

const SuspenseNeverChild = async () => {
  await new Promise(() => {}) // never resolves
  return <span>Suspense child</span>
}

export default function Interaction() {
  return (
    <>
      <Counter id='suspense-never' initial={6}>
        <Suspense fallback={<span>Loading...</span>}>
          <SuspenseNeverChild />
        </Suspense>
      </Counter>
    </>
  )
}
