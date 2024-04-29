import type { PropsWithChildren } from 'hono/jsx'
import { useState } from 'hono/jsx'
import Badge from './Badge'

export function NamedCounter({
  children,
  initial = 0,
  id = '',
}: PropsWithChildren<{
  initial?: number
  id?: string
}>) {
  const [count, setCount] = useState(initial)
  const increment = () => setCount(count + 1)
  return (
    <div id={id}>
      <Badge name='Counter' />
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
      {children}
    </div>
  )
}
