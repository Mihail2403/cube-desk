import { Chip, type ChipProps } from '@mui/material';
import type { TicketStatus } from '@/shared/types/api';

const statusLabel: Record<TicketStatus, string> = {
  OPEN: 'Открыт',
  IN_PROGRESS: 'В работе',
  RESOLVED: 'Решён',
  CLOSED: 'Закрыт',
};

const statusColor: Record<TicketStatus, ChipProps['color']> = {
  OPEN: 'info',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
};

interface StatusChipProps {
  status: TicketStatus;
  size?: ChipProps['size'];
}

export const StatusChip = ({ status, size = 'small' }: StatusChipProps) => (
  <Chip label={statusLabel[status]} color={statusColor[status]} size={size} variant="outlined" />
);
