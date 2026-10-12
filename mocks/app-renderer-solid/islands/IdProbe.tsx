/** @jsxImportSource solid-js */
import { createUniqueId } from 'solid-js'

export default function IdProbe(props: { name: string }) {
  const id = createUniqueId()

  return (
    <button
      data-probe={props.name}
      data-render-id={id}
      onClick={(event) => {
        event.currentTarget.dataset.clientId = id
      }}
    >
      {props.name}
    </button>
  )
}
