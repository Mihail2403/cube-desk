import { Box, CircularProgress, Divider, Paper, Stack, Typography } from '@mui/material';
import { Navigate, useParams } from 'react-router-dom';
import { useCurrentUser } from '@/entities/auth/model/use-current-user';
import { useTicket } from '@/entities/ticket/model/use-tickets';
import { MessageComposer } from '@/features/send-message/ui/message-composer';
import { TicketEditForm } from '@/features/ticket-edit/ui/ticket-edit-form';
import { mapAxiosErrorToApiError } from '@/shared/api/error-mapper';
import { formatDateTime } from '@/shared/lib/format-date';
import { StatusChip } from '@/shared/ui/status-chip';
import { MessageThread } from '@/widgets/message-thread/ui/message-thread';

export const TicketPage = () => {
  const { id } = useParams();
  const ticketId = Number(id);
  const { data: me } = useCurrentUser();
  const { data: ticket, isLoading, isError, error } = useTicket(ticketId);

  if (!id || !Number.isFinite(ticketId) || ticketId <= 0) {
    return <Navigate to="/tickets" replace />;
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    const api = mapAxiosErrorToApiError(error);
    if (api.status === 403 || api.status === 404) {
      return <Navigate to="/forbidden" replace />;
    }
    return <Navigate to="/tickets" replace />;
  }

  if (!ticket || !me) {
    return null;
  }

  const isStaff = me.role === 'SUPPORT' || me.role === 'ADMIN';
  const isAuthor = ticket.author_id === me.id;
  const canEdit = isAuthor || isStaff;
  const canChangeStatus = canEdit;

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" useFlexGap>
            <Typography variant="h4" fontWeight={700} component="h1">
              #{ticket.id} {ticket.title}
            </Typography>
            <StatusChip status={ticket.status} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Создан: {formatDateTime(ticket.created_at)} · Обновлён: {formatDateTime(ticket.updated_at)} · Автор
            ID: {ticket.author_id}
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
            {ticket.description || '—'}
          </Typography>
        </Stack>
      </Paper>
      {canEdit && (
        <Paper sx={{ p: 3 }}>
          <TicketEditForm ticket={ticket} canChangeStatus={canChangeStatus} />
        </Paper>
      )}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Переписка
        </Typography>
        <MessageThread ticketId={ticket.id} currentUserId={me.id} />
        <Divider sx={{ my: 3 }} />
        <MessageComposer ticketId={ticket.id} />
      </Paper>
    </Stack>
  );
};
