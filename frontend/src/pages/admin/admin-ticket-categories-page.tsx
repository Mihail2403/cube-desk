import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import {
  useCreateTicketCategory,
  useDeleteTicketCategory,
  useUpdateTicketCategory,
} from '@/entities/admin/model/use-admin-ticket-categories';
import { useTicketCategories } from '@/entities/ticket-category/model/use-ticket-categories';
import { formatDateTime } from '@/shared/lib/format-date';
import type { TicketCategoryResponse } from '@/shared/types/api';
import { renderEllipsisCell } from '@/shared/ui/render-ellipsis-cell';

export const AdminTicketCategoriesPage = () => {
  const { data: rows = [], isLoading, isError } = useTicketCategories();
  const createCategory = useCreateTicketCategory();
  const updateCategory = useUpdateTicketCategory();
  const deleteCategory = useDeleteTicketCategory();

  const [newName, setNewName] = useState('');
  const [editRow, setEditRow] = useState<TicketCategoryResponse | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const columns: GridColDef<TicketCategoryResponse>[] = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 90 },
      {
        field: 'name',
        headerName: 'Название',
        flex: 1,
        minWidth: 200,
        renderCell: (params) => renderEllipsisCell(params.value),
      },
      {
        field: 'created_at',
        headerName: 'Создана',
        width: 180,
        valueGetter: (_v, row) => formatDateTime(row.created_at),
      },
      {
        field: 'actions',
        headerName: '',
        width: 100,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: '100%' }}>
            <Tooltip title="Переименовать">
              <IconButton
                size="small"
                aria-label="Переименовать"
                onClick={() => {
                  setEditRow(params.row);
                  setEditName(params.row.name);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Удалить">
              <IconButton
                size="small"
                aria-label="Удалить"
                color="error"
                onClick={() => setDeleteId(params.row.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [],
  );

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createCategory.mutate(name, {
      onSuccess: () => setNewName(''),
    });
  };

  const handleSaveEdit = () => {
    if (!editRow) return;
    const name = editName.trim();
    if (!name) return;
    updateCategory.mutate(
      { categoryId: editRow.id, name },
      {
        onSuccess: () => {
          setEditRow(null);
          setEditName('');
        },
      },
    );
  };

  const handleConfirmDelete = () => {
    if (deleteId === null) return;
    deleteCategory.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Typography color="error" variant="body2">
        Не удалось загрузить категории.
      </Typography>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700} component="h1">
        Категории тикетов
      </Typography>
      <Typography variant="body2" color="text.secondary" maxWidth={720}>
        Категории используются при создании и редактировании тикетов. Удалить можно только категорию, к которой не
        привязан ни один тикет.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
        <TextField
          size="small"
          label="Новая категория"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleCreate();
            }
          }}
        />
        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={!newName.trim() || createCategory.isPending}
        >
          {createCategory.isPending ? 'Добавление…' : 'Добавить'}
        </Button>
      </Stack>

      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        disableRowSelectionOnClick
        autoHeight
        pageSizeOptions={[25, 50, 100]}
        initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
        sx={{ minHeight: 360, border: 'none' }}
      />

      <Dialog open={Boolean(editRow)} onClose={() => setEditRow(null)} fullWidth maxWidth="xs">
        <DialogTitle>Переименовать категорию</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditRow(null)}>Отмена</Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={!editName.trim() || updateCategory.isPending}
          >
            {updateCategory.isPending ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)}>
        <DialogTitle>Удалить категорию?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Это действие необратимо. Если к категории привязаны тикеты, удаление будет отклонено сервером.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Отмена</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={deleteCategory.isPending}
          >
            {deleteCategory.isPending ? 'Удаление…' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
