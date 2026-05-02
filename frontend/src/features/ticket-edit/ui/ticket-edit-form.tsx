import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useUpdateTicket } from '@/entities/ticket/model/use-tickets';
import type { TicketResponse, TicketStatus } from '@/shared/types/api';
import { applyApiValidationToForm, mapAxiosErrorToApiError } from '@/shared/api/error-mapper';

const statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const schema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(10000).nullable(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
});

type FormValues = z.infer<typeof schema>;

interface TicketEditFormProps {
  ticket: TicketResponse;
  canChangeStatus: boolean;
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
  onSaved,
  showHeading = true,
}: TicketEditFormProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const updateTicket = useUpdateTicket(ticket.id);
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: ticket.title,
      description: ticket.description || '',
      status: ticket.status,
    },
  });

  useEffect(() => {
    reset({
      title: ticket.title,
      description: ticket.description || '',
      status: ticket.status,
    });
  }, [
    reset,
    ticket.id,
    ticket.title,
    ticket.description,
    ticket.status,
    ticket.updated_at,
  ]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateTicket.mutateAsync({
        title: values.title,
        description: values.description === '' ? null : values.description,
        ...(canChangeStatus ? { status: values.status } : {}),
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
        <Button type="submit" variant="outlined" disabled={updateTicket.isPending}>
          {updateTicket.isPending ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </Stack>
    </Box>
  );
};
