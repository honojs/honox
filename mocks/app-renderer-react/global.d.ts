import '@hono/react-renderer'

// Include the existing mock renderer's `title` prop in @hono/react-renderer's Hono augmentation.
declare module '@hono/react-renderer' {
  interface Props {
    title?: string
  }
}
