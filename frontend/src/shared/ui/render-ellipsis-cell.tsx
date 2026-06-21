import { EllipsisText } from '@/shared/ui/ellipsis-text';

export const renderEllipsisCell = (value: unknown) => {
  const text = value == null ? '' : String(value);

  return <EllipsisText titleText={text}>{text}</EllipsisText>;
};
