import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useUpdateTicket } from '@/entities/ticket/model/use-tickets';
import { useSupportStaffUsers } from '@/entities/user/model/use-support-users';
import type { TicketResponse, TicketStatus } from '@/shared/types/api';
import { applyApiValidationToForm, mapAxiosErrorToApiError } from '@/shared/api/error-mapper';

const statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const baseSchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(10000).nullable(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
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

export const TicketEditForm = ({
  ticket,
  canChangeStatus,
  canAssignAssignee = false,
  onSaved,
  showHeading = true,
}: TicketEditFormProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const updateTicket = useUpdateTicket(ticket.id);
  const { data: supportUsers = [], isLoading: supportUsersLoading } = useSupportStaffUsers({
    enabled: canAssignAssignee,
  });

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
      ...(canAssignAssignee ? { assignee_id: ticket.assignee_id ?? null } : {}),
    },
  });

  useEffect(() => {
    reset({
      title: ticket.title,
      description: ticket.description || '',
      status: ticket.status,
      ...(canAssignAssignee ? { assignee_id: ticket.assignee_id ?? null } : {}),
    });
  }, [
    reset,
    ticket.id,
    ticket.title,
    ticket.description,
    ticket.status,
    ticket.assignee_id,
    ticket.updated_at,
    canAssignAssignee,
  ]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateTicket.mutateAsync({
        title: values.title,
        description: values.description === '' ? null : values.description,
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
                disabled={supportUsersLoading}
                error={Boolean(errors.assignee_id)}
                helperText={errors.assignee_id?.message}
              >
                <MenuItem value="">Не назначен</MenuItem>
                {supportUsers.map((u) => (
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
