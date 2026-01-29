// src/types/env.d.ts
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly VITE_WS_URL: string
    readonly VITE_AI_SERVICE_URL: string
    readonly VITE_APP_TITLE?: string
    readonly VITE_APP_VERSION?: string
    readonly VITE_NODE_ENV?: 'development' | 'production' | 'test'
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

export {}