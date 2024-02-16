import Counter from '../../islands/Counter'

const AsyncChild = async () => {
  return <span>Async child</span>
}

export default function Interaction() {
  return (
    <>
      <Counter id='sync'>
        <div>
          <h3 id="sync-header">Sync</h3>
          <span data-content="Sync child">Sync child</span>
        </div>
      </Counter>
      <Counter id='async' initial={2}>
        <AsyncChild />
      </Counter>
    </>
  )
}
