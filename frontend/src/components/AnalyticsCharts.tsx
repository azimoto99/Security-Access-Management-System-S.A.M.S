import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download } from '@mui/icons-material';
import type { AnalyticsData } from '../services/adminDashboardService';

interface AnalyticsChartsProps {
  data: AnalyticsData | undefined;
  loading: boolean;
  period: 'today' | 'week' | 'month';
  onPeriodChange: (period: 'today' | 'week' | 'month') => void;
}

const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#f44336', '#00bcd4'];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  data,
  loading,
  period,
  onPeriodChange,
}) => {
  const handleExport = (chartType: string) => {
    // TODO: Implement chart export functionality
    console.log(`Export ${chartType} chart`);
  };

  if (loading) {
    return (
      <Card sx={{ backgroundColor: '#1a1a1a' }}>
        <CardContent>
          <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: '8px' }} />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card sx={{ backgroundColor: '#1a1a1a' }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No analytics data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ backgroundColor: '#1a1a1a' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Analytics
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              onChange={(e) => onPeriodChange(e.target.value as 'today' | 'week' | 'month')}
              label="Period"
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Entries Over Time Chart */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#b0b0b0' }}>
              Entries Over Time
            </Typography>
            <Button
              size="small"
              startIcon={<Download />}
              onClick={() => handleExport('entriesOverTime')}
              sx={{ minWidth: 'auto' }}
            >
              Export
            </Button>
          </Box>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.entriesOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="time" stroke="#b0b0b0" />
              <YAxis stroke="#b0b0b0" />
              <Tooltip
                contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
              />
              <Legend wrapperStyle={{ color: '#b0b0b0' }} />
              <Line type="monotone" dataKey="entries" stroke="#2196f3" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Site Activity Comparison */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#b0b0b0' }}>
              Site Activity Comparison
            </Typography>
            <Button
              size="small"
              startIcon={<Download />}
              onClick={() => handleExport('entriesBySite')}
              sx={{ minWidth: 'auto' }}
            >
              Export
            </Button>
          </Box>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.entriesBySite.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="site" stroke="#b0b0b0" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#b0b0b0" />
              <Tooltip
                contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
              />
              <Bar dataKey="entries" fill="#4caf50" />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        {/* Entry Type Breakdown */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#b0b0b0' }}>
              Entry Type Breakdown
            </Typography>
            <Button
              size="small"
              startIcon={<Download />}
              onClick={() => handleExport('entryTypeBreakdown')}
              sx={{ minWidth: 'auto' }}
            >
              Export
            </Button>
          </Box>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data.entryTypeBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.entryTypeBreakdown.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

