import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  useMediaQuery,
  useTheme,
  CircularProgress,
  TextField,
  InputAdornment,
  Modal,
  IconButton,
} from '@mui/material';
import {
  DirectionsCar,
  Person,
  LocalShipping,
  Image as ImageIcon,
  Search,
  ZoomIn,
  Close,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { RecentEntry } from '../services/dashboardService';
import { photoService } from '../services/photoService';
import { dashboardService } from '../services/dashboardService';

interface RecentActivityListProps {
  entries: RecentEntry[];
  siteId?: string;
  onViewAll?: () => void;
  onEntryClick?: (entryId: string) => void;
}

const getEntryTypeIcon = (entryType: string) => {
  switch (entryType) {
    case 'vehicle':
      return <DirectionsCar fontSize="small" />;
    case 'truck':
      return <LocalShipping fontSize="small" />;
    case 'visitor':
      return <Person fontSize="small" />;
    default:
      return <Person fontSize="small" />;
  }
};

const formatRelativeTime = (dateString: string, t: any): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return t('common.justNow');
  } else if (diffMins < 60) {
    return t('common.minutesAgo', { count: diffMins });
  } else if (diffHours < 24) {
    return t('common.hoursAgo', { count: diffHours });
  } else if (diffDays < 7) {
    return t('common.daysAgo', { count: diffDays });
  } else {
    return date.toLocaleDateString();
  }
};

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  entries: initialEntries,
  siteId,
  onViewAll,
  onEntryClick,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expandedImageIndex, setExpandedImageIndex] = useState<{ entryId: string; index: number } | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [allEntries, setAllEntries] = useState<RecentEntry[]>(initialEntries);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(initialEntries.length);
  const [searchTerm, setSearchTerm] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter entries based on search term
  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) {
      return allEntries;
    }

    const search = searchTerm.toLowerCase();
    return allEntries.filter((entry) => {
      const identifier = entry.identifier?.toLowerCase() || '';
      const companyName = entry.companyName?.toLowerCase() || '';
      const entryType = entry.entryType?.toLowerCase() || '';
      const driverName = entry.driverName?.toLowerCase() || '';
      const truckNumber = entry.truckNumber?.toLowerCase() || '';
      const trailerNumber = entry.trailerNumber?.toLowerCase() || '';
      const exitTrailerNumber = entry.exitTrailerNumber?.toLowerCase() || '';
      
      return (
        identifier.includes(search) ||
        companyName.includes(search) ||
        entryType.includes(search) ||
        driverName.includes(search) ||
        truckNumber.includes(search) ||
        trailerNumber.includes(search) ||
        exitTrailerNumber.includes(search)
      );
    });
  }, [allEntries, searchTerm]);

  // Update entries when initial data changes
  useEffect(() => {
    setAllEntries(initialEntries);
    setOffset(initialEntries.length);
    setHasMore(initialEntries.length > 0);
  }, [initialEntries]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !siteId) return;

    try {
      setLoadingMore(true);
      const result = await dashboardService.getRecentEntries(siteId, 20, offset);
      setAllEntries((prev) => [...prev, ...result.entries]);
      setHasMore(result.hasMore);
      setOffset((prev) => prev + result.entries.length);
    } catch (error) {
      console.error('Failed to load more entries:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [offset, loadingMore, hasMore, siteId]);

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

  const handleEntryClick = (entryId: string) => {
    if (onEntryClick) {
      onEntryClick(entryId);
    } else {
      navigate(`/search?entry_id=${entryId}`);
    }
  };

  const handleImageClick = (e: React.MouseEvent, entryId: string, index: number) => {
    e.stopPropagation();
    if (expandedImageIndex?.entryId === entryId && expandedImageIndex?.index === index) {
      setExpandedImageIndex(null);
    } else {
      setExpandedImageIndex({ entryId, index });
    }
  };

  // Find the entry with expanded image
  const expandedEntry = expandedImageIndex
    ? allEntries.find((e) => e.id === expandedImageIndex.entryId)
    : null;

  // Image Expansion Modal Component
  const ImageExpansionModal = () => (
    <Modal
      open={!!expandedImageIndex && !!expandedEntry}
      onClose={() => setExpandedImageIndex(null)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          outline: 'none',
        }}
        onClick={() => setExpandedImageIndex(null)}
      >
        {expandedEntry && expandedImageIndex && (
          <>
            <IconButton
              onClick={() => setExpandedImageIndex(null)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: '#ffffff',
                zIndex: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                },
              }}
            >
              <Close />
            </IconButton>
            <Box
              component="img"
              src={photoService.getPhotoUrl(expandedEntry.photoUrl!, true)}
              alt="Expanded photo"
              sx={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                display: 'block',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </>
        )}
      </Box>
    </Modal>
  );

  if (allEntries.length === 0) {
    return (
      <>
        <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: '#b0b0b0' }}>
              {t('recentActivity.noRecentActivity')}
            </Typography>
          </CardContent>
        </Card>
        <ImageExpansionModal />
      </>
    );
  }

  if (isMobile) {
    // Mobile: Card layout
    return (
      <>
        <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: '0.875rem' }}>
            {t('recentActivity.recentActivity')}
          </Typography>
          
          {/* Search Bar */}
          <TextField
            placeholder={t('recentActivity.searchEntries')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            fullWidth
            sx={{ mb: 2 }}
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
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 1.5,
              maxHeight: '600px',
              overflowY: 'auto',
            }}
          >
            {filteredEntries.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                  {searchTerm ? t('recentActivity.noEntriesMatch') : t('recentActivity.noRecentActivity')}
                </Typography>
              </Box>
            ) : (
              filteredEntries.map((entry) => (
              <Box
                key={entry.id}
                onClick={() => handleEntryClick(entry.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: '8px',
                  border: '1px solid #2a2a2a',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: '#ffd700',
                    backgroundColor: '#2a2a2a',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    cursor: entry.photoUrl ? 'pointer' : 'default',
                  }}
                  onClick={(e) => {
                    if (entry.photoUrl) {
                      handleImageClick(e, entry.id, 0);
                    }
                  }}
                >
                  <Avatar
                    src={entry.photoUrl ? photoService.getPhotoUrl(entry.photoUrl, true) : undefined}
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '8px',
                      backgroundColor: '#2a2a2a',
                      border: expandedImageIndex?.entryId === entry.id ? '2px solid #ffd700' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {!entry.photoUrl && <ImageIcon />}
                  </Avatar>
                  {entry.photoUrl && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        borderRadius: '50%',
                        p: 0.25,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ZoomIn sx={{ color: '#ffffff', fontSize: '0.75rem' }} />
                    </Box>
                  )}
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: '#ffffff',
                      mb: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.identifier}
                  </Typography>
                  {entry.companyName && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#b0b0b0',
                        fontSize: '0.7rem',
                        display: 'block',
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.companyName}
                    </Typography>
                  )}
                      {entry.driverName && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#b0b0b0',
                        fontSize: '0.7rem',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      {t('recentActivity.driverLabel', { name: entry.driverName })}
                    </Typography>
                  )}
                  {(entry.truckNumber || entry.trailerNumber) && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#b0b0b0',
                        fontSize: '0.7rem',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      {entry.truckNumber && t('recentActivity.truckLabel', { number: entry.truckNumber })}
                      {entry.truckNumber && entry.trailerNumber && ' • '}
                      {entry.trailerNumber && t('recentActivity.trailerLabel', { number: entry.trailerNumber })}
                      {!entry.isOnSite && entry.exitTrailerNumber && entry.exitTrailerNumber !== entry.trailerNumber && (
                        <span> → {t('recentActivity.exitLabel', { number: entry.exitTrailerNumber })}</span>
                      )}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Chip
                      label={entry.isOnSite ? t('recentActivity.onSite') : t('recentActivity.exited')}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        backgroundColor: entry.isOnSite ? '#4caf50' : '#9e9e9e',
                        color: '#ffffff',
                        fontWeight: 600,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: '#b0b0b0', fontSize: '0.7rem', ml: 'auto' }}
                    >
                      {formatRelativeTime(entry.entryTime, t)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ color: '#ffd700' }}>{getEntryTypeIcon(entry.entryType)}</Box>
              </Box>
            )))}
            {loadingMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            {!hasMore && allEntries.length > 0 && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                  {t('recentActivity.noMoreEntries')}
                </Typography>
              </Box>
            )}
          </Box>
          {onViewAll && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={onViewAll}
                sx={{
                  borderColor: '#ffd700',
                  color: '#ffd700',
                  '&:hover': {
                    borderColor: '#ffed4e',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                  },
                }}
              >
                {t('recentActivity.viewAllLogs')}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
      <ImageExpansionModal />
    </>
    );
  }

  // Desktop: Table layout
  return (
    <>
      <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #2a2a2a' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 2 }}>
            {t('recentActivity.recentActivity')}
          </Typography>
          
          {/* Search Bar */}
          <TextField
            placeholder={t('recentActivity.searchEntries')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <TableContainer 
          ref={scrollContainerRef}
          sx={{ 
            maxHeight: '600px', 
            overflowY: 'auto',
            overflowX: 'auto',
            width: '100%',
            '& .MuiTable-root': {
              minWidth: 800,
            },
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#0a0a0a' }}>
                <TableCell sx={{ borderColor: '#2a2a2a', color: '#b0b0b0', fontSize: '0.75rem' }}>
                  {t('recentActivity.photo')}
                </TableCell>
                <TableCell sx={{ borderColor: '#2a2a2a', color: '#b0b0b0', fontSize: '0.75rem' }}>
                  {t('recentActivity.identifier')}
                </TableCell>
                <TableCell sx={{ borderColor: '#2a2a2a', color: '#b0b0b0', fontSize: '0.75rem' }}>
                  {t('recentActivity.company')}
                </TableCell>
                <TableCell sx={{ borderColor: '#2a2a2a', color: '#b0b0b0', fontSize: '0.75rem' }}>
                  {t('recentActivity.driver')}
                </TableCell>
                <TableCell sx={{ borderColor: '#2a2a2a', color: '#b0b0b0', fontSize: '0.75rem' }}>
                  {t('recentActivity.truckTrailer')}
                </TableCell>
                <TableCell sx={{ borderColor: '#2a2a2a', color: '#b0b0b0', fontSize: '0.75rem' }}>
                  {t('recentActivity.entryTime')}
                </TableCell>
                <TableCell sx={{ borderColor: '#2a2a2a', color: '#b0b0b0', fontSize: '0.75rem' }}>
                  {t('recentActivity.status')}
                </TableCell>
                <TableCell sx={{ borderColor: '#2a2a2a', color: '#b0b0b0', fontSize: '0.75rem' }}>
                  {t('recentActivity.type')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, borderColor: '#2a2a2a' }}>
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                      {searchTerm ? t('recentActivity.noEntriesMatch') : t('recentActivity.noRecentActivity')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => (
                  <TableRow
                  key={entry.id}
                  onClick={() => handleEntryClick(entry.id)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#2a2a2a',
                    },
                    '& td': {
                      borderColor: '#2a2a2a',
                    },
                  }}
                >
                  <TableCell>
                    <Avatar
                      src={entry.photoUrl ? photoService.getPhotoUrl(entry.photoUrl, true) : undefined}
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '8px',
                        backgroundColor: '#2a2a2a',
                      }}
                    >
                      {!entry.photoUrl && <ImageIcon />}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: '#ffffff' }}
                    >
                      {entry.identifier}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                      {entry.companyName || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                      {entry.driverName || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.75rem' }}>
                      {entry.truckNumber && t('recentActivity.truckLabel', { number: entry.truckNumber })}
                      {entry.truckNumber && entry.trailerNumber && <br />}
                      {entry.trailerNumber && t('recentActivity.trailerLabel', { number: entry.trailerNumber })}
                      {!entry.isOnSite && entry.exitTrailerNumber && entry.exitTrailerNumber !== entry.trailerNumber && (
                        <>
                          <br />
                          <span style={{ color: '#ff9800' }}>{t('recentActivity.exitLabel', { number: entry.exitTrailerNumber })}</span>
                        </>
                      )}
                      {!entry.truckNumber && !entry.trailerNumber && '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                      {formatRelativeTime(entry.entryTime, t)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.isOnSite ? t('recentActivity.onSite') : t('recentActivity.exited')}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        backgroundColor: entry.isOnSite ? '#4caf50' : '#9e9e9e',
                        color: '#ffffff',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ color: '#ffd700', display: 'flex', alignItems: 'center' }}>
                      {getEntryTypeIcon(entry.entryType)}
                    </Box>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {loadingMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {!hasMore && allEntries.length > 0 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                {t('recentActivity.noMoreEntries')}
              </Typography>
            </Box>
          )}
        </TableContainer>
        {onViewAll && (
          <Box sx={{ p: 2, borderTop: '1px solid #2a2a2a', textAlign: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={onViewAll}
              sx={{
                borderColor: '#ffd700',
                color: '#ffd700',
                '&:hover': {
                  borderColor: '#ffed4e',
                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                },
              }}
            >
              {t('recentActivity.viewAllLogs')}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
    <ImageExpansionModal />
    </>
  );
};

