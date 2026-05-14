import { DarkMode, LightMode, Logout as LogoutIcon, Menu as MenuIcon } from '@mui/icons-material';
import {
  AppBar,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useLogout } from '@/features/auth-logout/model/use-logout';
import { useCurrentUser } from '@/entities/auth/model/use-current-user';
import { useThemeMode } from '@/shared/hooks/use-theme-mode';

export const AppHeader = () => {
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const { mode, toggleMode } = useThemeMode();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const roleLabel = user?.role
    ? user.role === 'USER'
      ? 'Пользователь'
      : user.role === 'SUPPORT'
        ? 'Поддержка'
        : 'Админ'
    : '';

  return (
    <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/tickets"
          sx={{
            fontWeight: 700,
            textDecoration: 'none',
            color: 'text.primary',
            mr: 3,
          }}
        >
          Cube Desk
        </Typography>
        <Box component={RouterLink} to="/tickets" sx={{ mr: 2, color: 'text.secondary', textDecoration: 'none' }}>
          Тикеты
        </Box>
        {user?.role === 'ADMIN' && (
          <Box component={RouterLink} to="/admin" sx={{ mr: 2, color: 'text.secondary', textDecoration: 'none' }}>
            Админ
          </Box>
        )}
        <Box sx={{ flexGrow: 1 }} />
        {user?.role && (
          <Chip size="small" label={roleLabel} color="primary" variant="outlined" sx={{ mr: 1 }} />
        )}
        <IconButton onClick={toggleMode} aria-label="Тема" color="inherit">
          {mode === 'dark' ? <LightMode /> : <DarkMode />}
        </IconButton>
        <IconButton onClick={(e) => setAnchor(e.currentTarget)} color="inherit" aria-label="Меню">
          <MenuIcon />
        </IconButton>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          <MenuItem disabled>
            <Typography variant="body2">{user?.login}</Typography>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchor(null);
              logout.mutate();
            }}
          >
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
            Выйти
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
