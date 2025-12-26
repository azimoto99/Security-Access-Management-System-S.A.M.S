import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
} from '@mui/material';
import {
  PersonAdd,
  Business,
  Assessment,
  Security,
  Warning,
  Description,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export const QuickActionsPanel: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const actions = [
    { icon: <PersonAdd />, label: t('adminDashboard.users'), path: '/users?action=create' },
    { icon: <Business />, label: t('adminDashboard.jobSites'), path: '/job-sites?action=create' },
    { icon: <Assessment />, label: t('adminDashboard.generateReport'), path: '/reports' },
    { icon: <Warning />, label: t('adminDashboard.viewAllAlerts'), path: '/alerts' },
    { icon: <Security />, label: t('adminDashboard.manageWatchlist'), path: '/watchlist' },
    { icon: <Description />, label: t('adminDashboard.hrDocs'), path: '/hr/manage' },
  ];

  return (
    <Card sx={{ backgroundColor: '#1a1a1a' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          {t('adminDashboard.quickActions')}
        </Typography>
        <Grid container spacing={1.5}>
          {actions.map((action, index) => (
            <Grid item xs={6} key={index}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={action.icon}
                onClick={() => navigate(action.path)}
                sx={{
                  py: 1.5,
                  justifyContent: 'flex-start',
                  borderColor: '#444',
                  color: '#fff',
                  '&:hover': {
                    borderColor: '#666',
                    backgroundColor: '#2a2a2a',
                  },
                }}
              >
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

