import { Suspense } from 'hono/jsx'
import Counter from '../../islands/Counter'

const SuspenseChild = async () => {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500))
  return <span>Suspense child</span>
}

export default function Interaction() {
  return (
    <>
      <Counter id='suspense' initial={4}>
        <Suspense fallback={<span>Loading...</span>}>
          <SuspenseChild />
        </Suspense>
      </Counter>
    </>
  )
}
