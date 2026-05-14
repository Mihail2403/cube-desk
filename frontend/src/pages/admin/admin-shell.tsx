import { Tab, Tabs } from '@mui/material';
import { useMemo } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';

const tabPath = (index: number) => {
  if (index === 0) return '/admin';
  if (index === 1) return '/admin/users';
  return '/admin/ticket-categories';
};

export const AdminShell = () => {
  const location = useLocation();
  const tab = useMemo(() => {
    if (location.pathname.startsWith('/admin/users')) return 1;
    if (location.pathname.startsWith('/admin/ticket-categories')) return 2;
    return 0;
  }, [location.pathname]);

  return (
    <>
      <Tabs
        value={tab}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        aria-label="Разделы админ-панели"
      >
        <Tab label="Обзор" component={RouterLink} to={tabPath(0)} />
        <Tab label="Пользователи" component={RouterLink} to={tabPath(1)} />
        <Tab label="Категории тикетов" component={RouterLink} to={tabPath(2)} />
      </Tabs>
      <Outlet />
    </>
  );
};
