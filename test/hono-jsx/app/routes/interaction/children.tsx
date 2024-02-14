import Counter from '../../islands/Counter'

const AsyncChild = async () => {
  return <span>Async child</span>
}

export default function Interaction() {
  return (
    <>
      <Counter id='sync'>
        <span>Sync child</span>
      </Counter>
      <Counter id='async' initial={2}>
        <AsyncChild />
      </Counter>
    </>
  )
}
