/**
 * Костыль для локального Docker: бэкенд подписывает URL на S3_ENDPOINT_URL (часто http://minio:9000),
 * браузер не открывает хост minio. Подменяем origin на тот, с которого MinIO доступен с хоста (обычно localhost).
 */
const DEFAULT_INTERNAL_ORIGIN = 'http://minio:9000';
const DEFAULT_BROWSER_ORIGIN = 'http://localhost:9000';

export const rewritePresignedUrlForBrowser = (raw: string): string => {
  const from =
    import.meta.env.VITE_S3_PRESIGN_INTERNAL_ORIGIN?.trim() || DEFAULT_INTERNAL_ORIGIN;
  const to = import.meta.env.VITE_S3_PRESIGN_BROWSER_ORIGIN?.trim() || DEFAULT_BROWSER_ORIGIN;

  let url: URL;
  let internalOrigin: URL;
  let browserOrigin: URL;
  try {
    url = new URL(raw);
    internalOrigin = new URL(from);
    browserOrigin = new URL(to);
  } catch {
    return raw;
  }

  if (url.origin !== internalOrigin.origin) {
    return raw;
  }

  return `${browserOrigin.origin}${url.pathname}${url.search}${url.hash}`;
};
