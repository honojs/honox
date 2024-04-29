import Counter from '../../islands/Counter'

export default function Interaction() {
  return (
    <>
      <Counter initial={5} id='first' />
      <Counter initial={10}>
        <Counter initial={15} />
      </Counter>
      <Counter initial={20} slot={<Counter id='slot' initial={25} />}>
        <Counter initial={30} />
      </Counter>
    </>
  )
}
