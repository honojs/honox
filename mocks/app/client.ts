import { createClient } from '../../src/client'

createClient().then(() => {
  document.body.setAttribute('data-client-loaded', 'true')
})
