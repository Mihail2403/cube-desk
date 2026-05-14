import { FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { TicketPriority, TicketStatus } from '@/shared/types/api';

interface TicketFilterBarProps {
  status: TicketStatus | '';
  onStatusChange: (v: TicketStatus | '') => void;
  priority: TicketPriority | '';
  onPriorityChange: (v: TicketPriority | '') => void;
  ticketIdFilter: string;
  onTicketIdFilterChange: (v: string) => void;
}

const statusOptions: Array<{ value: TicketStatus | ''; label: string }> = [
  { value: '', label: 'Все статусы' },
  { value: 'OPEN', label: 'Открыт' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'RESOLVED', label: 'Решён' },
  { value: 'CLOSED', label: 'Закрыт' },
];

const priorityOptions: Array<{ value: TicketPriority | ''; label: string }> = [
  { value: '', label: 'Все приоритеты' },
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Обычный' },
  { value: 'HIGH', label: 'Высокий' },
  { value: 'URGENT', label: 'Срочный' },
];

export const TicketFilterBar = ({
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  ticketIdFilter,
  onTicketIdFilterChange,
}: TicketFilterBarProps) => {
  const handleStatus = (e: SelectChangeEvent) => {
    onStatusChange((e.target.value || '') as TicketStatus | '');
  };

  const handlePriority = (e: SelectChangeEvent) => {
    onPriorityChange((e.target.value || '') as TicketPriority | '');
  };

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel id="ticket-status-filter">Статус</InputLabel>
        <Select
          labelId="ticket-status-filter"
          label="Статус"
          value={status}
          onChange={handleStatus}
        >
          {statusOptions.map((o) => (
            <MenuItem key={o.label + o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel id="ticket-priority-filter">Приоритет</InputLabel>
        <Select
          labelId="ticket-priority-filter"
          label="Приоритет"
          value={priority}
          onChange={handlePriority}
        >
          {priorityOptions.map((o) => (
            <MenuItem key={o.label + o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        size="small"
        label="ID тикета"
        placeholder="Напр. 42"
        value={ticketIdFilter}
        onChange={(e) => onTicketIdFilterChange(e.target.value.replace(/\D/g, ''))}
        sx={{ maxWidth: 160 }}
      />
    </Stack>
  );
};
