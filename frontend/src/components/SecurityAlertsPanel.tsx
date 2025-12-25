import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Skeleton,
  Badge,
} from '@mui/material';
import {
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import type { ActiveAlert } from '../services/adminDashboardService';

interface SecurityAlertsPanelProps {
  alerts: ActiveAlert[];
  loading: boolean;
  onAlertClick: (alertId: string) => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'default';
  }
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const hours = Math.floor(diffMins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const SecurityAlertsPanel: React.FC<SecurityAlertsPanelProps> = ({
  alerts,
  loading,
  onAlertClick,
}) => {
  if (loading) {
    return (
      <Card sx={{ backgroundColor: '#1a1a1a' }}>
        <CardContent>
          <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 1, borderRadius: '4px' }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ backgroundColor: '#1a1a1a' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Badge badgeContent={alerts.length} color="error">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Active Alerts
            </Typography>
          </Badge>
        </Box>

        {alerts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 48, color: '#4caf50', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No active alerts - all clear! ✅
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 400, overflowY: 'auto' }}>
            {alerts.map((alert) => (
              <ListItem
                key={alert.id}
                onClick={() => onAlertClick(alert.id)}
                sx={{
                  cursor: 'pointer',
                  mb: 1,
                  borderRadius: '8px',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #f44336',
                  '&:hover': {
                    backgroundColor: '#f4433610',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Warning sx={{ color: '#f44336', fontSize: 'small' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {alert.type.replace(/_/g, ' ').toUpperCase()}
                      </Typography>
                      <Chip
                        label={alert.priority}
                        size="small"
                        color={getPriorityColor(alert.priority)}
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" sx={{ color: '#b0b0b0', display: 'block' }}>
                        {alert.siteName}
                      </Typography>
                      {alert.identifier && (
                        <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
                          {alert.identifier}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ color: '#888', display: 'block', mt: 0.5 }}>
                        {formatTimeAgo(alert.createdAt)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

