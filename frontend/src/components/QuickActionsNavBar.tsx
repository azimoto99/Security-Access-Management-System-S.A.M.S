import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, useTheme, useMediaQuery } from '@mui/material';
import {
  Assessment,
  Search,
  Business,
  People,
  Security,
  Warning,
  Description,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export const QuickActionsNavBar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Get actions based on user role
  const getActions = () => {
    if (!user) return [];

    const actions: Array<{ icon: React.ReactElement; label: string; path: string }> = [];

    // Common actions for all roles
    if (user.role === 'guard' || user.role === 'admin') {
      actions.push(
        { icon: <Assessment />, label: t('dashboard.reports'), path: '/reports' },
        { icon: <Search />, label: t('dashboard.auditLogs'), path: '/audit-logs' }
      );
    }

    if (user.role === 'client') {
      actions.push(
        { icon: <Assessment />, label: t('dashboard.viewFullReports'), path: '/reports' },
        { icon: <Search />, label: t('dashboard.viewAuditLogs'), path: '/audit-logs' }
      );
    }

    // Role-specific actions
    if (user.role === 'admin') {
      actions.push(
        { icon: <Business />, label: t('dashboard.jobSites'), path: '/job-sites' },
        { icon: <People />, label: t('dashboard.users'), path: '/users' },
        { icon: <Security />, label: t('dashboard.watchlist'), path: '/watchlist' },
        { icon: <Warning />, label: t('dashboard.alerts'), path: '/alerts' },
        { icon: <Description />, label: t('dashboard.hrDocs'), path: '/hr/manage' }
      );
    }

    // HR Documents access - prioritize role hierarchy
    if (user.role === 'guard') {
      actions.push(
        { icon: <Description />, label: t('dashboard.hrDocs'), path: '/hr/documents' }
      );
    } else if (user.role === 'employee') {
      actions.push(
        { icon: <Description />, label: t('dashboard.myDocuments'), path: '/hr/documents' }
      );
    }

    if (user.role === 'guard' || user.role === 'admin') {
      actions.push(
        { icon: <Warning />, label: t('dashboard.emergency'), path: '/emergency' }
      );
    }

    return actions;
  };

  const actions = getActions();

  if (actions.length === 0) return null;

  return (
    <Box
      sx={{
        backgroundColor: '#1a1a1a',
        borderBottom: '1px solid #2a2a2a',
        px: { xs: 1, sm: 2 },
        py: { xs: 0.5, sm: 1 },
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        flexShrink: 0,
        '&::-webkit-scrollbar': {
          height: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#1a1a1a',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#2a2a2a',
          borderRadius: '2px',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: { xs: 1, sm: 1.5 },
          minWidth: 'max-content',
        }}
      >
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outlined"
            size={isMobile ? 'small' : 'medium'}
            startIcon={action.icon}
            onClick={() => navigate(action.path)}
            sx={{
              borderColor: '#444',
              color: '#fff',
              whiteSpace: 'nowrap',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.5, sm: 0.75 },
              minWidth: 'auto',
              '&:hover': {
                borderColor: '#ffd700',
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                color: '#ffd700',
              },
            }}
          >
            {action.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

