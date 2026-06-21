import {
  Box,
  CircularProgress,
  Divider,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useSimilarSolutions } from '@/entities/ticket/model/use-tickets';
import type { SimilarSolutionResponse } from '@/shared/types/api';
import { preWrapBreakSx } from '@/shared/ui/text-sx';

export interface SimilarSolutionsCardProps {
  ticketId: number;
  enabled: boolean;
}

export const SimilarSolutionsCard = ({ ticketId, enabled }: SimilarSolutionsCardProps) => {
  const { data, isLoading, isError, error } = useSimilarSolutions({ ticketId, enabled });
  const results: SimilarSolutionResponse[] = data ?? [];

  if (!enabled) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, width: '100%', overflow: 'auto', maxHeight: { md: 'min(40vh, 480px)' } }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Похожие решения
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Подсказки из закрытых тикетов с заполненным решением (семантический поиск).
      </Typography>
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {isError && (
        <Typography variant="body2" color="error">
          {error instanceof Error ? error.message : 'Не удалось загрузить подсказки'}
        </Typography>
      )}
      {!isLoading && !isError && results.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Похожих решений пока нет. Закройте другие тикеты с полем «Решение», чтобы они попали в базу
          подсказок.
        </Typography>
      )}
      {!isLoading && !isError && results.length > 0 && results.map((item: SimilarSolutionResponse, idx: number) => (
        <Box key={item.ticket_id}>
          {idx > 0 && <Divider sx={{ my: 2 }} />}
          <Stack spacing={0.75}>
            <MuiLink
              component={RouterLink}
              to={`/tickets/${item.ticket_id}`}
              variant="subtitle1"
              fontWeight={700}
              underline="hover"
              title={`#${item.ticket_id} ${item.title}`}
              sx={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
            >
              #{item.ticket_id} {item.title}
            </MuiLink>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
            >
              Категория: {item.category || '—'}
            </Typography>
            <Typography variant="body2" sx={preWrapBreakSx}>
              {item.resolution || '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Сходство: {((item.score ?? 0) * 100).toFixed(0)}%
            </Typography>
          </Stack>
        </Box>
      ))}
    </Paper>
  );
};
