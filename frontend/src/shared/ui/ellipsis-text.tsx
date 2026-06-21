import { Typography, type TypographyProps } from '@mui/material';
import { ellipsisSx } from '@/shared/ui/text-sx';

interface EllipsisTextProps extends TypographyProps {
  titleText?: string;
}

export const EllipsisText = ({
  children,
  titleText,
  sx,
  ...props
}: EllipsisTextProps) => {
  const text = titleText ?? (typeof children === 'string' ? children : undefined);

  return (
    <Typography
      variant="body2"
      noWrap
      title={text}
      sx={{ width: '100%', ...ellipsisSx, ...sx }}
      {...props}
    >
      {children}
    </Typography>
  );
};
