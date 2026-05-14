import type { TicketResponse } from '@/shared/types/api';
import { formatDateTime } from '@/shared/lib/format-date';
import { PriorityChip } from '@/shared/ui/priority-chip';
import { StatusChip } from '@/shared/ui/status-chip';
import { DataGrid, type GridColDef, type GridPaginationModel, type GridRowParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

interface TicketListProps {
  rows: TicketResponse[];
  rowCount: number;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  loading: boolean;
}

export const TicketList = ({
  rows,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  loading,
}: TicketListProps) => {
  const navigate = useNavigate();

  const columns: GridColDef<TicketResponse>[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'title', headerName: 'Заголовок', flex: 1, minWidth: 200 },
    {
      field: 'status',
      headerName: 'Статус',
      width: 140,
      renderCell: (params) => <StatusChip status={params.row.status} />,
    },
    {
      field: 'priority',
      headerName: 'Приоритет',
      width: 130,
      renderCell: (params) => <PriorityChip priority={params.row.priority} />,
    },
    {
      field: 'author',
      headerName: 'Автор',
      minWidth: 120,
      flex: 0.25,
      valueGetter: (_v, row) => row.author.login,
    },
    {
      field: 'assignee',
      headerName: 'Ответственный',
      minWidth: 140,
      flex: 0.4,
      valueGetter: (_v, row) => row.assignee?.login ?? '—',
    },
    {
      field: 'updated_at',
      headerName: 'Обновлён',
      width: 170,
      valueGetter: (_v, row) => formatDateTime(row.updated_at),
    },
  ];

  const handleRowClick = (params: GridRowParams<TicketResponse>) => {
    navigate(`/tickets/${params.id}`);
  };

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      getRowId={(r) => r.id}
      paginationMode="server"
      rowCount={rowCount}
      paginationModel={paginationModel}
      onPaginationModelChange={onPaginationModelChange}
      loading={loading}
      pageSizeOptions={[25, 50, 100]}
      onRowClick={handleRowClick}
      disableRowSelectionOnClick
      autoHeight
      sx={{ minHeight: 400, border: 'none' }}
    />
  );
};
