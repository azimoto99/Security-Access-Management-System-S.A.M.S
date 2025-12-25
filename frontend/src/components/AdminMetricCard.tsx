import React from 'react';
import { Card, CardContent, Box, Typography, Skeleton } from '@mui/material';

interface AdminMetricCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactElement;
  color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary' | 'default';
  loading?: boolean;
  onClick?: () => void;
}

const colorMap: Record<string, { main: string; light: string; bg: string }> = {
  primary: {
    main: '#2196f3',
    light: '#64b5f6',
    bg: 'rgba(33, 150, 243, 0.1)',
  },
  success: {
    main: '#4caf50',
    light: '#81c784',
    bg: 'rgba(76, 175, 80, 0.1)',
  },
  warning: {
    main: '#ff9800',
    light: '#ffb74d',
    bg: 'rgba(255, 152, 0, 0.1)',
  },
  error: {
    main: '#f44336',
    light: '#e57373',
    bg: 'rgba(244, 67, 54, 0.1)',
  },
  info: {
    main: '#2196f3',
    light: '#64b5f6',
    bg: 'rgba(33, 150, 243, 0.1)',
  },
  secondary: {
    main: '#9c27b0',
    light: '#ba68c8',
    bg: 'rgba(156, 39, 176, 0.1)',
  },
  default: {
    main: '#9e9e9e',
    light: '#bdbdbd',
    bg: 'rgba(158, 158, 158, 0.1)',
  },
};

export const AdminMetricCard: React.FC<AdminMetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  loading = false,
  onClick,
}) => {
  const colors = colorMap[color] || colorMap.default;

  if (loading) {
    return (
      <Card sx={{ height: '100%', backgroundColor: '#1a1a1a' }}>
        <CardContent sx={{ p: 2 }}>
          <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="40%" height={40} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" height={16} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a1a1a',
        border: `1px solid ${colors.main}40`,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          borderColor: colors.main,
          boxShadow: onClick ? `0 4px 12px ${colors.main}30` : 'none',
          transform: onClick ? 'translateY(-2px)' : 'none',
        },
        transition: 'all 0.2s ease',
      }}
    >
      <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '8px',
              backgroundColor: colors.bg,
              color: colors.main,
              mr: 1.5,
              '& svg': {
                fontSize: '1.5rem',
              },
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: '#b0b0b0',
              fontSize: '0.75rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </Typography>
        </Box>
        <Typography
          variant="h3"
          sx={{
            fontSize: '2rem',
            fontWeight: 700,
            color: colors.main,
            mb: 0.5,
            lineHeight: 1.2,
          }}
        >
          {value.toLocaleString()}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#b0b0b0',
            fontSize: '0.75rem',
          }}
        >
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
};

