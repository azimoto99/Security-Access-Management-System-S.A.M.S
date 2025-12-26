import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  DirectionsCar,
  Warning,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { SiteStatus } from '../services/adminDashboardService';

interface SiteStatusGridProps {
  sites: SiteStatus[];
  loading: boolean;
  onSiteClick: (siteId: string) => void;
}

const getStatusColor = (status: SiteStatus['status']) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'moderate':
      return 'warning';
    case 'quiet':
      return 'default';
    case 'alert':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: SiteStatus['status'], t: any): string => {
  switch (status) {
    case 'active':
      return t('adminDashboard.active').toUpperCase();
    case 'moderate':
      return t('adminDashboard.moderate').toUpperCase();
    case 'quiet':
      return t('adminDashboard.quiet').toUpperCase();
    case 'alert':
      return t('adminDashboard.alert').toUpperCase();
    default:
      return t('adminDashboard.unknown').toUpperCase();
  }
};

const formatTimeAgo = (dateString: string | null, t: any): string => {
  if (!dateString) return t('adminDashboard.noEntries');
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return t('adminDashboard.justNow');
  if (diffMins < 60) return t('adminDashboard.minAgo', { count: diffMins });
  const hours = Math.floor(diffMins / 60);
  if (hours < 24) return t('adminDashboard.hoursAgo', { hours });
  const days = Math.floor(hours / 24);
  return t('adminDashboard.daysAgo', { days });
};

export const SiteStatusGrid: React.FC<SiteStatusGridProps> = ({
  sites,
  loading,
  onSiteClick,
}) => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<'activity' | 'name' | 'alert'>('activity');

  const sortedSites = [...sites].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'alert':
        if (a.hasAlerts && !b.hasAlerts) return -1;
        if (!a.hasAlerts && b.hasAlerts) return 1;
        return 0;
      case 'activity':
      default:
        // Sort by status priority: alert > active > moderate > quiet
        const statusOrder: Record<SiteStatus['status'], number> = {
          alert: 0,
          active: 1,
          moderate: 2,
          quiet: 3,
        };
        return statusOrder[a.status] - statusOrder[b.status];
    }
  });

  if (loading) {
    return (
      <Card sx={{ backgroundColor: '#1a1a1a' }}>
        <CardContent>
          <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={150} sx={{ borderRadius: '8px' }} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ backgroundColor: '#1a1a1a' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {t('adminDashboard.siteStatusOverview')}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('adminDashboard.sortBy')}</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'activity' | 'name' | 'alert')}
              label={t('adminDashboard.sortBy')}
            >
              <MenuItem value="activity">{t('adminDashboard.activity')}</MenuItem>
              <MenuItem value="name">{t('adminDashboard.name')}</MenuItem>
              <MenuItem value="alert">{t('adminDashboard.alertStatus')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {sortedSites.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              {t('adminDashboard.noSitesFound')}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {sortedSites.map((site) => (
              <Grid item xs={12} sm={6} md={4} key={site.id}>
                <Card
                  onClick={() => onSiteClick(site.id)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: '#2a2a2a',
                    border: `1px solid ${site.hasAlerts ? '#f44336' : '#444'}`,
                    '&:hover': {
                      borderColor: site.hasAlerts ? '#f44336' : '#666',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
                        {site.name}
                      </Typography>
                      <Chip
                        label={getStatusLabel(site.status, t)}
                        color={getStatusColor(site.status)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    {site.clientName && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {t('adminDashboard.client')}: {site.clientName}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <DirectionsCar fontSize="small" sx={{ color: '#b0b0b0' }} />
                        <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                          {site.currentOccupancy} {t('adminDashboard.onSite')}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                        {site.todayEntries} {t('adminDashboard.entriesToday')}
                      </Typography>
                      {site.hasAlerts && (
                        <Chip
                          icon={<Warning />}
                          label={t('adminDashboard.alert')}
                          size="small"
                          color="error"
                          sx={{ height: 20 }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: '#888', mt: 1, display: 'block' }}>
                      {t('adminDashboard.lastEntry')}: {formatTimeAgo(site.lastEntryTime, t)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

