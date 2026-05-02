import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export const NotFoundPage = () => (
  <Stack
    flex={1}
    minHeight={0}
    width="100%"
    overflow="auto"
    alignItems="center"
    justifyContent="center"
    spacing={2}
  >
    <Typography variant="h5">Страница не найдена</Typography>
    <Button component={RouterLink} to="/tickets">
      На главную
    </Button>
  </Stack>
);
