import Counter from '../islands/Counter'

export default function CounterCard({ title }: { title: string }) {
  return (
    <div>
      <h1>{title}</h1>
      <Counter />
    </div>
  )
}
