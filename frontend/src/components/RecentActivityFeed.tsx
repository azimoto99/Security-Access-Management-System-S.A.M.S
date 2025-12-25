import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from '@mui/material';
import {
  DirectionsCar,
  Person,
  LocalShipping,
  Warning,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { RecentActivity } from '../services/adminDashboardService';
import { photoService } from '../services/photoService';
import { adminDashboardService } from '../services/adminDashboardService';

interface RecentActivityFeedProps {
  activities: RecentActivity[];
  loading: boolean;
  onActivityClick: (entryId: string) => void;
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

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities: initialActivities,
  loading: initialLoading,
  onActivityClick,
}) => {
  const navigate = useNavigate();
  const [allActivities, setAllActivities] = useState<RecentActivity[]>(initialActivities);
  const [loading, setLoading] = useState(initialLoading);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(initialActivities.length);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update activities when initial data changes
  useEffect(() => {
    setAllActivities(initialActivities);
    setOffset(initialActivities.length);
    setHasMore(initialActivities.length > 0);
  }, [initialActivities]);

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
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, loadMore]);

  if (loading) {
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
    <Card sx={{ backgroundColor: '#1a1a1a', maxHeight: 600, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Recent Activity
        </Typography>
        <Box 
          ref={scrollContainerRef}
          sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}
        >
          {allActivities.length === 0 && !loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No recent activity
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {allActivities.map((activity) => {
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
                              label="ALERT"
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
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            {getEntryIcon(activity.entryType)}
                            <Typography variant="caption" sx={{ color: '#888' }}>
                              {formatTimeAgo(activity.entryTime)} • {isExited ? 'Exited' : 'Entered'}
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
                No more activities to load
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button variant="outlined" size="small" onClick={() => navigate('/search')}>
            View All Logs
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

