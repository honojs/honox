export default function ApiResponse() {
  return new Response(JSON.stringify({ message: 'API Response' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
