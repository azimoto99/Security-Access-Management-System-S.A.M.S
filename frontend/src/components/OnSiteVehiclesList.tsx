import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Avatar,
  Button,
  Chip,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search,
  DirectionsCar,
  Person,
  LocalShipping,
  ExitToApp,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Entry } from '../services/entryService';
import { photoService } from '../services/photoService';
import { ExitConfirmationDialog } from './ExitConfirmationDialog';

interface OnSiteVehiclesListProps {
  entries: Entry[];
  loading?: boolean;
  onExit: (entryId: string, exitNotes?: string) => Promise<void>;
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

const getEntryTypeColor = (entryType: string): string => {
  switch (entryType) {
    case 'vehicle':
      return '#2196f3';
    case 'truck':
      return '#ff9800';
    case 'visitor':
      return '#4caf50';
    default:
      return '#9e9e9e';
  }
};

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ${diffMins % 60}m ago`;
  } else {
    return `${diffDays}d ago`;
  }
};

const formatDuration = (entryTime: string): string => {
  const date = new Date(entryTime);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMins % 60}m`;
  } else {
    return `${diffMins}m`;
  }
};

const getIdentifier = (entry: Entry): string => {
  if (entry.entry_type === 'visitor') {
    return entry.entry_data?.name || 'Unknown';
  }
  return entry.entry_data?.license_plate || 'Unknown';
};

const getCompany = (entry: Entry): string => {
  return entry.entry_data?.company || '';
};

export const OnSiteVehiclesList: React.FC<OnSiteVehiclesListProps> = ({
  entries,
  loading,
  onExit,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [processingExit, setProcessingExit] = useState(false);

  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) {
      return entries;
    }

    const search = searchTerm.toLowerCase();
    return entries.filter((entry) => {
      const identifier = getIdentifier(entry).toLowerCase();
      const company = getCompany(entry).toLowerCase();
      return identifier.includes(search) || company.includes(search);
    });
  }, [entries, searchTerm]);

  const handleExitClick = (e: React.MouseEvent, entry: Entry) => {
    e.stopPropagation();
    setSelectedEntry(entry);
    setExitDialogOpen(true);
  };

  const handleExitConfirm = async (exitNotes?: string) => {
    if (!selectedEntry) return;

    setProcessingExit(true);
    try {
      await onExit(selectedEntry.id, exitNotes);
      setExitDialogOpen(false);
      setSelectedEntry(null);
    } catch (error) {
      console.error('Exit error:', error);
    } finally {
      setProcessingExit(false);
    }
  };

  const handleEntryClick = (entry: Entry) => {
    navigate(`/search?entry_id=${entry.id}`);
  };

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Vehicles On Site
            </Typography>
            <Chip
              label={entries.length}
              color="primary"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>

          {/* Search */}
          <TextField
            placeholder="Search on-site vehicles..."
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

          {/* List */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={32} />
              </Box>
            ) : filteredEntries.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                {searchTerm ? 'No vehicles match your search' : 'No vehicles currently on site'}
              </Alert>
            ) : (
              filteredEntries.map((entry) => {
                const identifier = getIdentifier(entry);
                const company = getCompany(entry);
                const photoId = entry.photos && entry.photos.length > 0 ? entry.photos[0] : null;
                const entryTypeColor = getEntryTypeColor(entry.entry_type);

                return (
                  <Box
                    key={entry.id}
                    onClick={() => handleEntryClick(entry)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: '8px',
                      border: '1px solid #2a2a2a',
                      cursor: 'pointer',
                      backgroundColor: '#1a1a1a',
                      '&:hover': {
                        borderColor: entryTypeColor,
                        backgroundColor: '#2a2a2a',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Photo */}
                    <Avatar
                      src={photoId ? photoService.getPhotoUrl(photoId, true) : undefined}
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '8px',
                        backgroundColor: '#2a2a2a',
                        border: `2px solid ${entryTypeColor}40`,
                      }}
                    >
                      {!photoId && <ImageIcon />}
                    </Avatar>

                    {/* Info */}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            color: '#ffffff',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {identifier}
                        </Typography>
                        <Box sx={{ color: entryTypeColor }}>
                          {getEntryTypeIcon(entry.entry_type)}
                        </Box>
                      </Box>
                      {company && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#b0b0b0',
                            fontSize: '0.75rem',
                            display: 'block',
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {company}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={formatDuration(entry.entry_time)}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            backgroundColor: '#2a2a2a',
                            color: '#b0b0b0',
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ color: '#b0b0b0', fontSize: '0.7rem' }}
                        >
                          {formatRelativeTime(entry.entry_time)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Exit Button */}
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      startIcon={<ExitToApp />}
                      onClick={(e) => handleExitClick(e, entry)}
                      sx={{
                        minWidth: 80,
                        fontWeight: 600,
                        textTransform: 'none',
                      }}
                    >
                      EXIT
                    </Button>
                  </Box>
                );
              })
            )}
          </Box>
        </CardContent>
      </Card>

      <ExitConfirmationDialog
        open={exitDialogOpen}
        entry={selectedEntry}
        onClose={() => {
          setExitDialogOpen(false);
          setSelectedEntry(null);
        }}
        onConfirm={handleExitConfirm}
        processing={processingExit}
      />
    </>
  );
};

