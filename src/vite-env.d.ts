/// <reference types="vite/client" />

/** File contents as a base64 string (see the base64-import plugin in vite.config.ts). */
declare module '*?base64' {
  const data: string
  export default data
}
