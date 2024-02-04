import { Script } from '../../../../src/server'

export default function Hello() {
  return (
    <html>
      <head>
        <Script
          src='/app/client.ts'
          prod={true}
          manifest={{
            'app/client.ts': {
              file: 'static/client-abc.js',
            },
          }}
        />
      </head>
    </html>
  )
}
