import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, maxWidth: 480, mx: 'auto', mt: 8 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Ошибка интерфейса
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {this.state.message ?? 'Неожиданная ошибка'}
            </Typography>
          </Alert>
          <Button variant="outlined" onClick={() => window.location.assign('/')}>
            На главную
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
