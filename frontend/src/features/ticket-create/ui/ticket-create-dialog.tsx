import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useTicketCategories } from '@/entities/ticket-category/model/use-ticket-categories';
import { useCreateTicket } from '@/entities/ticket/model/use-tickets';
import { applyApiValidationToForm, mapAxiosErrorToApiError } from '@/shared/api/error-mapper';
import type { TicketPriority } from '@/shared/types/api';

const priorities: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const priorityLabel: Record<TicketPriority, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Обычный',
  HIGH: 'Высокий',
  URGENT: 'Срочный',
};

const schema = z.object({
  title: z.string().min(1, 'Укажите заголовок').max(256, 'Максимум 256 символов'),
  description: z
    .string()
    .max(10000, 'Максимум 10000 символов')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  category_id: z.coerce.number().int().positive('Выберите категорию'),
});

type FormValues = z.infer<typeof schema>;

interface TicketCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

export const TicketCreateDialog = ({ open, onClose }: TicketCreateDialogProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const createTicket = useCreateTicket();
  const { data: categories = [], isLoading: categoriesLoading } = useTicketCategories({
    enabled: open,
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', priority: 'MEDIUM', category_id: 0 },
  });

  useEffect(() => {
    if (!open) return;
    const firstId = categories[0]?.id;
    reset({
      title: '',
      description: '',
      priority: 'MEDIUM',
      category_id: firstId ?? 0,
    });
  }, [open, categories, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createTicket.mutateAsync({
        title: values.title,
        description: values.description ?? null,
        priority: values.priority,
        category_id: values.category_id,
      });
      enqueueSnackbar('Тикет создан', { variant: 'success' });
      reset();
      onClose();
    } catch (e) {
      const api = mapAxiosErrorToApiError(e);
      if (api.status === 422) {
        applyApiValidationToForm(api, setError);
      }
      setError('root', { message: api.message });
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Новый тикет</DialogTitle>
      <Box component="form" onSubmit={onSubmit}>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {errors.root?.message && (
              <Typography color="error" variant="body2">
                {errors.root.message}
              </Typography>
            )}
            <TextField
              label="Заголовок"
              fullWidth
              required
              error={Boolean(errors.title)}
              helperText={errors.title?.message}
              {...register('title')}
            />
            <TextField
              label="Описание"
              fullWidth
              multiline
              minRows={4}
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
              {...register('description')}
            />
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
                  disabled={categoriesLoading || categories.length === 0}
                  error={Boolean(errors.category_id)}
                  helperText={
                    errors.category_id?.message ??
                    (categories.length === 0 && !categoriesLoading ? 'Нет доступных категорий' : undefined)
                  }
                >
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createTicket.isPending || categoriesLoading || categories.length === 0}
          >
            {createTicket.isPending ? 'Создание…' : 'Создать'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
