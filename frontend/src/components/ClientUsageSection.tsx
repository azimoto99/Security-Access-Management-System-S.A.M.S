import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Skeleton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Cancel,
} from '@mui/icons-material';
import type { ClientUsage } from '../services/adminDashboardService';

interface ClientUsageSectionProps {
  clients: ClientUsage[];
  loading: boolean;
  onClientClick: (clientId: string) => void;
}

const getActivityIcon = (level: string) => {
  switch (level) {
    case 'active':
      return <CheckCircle sx={{ color: '#4caf50', fontSize: 'small' }} />;
    case 'moderate':
      return <Warning sx={{ color: '#ff9800', fontSize: 'small' }} />;
    case 'inactive':
      return <Cancel sx={{ color: '#9e9e9e', fontSize: 'small' }} />;
    default:
      return null;
  }
};

const formatLastLogin = (dateString: string | null): string => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

export const ClientUsageSection: React.FC<ClientUsageSectionProps> = ({
  clients,
  loading,
  onClientClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (loading) {
    return (
      <Card sx={{ backgroundColor: '#1a1a1a' }}>
        <CardContent>
          <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '8px' }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ backgroundColor: '#1a1a1a' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Client Portal Usage
        </Typography>

        {clients.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No clients found
            </Typography>
          </Box>
        ) : isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {clients.map((client) => (
              <Card
                key={client.id}
                onClick={() => onClientClick(client.id)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: '#2a2a2a',
                  '&:hover': { backgroundColor: '#333' },
                }}
              >
                <CardContent>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                    {client.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {getActivityIcon(client.activityLevel)}
                    <Chip
                      label={client.activityLevel}
                      size="small"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: '#b0b0b0', display: 'block' }}>
                    {client.siteCount} site(s) • {client.todayEntries} entries today
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>
                    Last login: {formatLastLogin(client.lastLogin)}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Client</TableCell>
                  <TableCell align="right">Sites</TableCell>
                  <TableCell align="right">Today</TableCell>
                  <TableCell>Activity</TableCell>
                  <TableCell>Last Login</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.map((client) => (
                  <TableRow
                    key={client.id}
                    onClick={() => onClientClick(client.id)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#2a2a2a' },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {client.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{client.siteCount}</TableCell>
                    <TableCell align="right">{client.todayEntries}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {getActivityIcon(client.activityLevel)}
                        <Chip
                          label={client.activityLevel}
                          size="small"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#888' }}>
                        {formatLastLogin(client.lastLogin)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
};

