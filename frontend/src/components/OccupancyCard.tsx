import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import { JobSiteOccupancy } from '../services/occupancyService';

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
        '&:hover': onSelect ? { boxShadow: 4 } : {},
        border: hasWarnings ? '2px solid' : 'none',
        borderColor: hasWarnings ? 'warning.main' : 'transparent',
      }}
      onClick={onSelect}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{occupancy.job_site_name}</Typography>
          {hasWarnings && (
            <Chip
              icon={<Warning />}
              label="Warning"
              color="warning"
              size="small"
            />
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">Vehicles</Typography>
            <Typography variant="body2" fontWeight="bold">
              {occupancy.counts.vehicles} / {occupancy.capacity.vehicles}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={vehiclePercentage}
            color={getProgressColor(vehiclePercentage, occupancy.warnings.vehicles)}
            sx={{ height: 8, borderRadius: 1 }}
          />
          {occupancy.warnings.vehicles && (
            <Alert severity="warning" sx={{ mt: 0.5, py: 0 }}>
              Vehicle capacity at {vehiclePercentage.toFixed(0)}%
            </Alert>
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">Visitors</Typography>
            <Typography variant="body2" fontWeight="bold">
              {occupancy.counts.visitors} / {occupancy.capacity.visitors}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={visitorPercentage}
            color={getProgressColor(visitorPercentage, occupancy.warnings.visitors)}
            sx={{ height: 8, borderRadius: 1 }}
          />
          {occupancy.warnings.visitors && (
            <Alert severity="warning" sx={{ mt: 0.5, py: 0 }}>
              Visitor capacity at {visitorPercentage.toFixed(0)}%
            </Alert>
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">Trucks</Typography>
            <Typography variant="body2" fontWeight="bold">
              {occupancy.counts.trucks} / {occupancy.capacity.trucks}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={truckPercentage}
            color={getProgressColor(truckPercentage, occupancy.warnings.trucks)}
            sx={{ height: 8, borderRadius: 1 }}
          />
          {occupancy.warnings.trucks && (
            <Alert severity="warning" sx={{ mt: 0.5, py: 0 }}>
              Truck capacity at {truckPercentage.toFixed(0)}%
            </Alert>
          )}
        </Box>

        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Total: {occupancy.counts.total} active entries
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};



