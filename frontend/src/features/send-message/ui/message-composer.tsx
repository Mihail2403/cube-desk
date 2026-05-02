import { zodResolver } from '@hookform/resolvers/zod';
import { AttachFile as AttachFileIcon, Send as SendIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { usePostMessage } from '@/entities/ticket-message/model/use-messages';
import { MAX_ATTACHMENT_BYTES, MAX_ATTACHMENT_FILES } from '@/shared/config/constants';
import { formatBytes } from '@/shared/lib/format-bytes';
import { applyApiValidationToForm, mapAxiosErrorToApiError } from '@/shared/api/error-mapper';

const schema = z.object({
  body: z.string().min(1, 'Введите текст').max(10000, 'Максимум 10000 символов'),
});

type FormValues = z.infer<typeof schema>;

interface MessageComposerProps {
  ticketId: number;
}

export const MessageComposer = ({ ticketId }: MessageComposerProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const postMessage = usePostMessage(ticketId);
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { body: '' },
  });

  const onFilesPicked = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles((prev) => {
      const next = [...prev, ...arr].slice(0, MAX_ATTACHMENT_FILES);
      return next;
    });
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = handleSubmit(async (values) => {
    for (const f of files) {
      if (f.size > MAX_ATTACHMENT_BYTES) {
        setError('root', {
          message: `Файл «${f.name}» больше ${formatBytes(MAX_ATTACHMENT_BYTES)}`,
        });
        return;
      }
    }
    const fd = new FormData();
    fd.append('body', values.body);
    for (const f of files) {
      fd.append('files', f);
    }
    try {
      await postMessage.mutateAsync(fd);
      enqueueSnackbar('Сообщение отправлено', { variant: 'success' });
      reset();
      setFiles([]);
    } catch (e) {
      const api = mapAxiosErrorToApiError(e);
      if (api.status === 422) {
        applyApiValidationToForm(api, setError);
      }
      if (api.status === 413) {
        const extra = api.extra as { max_bytes?: number; filename?: string } | undefined;
        setError('root', {
          message: extra?.filename
            ? `Файл слишком большой: ${extra.filename}`
            : api.message,
        });
        return;
      }
      setError('root', { message: api.message });
    }
  });

  return (
    <Box component="form" onSubmit={onSubmit}>
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Новое сообщение
        </Typography>
        {errors.root?.message && <Alert severity="error">{errors.root.message}</Alert>}
        <TextField
          label="Текст"
          fullWidth
          multiline
          minRows={3}
          error={Boolean(errors.body)}
          helperText={errors.body?.message}
          {...register('body')}
        />
        <Box
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragActive(false);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.length) onFilesPicked(e.dataTransfer.files);
          }}
          sx={{
            border: '2px dashed',
            borderColor: dragActive ? 'primary.main' : 'divider',
            borderRadius: 2,
            p: 2,
            textAlign: 'center',
            bgcolor: dragActive ? 'action.hover' : 'transparent',
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Перетащите файлы сюда или выберите с диска (до {MAX_ATTACHMENT_FILES} файлов, до{' '}
            {formatBytes(MAX_ATTACHMENT_BYTES)} каждый)
          </Typography>
          <Button component="label" variant="outlined" size="small" startIcon={<AttachFileIcon />}>
            Выбрать файлы
            <input
              type="file"
              hidden
              multiple
              onChange={(e) => {
                if (e.target.files?.length) onFilesPicked(e.target.files);
                e.target.value = '';
              }}
            />
          </Button>
        </Box>
        {files.length > 0 && (
          <List dense>
            {files.map((f, i) => (
              <ListItem
                key={`${f.name}-${i}`}
                secondaryAction={
                  <IconButton edge="end" onClick={() => removeFile(i)} aria-label="Удалить файл">
                    ×
                  </IconButton>
                }
              >
                <ListItemText primary={f.name} secondary={formatBytes(f.size)} />
              </ListItem>
            ))}
          </List>
        )}
        <Button
          type="submit"
          variant="contained"
          startIcon={<SendIcon />}
          disabled={postMessage.isPending}
        >
          {postMessage.isPending ? 'Отправка…' : 'Отправить'}
        </Button>
      </Stack>
    </Box>
  );
};
