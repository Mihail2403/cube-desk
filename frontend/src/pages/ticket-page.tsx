import { Close as CloseIcon, Edit as EditIcon } from '@mui/icons-material';
import { Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
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
  const [editOpen, setEditOpen] = useState(false);

  if (!id || !Number.isFinite(ticketId) || ticketId <= 0) {
    return <Navigate to="/tickets" replace />;
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
        }}
      >
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
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gap: 2,
          alignContent: 'stretch',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(260px, 400px) minmax(0, 1fr)' },
          gridTemplateRows: {
            xs: 'auto minmax(220px, 1fr) auto',
            md: 'auto minmax(0, 1fr)',
          },
          gridTemplateAreas: {
            xs: `
              "ticket"
              "chat"
              "compose"
            `,
            md: `
              "side chat"
              "compose chat"
            `,
          },
        }}
      >
        <Paper
          sx={{
            gridArea: { xs: 'ticket', md: 'side' },
            p: 3,
            alignSelf: 'start',
            width: '100%',
            overflow: 'auto',
            maxHeight: { md: 'min(55vh, 100%)' },
          }}
        >
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" useFlexGap>
                <Typography variant="h5" fontWeight={700} component="h1">
                  #{ticket.id} {ticket.title}
                </Typography>
                <StatusChip status={ticket.status} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Создан: {formatDateTime(ticket.created_at)} · Обновлён: {formatDateTime(ticket.updated_at)} · Автор ID:{' '}
                {ticket.author_id}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                {ticket.description || '—'}
              </Typography>
            </Stack>
            {canEdit && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => setEditOpen(true)}
                sx={{ flexShrink: 0 }}
              >
                Редактировать
              </Button>
            )}
          </Stack>
        </Paper>

        <Paper
          sx={{
            gridArea: 'chat',
            minHeight: 0,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            p: 3,
            pt: 2,
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ flexShrink: 0 }}>
            Переписка
          </Typography>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
              overscrollBehavior: 'contain',
            }}
          >
            <MessageThread ticketId={ticket.id} currentUserId={me.id} />
          </Box>
        </Paper>

        <Paper
          sx={{
            gridArea: 'compose',
            p: 3,
            alignSelf: 'stretch',
          }}
        >
          <MessageComposer ticketId={ticket.id} />
        </Paper>
      </Box>

      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            pr: 1,
          }}
        >
          Редактирование тикета
          <IconButton aria-label="Закрыть" onClick={() => setEditOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TicketEditForm
            ticket={ticket}
            canChangeStatus={canChangeStatus}
            showHeading={false}
            onSaved={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};
