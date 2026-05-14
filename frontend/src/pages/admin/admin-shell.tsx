import { Tab, Tabs } from '@mui/material';
import { useMemo } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';

const tabPath = (index: number) => (index === 0 ? '/admin' : '/admin/users');

export const AdminShell = () => {
  const location = useLocation();
  const tab = useMemo(() => (location.pathname.startsWith('/admin/users') ? 1 : 0), [location.pathname]);

  return (
    <>
      <Tabs
        value={tab}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        aria-label="Разделы админ-панели"
      >
        <Tab label="Обзор" component={RouterLink} to={tabPath(0)} />
        <Tab label="Пользователи" component={RouterLink} to={tabPath(1)} />
      </Tabs>
      <Outlet />
    </>
  );
};
