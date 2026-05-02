import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useCreateTicket } from '@/entities/ticket/model/use-tickets';
import { applyApiValidationToForm, mapAxiosErrorToApiError } from '@/shared/api/error-mapper';

const schema = z.object({
  title: z.string().min(1, 'Укажите заголовок').max(256, 'Максимум 256 символов'),
  description: z
    .string()
    .max(10000, 'Максимум 10000 символов')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

type FormValues = z.infer<typeof schema>;

interface TicketCreateDialogProps {
  open: boolean;
  onClose: () => void;
}

export const TicketCreateDialog = ({ open, onClose }: TicketCreateDialogProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const createTicket = useCreateTicket();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createTicket.mutateAsync({
        title: values.title,
        description: values.description ?? null,
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="contained" disabled={createTicket.isPending}>
            {createTicket.isPending ? 'Создание…' : 'Создать'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
