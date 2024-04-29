import type { PropsWithChildren, Child } from 'hono/jsx'
import { useState } from 'hono/jsx'
import Badge from './Badge'

export default function Counter({
  children,
  initial = 0,
  id = '',
  slot,
}: PropsWithChildren<{
  initial?: number
  id?: string
  slot?: Child
}>) {
  const [count, setCount] = useState(initial)
  const increment = () => setCount(count + 1)
  return (
    <div id={id}>
      <Badge name='Counter' />
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
      {children}
      {slot && <div>{slot}</div>}
    </div>
  )
}
