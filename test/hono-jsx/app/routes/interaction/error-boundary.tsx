import { Suspense, ErrorBoundary } from 'hono/jsx'
import Counter from '../../islands/Counter'

const SuspenseChild = async () => {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500))
  return <span>Suspense child</span>
}

const SuspenseFailureChild = async () => {
  throw new Error('Suspense failure')
  return <span>Suspense child</span>
}

export default function Interaction() {
  return (
    <>
      <Counter id='error-boundary-success' initial={2}>
        <ErrorBoundary fallback={<span>Something went wrong</span>}>
          <Suspense fallback={<span>Loading...</span>}>
            <SuspenseChild />
          </Suspense>
        </ErrorBoundary>
      </Counter>
      <Counter id='error-boundary-failure' initial={4}>
        <ErrorBoundary fallback={<span>Something went wrong</span>}>
          <Suspense fallback={<span>Loading...</span>}>
            <SuspenseFailureChild />
          </Suspense>
        </ErrorBoundary>
      </Counter>
    </>
  )
}
