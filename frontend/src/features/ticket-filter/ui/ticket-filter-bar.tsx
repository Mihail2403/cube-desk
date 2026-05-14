import { FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useTicketCategories } from '@/entities/ticket-category/model/use-ticket-categories';
import type { TicketPriority, TicketStatus } from '@/shared/types/api';

interface TicketFilterBarProps {
  status: TicketStatus | '';
  onStatusChange: (v: TicketStatus | '') => void;
  priority: TicketPriority | '';
  onPriorityChange: (v: TicketPriority | '') => void;
  categoryId: number | '';
  onCategoryIdChange: (v: number | '') => void;
  searchText: string;
  onSearchTextChange: (v: string) => void;
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
  categoryId,
  onCategoryIdChange,
  searchText,
  onSearchTextChange,
  ticketIdFilter,
  onTicketIdFilterChange,
}: TicketFilterBarProps) => {
  const { data: categories = [] } = useTicketCategories();

  const handleStatus = (e: SelectChangeEvent) => {
    onStatusChange((e.target.value || '') as TicketStatus | '');
  };

  const handlePriority = (e: SelectChangeEvent) => {
    onPriorityChange((e.target.value || '') as TicketPriority | '');
  };

  const handleCategory = (e: SelectChangeEvent) => {
    const v = e.target.value;
    onCategoryIdChange(v === '' ? '' : Number(v));
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
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel id="ticket-category-filter">Категория</InputLabel>
        <Select
          labelId="ticket-category-filter"
          label="Категория"
          value={categoryId === '' ? '' : String(categoryId)}
          onChange={handleCategory}
        >
          <MenuItem value="">Все категории</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.id} value={String(c.id)}>
              {c.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        size="small"
        label="Поиск"
        placeholder="Заголовок или описание"
        value={searchText}
        onChange={(e) => onSearchTextChange(e.target.value)}
        sx={{ minWidth: { xs: '100%', sm: 220 }, flex: { sm: 1 } }}
      />
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
