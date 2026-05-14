import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTicketCategories } from '@/entities/ticket-category/model/use-ticket-categories';
import { useUpdateTicket } from '@/entities/ticket/model/use-tickets';
import { useUsers } from '@/entities/user/model/use-users';
import type { TicketResponse, TicketStatus, TicketPriority, UserRole } from '@/shared/types/api';
import { applyApiValidationToForm, mapAxiosErrorToApiError } from '@/shared/api/error-mapper';

const statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const priorities: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const baseSchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(10000).nullable(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  category_id: z.coerce.number().int().positive(),
});

type FormValues = z.infer<typeof baseSchema> & { assignee_id?: number | null };

interface TicketEditFormProps {
  ticket: TicketResponse;
  canChangeStatus: boolean;
  /** Назначение ответственного (support/admin) */
  canAssignAssignee?: boolean;
  onSaved?: () => void;
  /** Подзаголовок над полями (в диалоге обычно скрывают — заголовок в DialogTitle) */
  showHeading?: boolean;
}

const statusLabel: Record<TicketStatus, string> = {
  OPEN: 'Открыт',
  IN_PROGRESS: 'В работе',
  RESOLVED: 'Решён',
  CLOSED: 'Закрыт',
};

const priorityLabel: Record<TicketPriority, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Обычный',
  HIGH: 'Высокий',
  URGENT: 'Срочный',
};

export const TicketEditForm = ({
  ticket,
  canChangeStatus,
  canAssignAssignee = false,
  onSaved,
  showHeading = true,
}: TicketEditFormProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const updateTicket = useUpdateTicket(ticket.id);
  const { data: categories = [], isLoading: categoriesLoading } = useTicketCategories();
  const { data: allUsers = [], isLoading: usersLoading } = useUsers({
    enabled: canAssignAssignee,
  });

  const assigneeCandidates = useMemo(() => {
    const staffRoles: UserRole[] = ['SUPPORT', 'ADMIN'];
    return allUsers.filter((u) => staffRoles.includes(u.role));
  }, [allUsers]);

  const schema = useMemo(
    () =>
      canAssignAssignee
        ? baseSchema.extend({
            assignee_id: z.number().nullable(),
          })
        : baseSchema,
    [canAssignAssignee],
  );

  const resolver = useMemo(() => zodResolver(schema), [schema]);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver,
    defaultValues: {
      title: ticket.title,
      description: ticket.description || '',
      status: ticket.status,
      priority: ticket.priority,
      category_id: ticket.category_id,
      ...(canAssignAssignee ? { assignee_id: ticket.assignee_id ?? null } : {}),
    },
  });

  useEffect(() => {
    reset({
      title: ticket.title,
      description: ticket.description || '',
      status: ticket.status,
      priority: ticket.priority,
      category_id: ticket.category_id,
      ...(canAssignAssignee ? { assignee_id: ticket.assignee_id ?? null } : {}),
    });
  }, [
    reset,
    ticket.id,
    ticket.title,
    ticket.description,
    ticket.status,
    ticket.priority,
    ticket.category_id,
    ticket.assignee_id,
    ticket.updated_at,
    canAssignAssignee,
  ]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateTicket.mutateAsync({
        title: values.title,
        description: values.description === '' ? null : values.description,
        priority: values.priority,
        category_id: values.category_id,
        ...(canChangeStatus ? { status: values.status } : {}),
        ...(canAssignAssignee && 'assignee_id' in values ? { assignee_id: values.assignee_id } : {}),
      });
      enqueueSnackbar('Сохранено', { variant: 'success' });
      onSaved?.();
    } catch (e) {
      const api = mapAxiosErrorToApiError(e);
      if (api.status === 422) {
        applyApiValidationToForm(api, setError);
      }
      setError('root', { message: api.message });
    }
  });

  return (
    <Box component="form" onSubmit={onSubmit}>
      <Stack spacing={2}>
        {showHeading && (
          <Typography variant="subtitle2" color="text.secondary">
            Редактирование тикета
          </Typography>
        )}
        {errors.root?.message && (
          <Typography color="error" variant="body2">
            {errors.root.message}
          </Typography>
        )}
        <TextField
          label="Заголовок"
          fullWidth
          error={Boolean(errors.title)}
          helperText={errors.title?.message}
          {...register('title')}
        />
        <TextField
          label="Описание"
          fullWidth
          multiline
          minRows={3}
          error={Boolean(errors.description)}
          helperText={errors.description?.message}
          {...register('description')}
        />
        {canChangeStatus && (
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <TextField {...field} select label="Статус" fullWidth>
                {statuses.map((s) => (
                  <MenuItem key={s} value={s}>
                    {statusLabel[s]}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        )}
        <Controller
          name="priority"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Приоритет"
              fullWidth
              error={Boolean(errors.priority)}
              helperText={errors.priority?.message}
            >
              {priorities.map((p) => (
                <MenuItem key={p} value={p}>
                  {priorityLabel[p]}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="category_id"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Категория"
              fullWidth
              disabled={categoriesLoading}
              error={Boolean(errors.category_id)}
              helperText={errors.category_id?.message}
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        {canAssignAssignee && (
          <Controller
            name="assignee_id"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value === null || field.value === undefined ? '' : field.value}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === '' ? null : Number(v));
                }}
                select
                label="Ответственный"
                fullWidth
                disabled={usersLoading}
                error={Boolean(errors.assignee_id)}
                helperText={errors.assignee_id?.message}
              >
                <MenuItem value="">Не назначен</MenuItem>
                {assigneeCandidates.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.login} ({u.role})
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        )}
        <Button type="submit" variant="outlined" disabled={updateTicket.isPending}>
          {updateTicket.isPending ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </Stack>
    </Box>
  );
};
