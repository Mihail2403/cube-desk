import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useUpdateUserRole } from '@/entities/admin/model/use-update-user-role';
import { useUsers } from '@/entities/user/model/use-users';
import type { SupportUserResponse, UserRole } from '@/shared/types/api';
import { renderEllipsisCell } from '@/shared/ui/render-ellipsis-cell';

const roleLabel: Record<UserRole, string> = {
  USER: 'Пользователь',
  SUPPORT: 'Поддержка',
  ADMIN: 'Админ',
};

const allRoles: UserRole[] = ['USER', 'SUPPORT', 'ADMIN'];

export const AdminUsersPage = () => {
  const { data: rows = [], isLoading, isError } = useUsers();
  const updateRole = useUpdateUserRole();

  const columns: GridColDef<SupportUserResponse>[] = useMemo(
    () => [
      { field: 'id', headerName: 'ID', width: 90 },
      {
        field: 'login',
        headerName: 'Логин',
        flex: 1,
        minWidth: 160,
        renderCell: (params) => renderEllipsisCell(params.value),
      },
      {
        field: 'role',
        headerName: 'Роль',
        minWidth: 200,
        flex: 0.4,
        sortable: false,
        renderCell: (params) => {
          const row = params.row;
          if (row.role === 'ADMIN') {
            return (
              <Tooltip title="Роль администратора снять нельзя">
                <Chip label={roleLabel.ADMIN} size="small" variant="outlined" sx={{ my: 'auto' }} />
              </Tooltip>
            );
          }
          return (
            <FormControl size="small" fullWidth sx={{ py: 0.5 }}>
              <Select
                value={row.role}
                disabled={updateRole.isPending}
                onChange={(e) => {
                  const next = e.target.value as UserRole;
                  if (next === row.role) return;
                  updateRole.mutate({ userId: row.id, role: next });
                }}
              >
                {allRoles.map((r) => (
                  <MenuItem key={r} value={r}>
                    {roleLabel[r]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        },
      },
    ],
    [updateRole],
  );

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
        Не удалось загрузить список пользователей.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700} component="h1">
        Пользователи
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Всего записей: {rows.length}. Для учётных записей с ролью «Админ» смена роли отключена.
      </Typography>
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
    </Stack>
  );
};
