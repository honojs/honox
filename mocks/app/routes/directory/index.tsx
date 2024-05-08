import DollarCounter from './$counter'
import UnderScoreCounter from './_Counter.island'

export default function Interaction() {
  return (
    <>
      <UnderScoreCounter id='under-score' initial={5} />
      <DollarCounter id='dollar' initial={5} />
    </>
  )
}
