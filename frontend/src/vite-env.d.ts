/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** Origin presigned URL с бэкенда в Docker (например http://minio:9000) */
  readonly VITE_S3_PRESIGN_INTERNAL_ORIGIN?: string;
  /** С какого origin браузер ходит к MinIO (например http://localhost:9000) */
  readonly VITE_S3_PRESIGN_BROWSER_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
