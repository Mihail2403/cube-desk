import { Add as AddIcon } from '@mui/icons-material';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicketsList } from '@/entities/ticket/model/use-tickets';
import { TicketCreateDialog } from '@/features/ticket-create/ui/ticket-create-dialog';
import { TicketFilterBar } from '@/features/ticket-filter/ui/ticket-filter-bar';
import { DEFAULT_TICKETS_PAGE_SIZE } from '@/shared/config/constants';
import type { TicketStatus } from '@/shared/types/api';
import { TicketList } from '@/widgets/ticket-list/ui/ticket-list';
import type { GridPaginationModel } from '@mui/x-data-grid';

export const TicketsPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<TicketStatus | ''>('');
  const [ticketIdFilter, setTicketIdFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: DEFAULT_TICKETS_PAGE_SIZE,
  });

  useEffect(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, [status]);

  const { data: rows = [], isLoading } = useTicketsList({
    status: status || undefined,
    limit: paginationModel.pageSize,
    offset: paginationModel.page * paginationModel.pageSize,
  });

  const fullPage = rows.length === paginationModel.pageSize;
  const rowCount = fullPage
    ? (paginationModel.page + 1) * paginationModel.pageSize + 1
    : paginationModel.page * paginationModel.pageSize + rows.length;

  const goToTicketById = () => {
    if (!ticketIdFilter) return;
    navigate(`/tickets/${ticketIdFilter}`);
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
      }}
    >
      <Stack spacing={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight={700}>
          Тикеты
        </Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setCreateOpen(true)}>
          Новый тикет
        </Button>
      </Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ md: 'center' }}
      >
        <TicketFilterBar
          status={status}
          onStatusChange={setStatus}
          ticketIdFilter={ticketIdFilter}
          onTicketIdFilterChange={setTicketIdFilter}
        />
        <Button variant="outlined" onClick={goToTicketById} disabled={!ticketIdFilter}>
          Открыть по ID
        </Button>
      </Stack>
      <TicketList
        rows={rows}
        rowCount={rowCount}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        loading={isLoading}
      />
      <TicketCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      </Stack>
    </Box>
  );
};
