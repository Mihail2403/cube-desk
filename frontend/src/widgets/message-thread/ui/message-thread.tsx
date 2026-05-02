import { AttachFile as AttachFileIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { Box, Button, CircularProgress, Link, Paper, Stack, Typography } from '@mui/material';
import { useTicketMessages } from '@/entities/ticket-message/model/use-messages';
import { DEFAULT_MESSAGES_LIMIT } from '@/shared/config/constants';
import { formatBytes } from '@/shared/lib/format-bytes';
import { formatDateTime } from '@/shared/lib/format-date';
import { rewritePresignedUrlForBrowser } from '@/shared/lib/rewrite-presigned-url-for-browser';
import type { TicketMessageAttachmentResponse, TicketMessageResponse } from '@/shared/types/api';

interface MessageThreadProps {
  ticketId: number;
  currentUserId: number;
}

const AttachmentLink = ({ a }: { a: TicketMessageAttachmentResponse }) => (
  <Link
    href={rewritePresignedUrlForBrowser(a.download_url)}
    download={a.filename}
    target="_blank"
    rel="noopener noreferrer"
    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mr: 2 }}
  >
    <AttachFileIcon fontSize="inherit" />
    {a.filename} ({formatBytes(a.size)})
  </Link>
);

const MessageBubble = ({
  message,
  isOwn,
}: {
  message: TicketMessageResponse;
  isOwn: boolean;
}) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      mb: 2,
    }}
  >
    <Paper
      elevation={0}
      sx={{
        maxWidth: '85%',
        p: 2,
        bgcolor: isOwn ? 'primary.dark' : 'action.hover',
        color: isOwn ? 'primary.contrastText' : 'text.primary',
        borderRadius: 2,
      }}
    >
      <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', mb: 0.5 }}>
        {formatDateTime(message.created_at)}
      </Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {message.body}
      </Typography>
      {message.attachments?.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
          {message.attachments.map((a) => (
            <AttachmentLink key={a.id} a={a} />
          ))}
        </Stack>
      )}
    </Paper>
  </Box>
);

export const MessageThread = ({ ticketId, currentUserId }: MessageThreadProps) => {
  const { data: messages = [], isLoading, isFetching, refetch } = useTicketMessages(
    ticketId,
    {
      limit: DEFAULT_MESSAGES_LIMIT,
      offset: 0,
    },
    { refetchInterval: 30_000 },
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Box display="flex" justifyContent="flex-end">
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          Обновить (presigned-ссылки живут ~10 мин)
        </Button>
      </Box>
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} isOwn={m.author_id === currentUserId} />
      ))}
    </Stack>
  );
};
