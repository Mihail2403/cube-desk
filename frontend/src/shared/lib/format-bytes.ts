export const formatBytes = (bytes: number, locale = 'ru-RU'): string => {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toLocaleString(locale, { maximumFractionDigits: 1 })} ${units[i]}`;
};
