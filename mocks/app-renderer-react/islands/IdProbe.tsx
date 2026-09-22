/** @jsxImportSource react */
import { useId } from 'react'

export default function IdProbe({ name }: { name: string }) {
  const id = useId()

  return (
    <button
      data-probe={name}
      data-render-id={id}
      onClick={(event) => {
        event.currentTarget.dataset.clientId = id
      }}
    >
      {name}
    </button>
  )
}
