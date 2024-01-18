import { useState } from 'hono/jsx'

export default function Counter({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial)
  const increment = () => setCount(count + 1)
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  )
}
