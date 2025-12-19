import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import type { JobSiteOccupancy } from '../services/occupancyService';

interface OccupancyCardProps {
  occupancy: JobSiteOccupancy;
  onSelect?: () => void;
}

export const OccupancyCard: React.FC<OccupancyCardProps> = ({ occupancy, onSelect }) => {
  const getCapacityPercentage = (current: number, capacity: number): number => {
    if (capacity === 0) return 0;
    return Math.min((current / capacity) * 100, 100);
  };

  const getProgressColor = (percentage: number, warning: boolean): 'primary' | 'warning' | 'error' => {
    if (percentage >= 100) return 'error';
    if (warning || percentage >= 90) return 'warning';
    return 'primary';
  };

  const vehiclePercentage = getCapacityPercentage(occupancy.counts.vehicles, occupancy.capacity.vehicles);
  const visitorPercentage = getCapacityPercentage(occupancy.counts.visitors, occupancy.capacity.visitors);
  const truckPercentage = getCapacityPercentage(occupancy.counts.trucks, occupancy.capacity.trucks);

  const hasWarnings = occupancy.warnings.vehicles || occupancy.warnings.visitors || occupancy.warnings.trucks;

  return (
    <Card
      sx={{
        cursor: onSelect ? 'pointer' : 'default',
        height: '100%',
        border: hasWarnings ? '2px solid #ffd700' : '1px solid #2a2a2a',
        backgroundColor: '#1a1a1a',
        transition: 'all 0.2s ease',
        '&:hover': onSelect
          ? {
              borderColor: '#ffd700',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(255, 215, 0, 0.15)',
            }
          : {},
      }}
      onClick={onSelect}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1.5,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#ffffff',
              lineHeight: 1.2,
            }}
          >
            {occupancy.job_site_name}
          </Typography>
          {hasWarnings && (
            <Chip
              icon={<Warning sx={{ fontSize: '14px !important' }} />}
              label="!"
              size="small"
              sx={{
                backgroundColor: '#ffd700',
                color: '#000000',
                height: '20px',
                fontSize: '0.7rem',
                fontWeight: 700,
                '& .MuiChip-icon': {
                  color: '#000000',
                  marginLeft: '4px',
                },
              }}
            />
          )}
        </Box>

        <Box sx={{ mb: 1.25 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#b0b0b0' }}>
              Vehicles
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#ffffff' }}>
              {occupancy.counts.vehicles} / {occupancy.capacity.vehicles}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={vehiclePercentage}
            color={getProgressColor(vehiclePercentage, occupancy.warnings.vehicles)}
            sx={{
              height: 6,
              borderRadius: 1,
              backgroundColor: '#2a2a2a',
              '& .MuiLinearProgress-bar': {
                backgroundColor:
                  vehiclePercentage >= 100
                    ? '#ff4444'
                    : occupancy.warnings.vehicles || vehiclePercentage >= 90
                      ? '#ffd700'
                      : '#ffd700',
              },
            }}
          />
          {occupancy.warnings.vehicles && (
            <Typography
              variant="caption"
              sx={{
                mt: 0.25,
                display: 'block',
                fontSize: '0.65rem',
                color: '#ffd700',
              }}
            >
              {vehiclePercentage.toFixed(0)}% capacity
            </Typography>
          )}
        </Box>

        <Box sx={{ mb: 1.25 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#b0b0b0' }}>
              Visitors
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#ffffff' }}>
              {occupancy.counts.visitors} / {occupancy.capacity.visitors}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={visitorPercentage}
            color={getProgressColor(visitorPercentage, occupancy.warnings.visitors)}
            sx={{
              height: 6,
              borderRadius: 1,
              backgroundColor: '#2a2a2a',
              '& .MuiLinearProgress-bar': {
                backgroundColor:
                  visitorPercentage >= 100
                    ? '#ff4444'
                    : occupancy.warnings.visitors || visitorPercentage >= 90
                      ? '#ffd700'
                      : '#ffd700',
              },
            }}
          />
          {occupancy.warnings.visitors && (
            <Typography
              variant="caption"
              sx={{
                mt: 0.25,
                display: 'block',
                fontSize: '0.65rem',
                color: '#ffd700',
              }}
            >
              {visitorPercentage.toFixed(0)}% capacity
            </Typography>
          )}
        </Box>

        <Box sx={{ mb: 1.25 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#b0b0b0' }}>
              Trucks
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#ffffff' }}>
              {occupancy.counts.trucks} / {occupancy.capacity.trucks}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={truckPercentage}
            color={getProgressColor(truckPercentage, occupancy.warnings.trucks)}
            sx={{
              height: 6,
              borderRadius: 1,
              backgroundColor: '#2a2a2a',
              '& .MuiLinearProgress-bar': {
                backgroundColor:
                  truckPercentage >= 100
                    ? '#ff4444'
                    : occupancy.warnings.trucks || truckPercentage >= 90
                      ? '#ffd700'
                      : '#ffd700',
              },
            }}
          />
          {occupancy.warnings.trucks && (
            <Typography
              variant="caption"
              sx={{
                mt: 0.25,
                display: 'block',
                fontSize: '0.65rem',
                color: '#ffd700',
              }}
            >
              {truckPercentage.toFixed(0)}% capacity
            </Typography>
          )}
        </Box>

        <Box sx={{ mt: 1.25, pt: 1.25, borderTop: '1px solid #2a2a2a' }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              fontSize: '0.7rem',
              color: '#b0b0b0',
              fontWeight: 600,
            }}
          >
            Total: {occupancy.counts.total} active
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};



