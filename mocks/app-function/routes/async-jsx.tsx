export default async function AsyncJsx() {
  await new Promise((resolve) => setTimeout(resolve, 10)) // simulate async work
  return <div>Async JSX Response</div>
}
