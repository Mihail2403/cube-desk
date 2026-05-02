const IMAGE_FILENAME_PATTERN = /\.(jpe?g|png|gif|webp|bmp|svg|avif)$/i;

/** Определяет изображение по MIME (и по расширению для octet-stream). */
export const isImageMimeType = (mime: string, filename: string): boolean =>
  mime.startsWith('image/') ||
  (mime === 'application/octet-stream' && IMAGE_FILENAME_PATTERN.test(filename));
