import { Chip, type ChipProps } from '@mui/material';
import type { TicketPriority } from '@/shared/types/api';

const priorityLabel: Record<TicketPriority, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Обычный',
  HIGH: 'Высокий',
  URGENT: 'Срочный',
};

const priorityColor: Record<TicketPriority, ChipProps['color']> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'error',
};

interface PriorityChipProps {
  priority: TicketPriority;
  size?: ChipProps['size'];
}

export const PriorityChip = ({ priority, size = 'small' }: PriorityChipProps) => (
  <Chip label={priorityLabel[priority]} color={priorityColor[priority]} size={size} variant="outlined" />
);
