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
import { customFieldService } from '../services/customFieldService';
import type { CustomField } from '../types/customField';

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

// Get display fields for an entry based on field configurations
const getEntryDisplayFields = (entry: RecentEntry, fieldConfigs: Record<string, CustomField[]>, t: any): Array<{label: string, value: string}> => {
  const siteId = entry.jobSiteId || '';
  const configKey = `${siteId}_${entry.entryType}`;
  const configs = fieldConfigs[configKey] || [];

  const displayFields: Array<{label: string, value: string}> = [];

  // Add identifier first (always shown)
  displayFields.push({
    label: t('recentActivity.identifier'),
    value: entry.identifier
  });

  // Add company name if present
  if (entry.companyName) {
    displayFields.push({
      label: t('recentActivity.company'),
      value: entry.companyName
    });
  }

  // Get configured fields for this entry type
  configs.forEach(field => {
    const value = entry[field.field_key as keyof RecentEntry] as any;
    if (value !== undefined && value !== null && value !== '') {
      let displayValue: string = '';

      if (field.field_type === 'select' && field.options) {
        const option = field.options.find((opt: any) => opt.value === value);
        displayValue = option ? option.label : String(value);
      } else if (field.field_type === 'boolean') {
        displayValue = value ? 'Yes' : 'No';
      } else if (field.field_type === 'date' && value) {
        displayValue = new Date(value).toLocaleDateString();
      } else {
        displayValue = String(value);
      }

      displayFields.push({
        label: field.field_label,
        value: displayValue
      });
    }
  });

  // Limit to 3 most important fields to avoid clutter
  return displayFields.slice(0, 4);
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
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, CustomField[]>>({});
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

  // Load field configurations for all sites
  useEffect(() => {
    const loadFieldConfigs = async () => {
      if (!siteId) return;

      const uniqueSites = new Set(allEntries.map(entry => entry.jobSiteId || siteId).filter(Boolean));
      const configs: Record<string, CustomField[]> = {};

      for (const siteId of uniqueSites) {
        try {
          // Load configs for all entry types that might be present
          const [vehicleConfigs, visitorConfigs, truckConfigs] = await Promise.all([
            customFieldService.getCustomFields(siteId, 'vehicle'),
            customFieldService.getCustomFields(siteId, 'visitor'),
            customFieldService.getCustomFields(siteId, 'truck'),
          ]);

          configs[`${siteId}_vehicle`] = vehicleConfigs.filter(f => f.is_active);
          configs[`${siteId}_visitor`] = visitorConfigs.filter(f => f.is_active);
          configs[`${siteId}_truck`] = truckConfigs.filter(f => f.is_active);
        } catch (error) {
          console.error(`Failed to load field configs for site ${siteId}:`, error);
        }
      }

      setFieldConfigs(configs);
    };

    if (allEntries.length > 0) {
      loadFieldConfigs();
    }
  }, [allEntries, siteId]);

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
                  {(() => {
                    const displayFields = getEntryDisplayFields(entry, fieldConfigs, t);
                    const primaryField = displayFields[0];
                    const secondaryFields = displayFields.slice(1);

                    return (
                      <>
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
                          {primaryField ? primaryField.value : entry.identifier}
                        </Typography>
                        {secondaryFields.slice(0, 2).map((field, idx) => (
                          <Typography
                            key={idx}
                            variant="caption"
                            sx={{
                              color: '#b0b0b0',
                              fontSize: '0.7rem',
                              display: 'block',
                              mb: 0.25,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {field.label}: {field.value}
                          </Typography>
                        ))}
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
                      </>
                    );
                  })()}
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
                  {t('recentActivity.details')}
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
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, borderColor: '#2a2a2a' }}>
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
                    <Box>
                      {(() => {
                        const displayFields = getEntryDisplayFields(entry, fieldConfigs, t);
                        return displayFields.slice(1, 4).map((field, idx) => (
                          <Typography
                            key={idx}
                            variant="body2"
                            sx={{
                              color: '#b0b0b0',
                              fontSize: '0.75rem',
                              mb: idx < displayFields.slice(1, 4).length - 1 ? 0.25 : 0
                            }}
                          >
                            {field.label}: {field.value}
                          </Typography>
                        ));
                      })()}
                    </Box>
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

