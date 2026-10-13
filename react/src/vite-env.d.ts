/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Syncfusion license key. Never commit a real key. */
  readonly VITE_SYNCFUSION_LICENSE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}