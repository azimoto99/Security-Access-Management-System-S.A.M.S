import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
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
  Settings,
  Warning,
} from '@mui/icons-material';

export const QuickActionsPanel: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    { icon: <PersonAdd />, label: 'Add New User', path: '/users?action=create' },
    { icon: <Business />, label: 'Create New Site', path: '/job-sites?action=create' },
    { icon: <Assessment />, label: 'Generate Report', path: '/reports' },
    { icon: <Warning />, label: 'View All Alerts', path: '/alerts' },
    { icon: <Security />, label: 'Manage Watchlist', path: '/watchlist' },
    { icon: <Settings />, label: 'System Settings', path: '/settings' },
  ];

  return (
    <Card sx={{ backgroundColor: '#1a1a1a' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Quick Actions
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

