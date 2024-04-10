import { Suspense } from 'hono/jsx'
import Counter from '../../islands/Counter'

const SuspenseChild = async () => {
  const initial = await new Promise<number>((resolve) => setTimeout(() => resolve(6), 500))
  return (
    <Counter id='suspense-islands' initial={initial}>
      Suspense Islands
    </Counter>
  )
}

export default function Interaction() {
  return (
    <Suspense fallback={<span>Loading...</span>}>
      <SuspenseChild />
    </Suspense>
  )
}
