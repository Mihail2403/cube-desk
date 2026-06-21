/** Однострочный текст с обрезкой и троеточием. */
export const ellipsisSx = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

/** Многострочный пользовательский текст с сохранением переносов строк. */
export const preWrapBreakSx = {
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
} as const;

/** Имена файлов, URL, hash и другие строки без пробелов. */
export const breakAllSx = {
  wordBreak: 'break-all',
  overflowWrap: 'anywhere',
} as const;

/** Flex/grid-потомок, который должен сжиматься вместо overflow родителя. */
export const flexShrinkSx = {
  flex: 1,
  minWidth: 0,
} as const;
