export default async function AsyncResponse() {
  return new Response(JSON.stringify({ message: 'Async Response' }), {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
      'x-custom': 'async',
    },
  })
}
