import { createClient } from '../../src/client'

createClient()

setTimeout(() => {
  document.body.setAttribute('data-client-loaded', 'true')
})
