import React from 'react';
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
  Paper,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  DirectionsCar,
  Person,
  LocalShipping,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { RecentEntry } from '../services/dashboardService';
import { photoService } from '../services/photoService';

interface RecentActivityListProps {
  entries: RecentEntry[];
  onViewAll?: () => void;
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
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  entries,
  onViewAll,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleEntryClick = (entryId: string) => {
    navigate(`/search?entry_id=${entryId}`);
  };

  if (entries.length === 0) {
    return (
      <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: '#b0b0b0' }}>
            No recent activity
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    // Mobile: Card layout
    return (
      <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: '0.875rem' }}>
            Recent Activity
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {entries.map((entry) => (
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Chip
                      label={entry.isOnSite ? 'ON SITE' : 'EXITED'}
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
                      {formatRelativeTime(entry.entryTime)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ color: '#ffd700' }}>{getEntryTypeIcon(entry.entryType)}</Box>
              </Box>
            ))}
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
                View All Logs
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  // Desktop: Table layout
  return (
    <Card sx={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #2a2a2a' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            Recent Activity
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#0a0a0a' }}>
                <TableCell sx={{ borderColor: '#2a2a2a', color: '#b0b0b0', fontSize: '0.75rem' }}>
                  Photo
                </TableCell>
                <TableCell sx={{ borderColor: '#2a2a2a', color: '#b0b0b0', fontSize: '0.75rem' }}>
                  Identifier
                </TableCell>
                <TableCell sx={{ borderColor: '#2a2a2a', color: '#b0b0b0', fontSize: '0.75rem' }}>
                  Company
                </TableCell>
                <TableCell sx={{ borderColor: '#2a2a2a', color: '#b0b0b0', fontSize: '0.75rem' }}>
                  Entry Time
                </TableCell>
                <TableCell sx={{ borderColor: '#2a2a2a', color: '#b0b0b0', fontSize: '0.75rem' }}>
                  Status
                </TableCell>
                <TableCell sx={{ borderColor: '#2a2a2a', color: '#b0b0b0', fontSize: '0.75rem' }}>
                  Type
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((entry) => (
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
                      {formatRelativeTime(entry.entryTime)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.isOnSite ? 'ON SITE' : 'EXITED'}
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
              ))}
            </TableBody>
          </Table>
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
              View All Logs
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

