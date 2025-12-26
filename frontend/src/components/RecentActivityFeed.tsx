import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Skeleton,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  DirectionsCar,
  Person,
  LocalShipping,
  Warning,
  Search,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { RecentActivity } from '../services/adminDashboardService';
import { photoService } from '../services/photoService';
import { adminDashboardService } from '../services/adminDashboardService';

interface RecentActivityFeedProps {
  activities: RecentActivity[];
  loading: boolean;
  onActivityClick: (entryId: string) => void;
  initialHasMore?: boolean;
}

const getEntryIcon = (entryType: string) => {
  switch (entryType) {
    case 'vehicle':
      return <DirectionsCar fontSize="small" />;
    case 'visitor':
      return <Person fontSize="small" />;
    case 'truck':
      return <LocalShipping fontSize="small" />;
    default:
      return null;
  }
};

const formatTimeAgo = (dateString: string, t: any): string => {
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

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities: initialActivities,
  loading: initialLoading,
  onActivityClick,
  initialHasMore = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [allActivities, setAllActivities] = useState<RecentActivity[]>(initialActivities);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore || initialActivities.length >= 20);
  const [offset, setOffset] = useState(initialActivities.length);
  const [searchTerm, setSearchTerm] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter activities based on search term
  const filteredActivities = useMemo(() => {
    if (!searchTerm.trim()) {
      return allActivities;
    }

    const search = searchTerm.toLowerCase();
    return allActivities.filter((activity) => {
      const identifier = activity.identifier?.toLowerCase() || '';
      const company = activity.company?.toLowerCase() || '';
      const siteName = activity.siteName?.toLowerCase() || '';
      const entryType = activity.entryType?.toLowerCase() || '';
      const driverName = activity.driverName?.toLowerCase() || '';
      const truckNumber = activity.truckNumber?.toLowerCase() || '';
      const trailerNumber = activity.trailerNumber?.toLowerCase() || '';
      const exitTrailerNumber = activity.exitTrailerNumber?.toLowerCase() || '';
      
      return (
        identifier.includes(search) ||
        company.includes(search) ||
        siteName.includes(search) ||
        entryType.includes(search) ||
        driverName.includes(search) ||
        truckNumber.includes(search) ||
        trailerNumber.includes(search) ||
        exitTrailerNumber.includes(search)
      );
    });
  }, [allActivities, searchTerm]);

  // Update activities when initial data changes
  useEffect(() => {
    setAllActivities(initialActivities);
    setOffset(initialActivities.length);
    // Use initialHasMore if provided, otherwise assume more if we got a full page
    setHasMore(initialHasMore !== undefined ? initialHasMore : initialActivities.length >= 20);
  }, [initialActivities, initialHasMore]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const result = await adminDashboardService.getRecentActivity(20, offset);
      setAllActivities((prev) => [...prev, ...result.activities]);
      setHasMore(result.hasMore);
      setOffset((prev) => prev + result.activities.length);
    } catch (error) {
      console.error('Failed to load more activities:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [offset, loadingMore, hasMore]);

  // Handle scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Load more when user is within 100px of the bottom
      if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !loadingMore) {
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    
    // Check if we need to load more immediately (if content doesn't fill container)
    // Use setTimeout to ensure DOM has updated
    const checkInitialLoad = setTimeout(() => {
      const { scrollHeight, clientHeight } = container;
      if (scrollHeight <= clientHeight && hasMore && !loadingMore && allActivities.length > 0) {
        loadMore();
      }
    }, 100);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(checkInitialLoad);
    };
  }, [hasMore, loadingMore, loadMore, allActivities.length]);

  if (initialLoading) {
    return (
      <Card sx={{ backgroundColor: '#1a1a1a' }}>
        <CardContent>
          <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1, borderRadius: '4px' }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ backgroundColor: '#1a1a1a', height: '100%', maxHeight: 600, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2, minHeight: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          {t('adminDashboard.recentActivity')}
        </Typography>
        
        {/* Search Bar */}
        <TextField
          placeholder={t('adminDashboard.searchActivities')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          fullWidth
          sx={{ mb: 2, flexShrink: 0 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        
        <Box 
          ref={scrollContainerRef}
          sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0, maxHeight: '100%' }}
        >
          {allActivities.length === 0 && !initialLoading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                {t('adminDashboard.noRecentActivity')}
              </Typography>
            </Box>
          ) : filteredActivities.length === 0 && searchTerm ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                {t('adminDashboard.noActivitiesMatch')}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredActivities.map((activity) => {
                const photoId = activity.photos && activity.photos.length > 0 ? activity.photos[0] : null;
                const isExited = !!activity.exitTime;

                return (
                  <ListItem
                    key={activity.id}
                    onClick={() => onActivityClick(activity.id)}
                    sx={{
                      cursor: 'pointer',
                      mb: 1,
                      borderRadius: '8px',
                      backgroundColor: activity.hasAlert ? '#f4433610' : '#2a2a2a',
                      border: activity.hasAlert ? '1px solid #f44336' : '1px solid transparent',
                      '&:hover': {
                        backgroundColor: activity.hasAlert ? '#f4433620' : '#333',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={photoId ? photoService.getPhotoUrl(photoId, true) : undefined}
                        variant="rounded"
                        sx={{ width: 40, height: 40, bgcolor: '#444' }}
                      >
                        {photoId ? null : getEntryIcon(activity.entryType)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {activity.identifier}
                            {activity.company && ` (${activity.company})`}
                          </Typography>
                          {activity.hasAlert && (
                            <Chip
                              icon={<Warning />}
                              label={t('adminDashboard.alert').toUpperCase()}
                              size="small"
                              color="error"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" sx={{ color: '#b0b0b0', display: 'block' }}>
                            {activity.siteName}
                          </Typography>
                          {activity.driverName && (
                            <Typography variant="caption" sx={{ color: '#b0b0b0', display: 'block', mt: 0.5 }}>
                              {t('adminDashboard.driver')}: {activity.driverName}
                            </Typography>
                          )}
                          {(activity.truckNumber || activity.trailerNumber) && (
                            <Typography variant="caption" sx={{ color: '#b0b0b0', display: 'block', mt: 0.5 }}>
                              {activity.truckNumber && `${t('adminDashboard.truck')}: ${activity.truckNumber}`}
                              {activity.truckNumber && activity.trailerNumber && ' • '}
                              {activity.trailerNumber && `${t('adminDashboard.trailer')}: ${activity.trailerNumber}`}
                              {isExited && activity.exitTrailerNumber && activity.exitTrailerNumber !== activity.trailerNumber && (
                                <span> → {t('adminDashboard.exitTrailer')}: {activity.exitTrailerNumber}</span>
                              )}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            {getEntryIcon(activity.entryType)}
                            <Typography variant="caption" sx={{ color: '#888' }}>
                              {formatTimeAgo(activity.entryTime, t)} • {isExited ? t('adminDashboard.exited') : t('adminDashboard.entered')}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
          {loadingMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!hasMore && allActivities.length > 0 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {t('common.noData')}
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button variant="outlined" size="small" onClick={() => navigate('/search')}>
            {t('adminDashboard.viewAllLogs')}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

