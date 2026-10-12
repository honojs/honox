/** @jsxImportSource vue */
import { useId } from 'vue'

export default function IdProbe({ name }: { name: string }) {
  const id = useId()

  return (
    <button
      data-probe={name}
      data-render-id={id}
      onClick={(event) => {
        const button = event.currentTarget as HTMLButtonElement
        button.dataset.clientId = id
      }}
    >
      {name}
    </button>
  )
}
