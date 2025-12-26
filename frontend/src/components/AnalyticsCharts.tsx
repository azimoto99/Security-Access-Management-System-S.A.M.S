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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const handleExport = async (chartType: string) => {
    try {
      // Get chart element by type
      const chartId = `chart-${chartType}`;
      const chartElement = document.getElementById(chartId);
      
      if (!chartElement) {
        console.error(`Chart element not found: ${chartId}`);
        return;
      }

      // Create canvas from SVG (Recharts renders SVG)
      const svgElement = chartElement.querySelector('svg');
      if (!svgElement) {
        console.error('SVG element not found in chart');
        return;
      }

      // Convert SVG to canvas
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = svgElement.clientWidth || 800;
      canvas.height = svgElement.clientHeight || 600;

      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          // Download as PNG
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `chart-${chartType}-${new Date().toISOString().split('T')[0]}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }
          });
        }
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (error) {
      console.error('Error exporting chart:', error);
    }
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
            {t('adminDashboard.noAnalyticsData')}
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
            {t('adminDashboard.analytics')}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{t('adminDashboard.period')}</InputLabel>
            <Select
              value={period}
              onChange={(e) => onPeriodChange(e.target.value as 'today' | 'week' | 'month')}
              label={t('adminDashboard.period')}
            >
              <MenuItem value="today">{t('adminDashboard.today')}</MenuItem>
              <MenuItem value="week">{t('adminDashboard.thisWeek')}</MenuItem>
              <MenuItem value="month">{t('adminDashboard.thisMonth')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Entries Over Time Chart */}
        <Box id="chart-entriesOverTime" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#b0b0b0' }}>
              {t('adminDashboard.entriesOverTime')}
            </Typography>
            <Button
              size="small"
              startIcon={<Download />}
              onClick={() => handleExport('entriesOverTime')}
              sx={{ minWidth: 'auto' }}
            >
              {t('adminDashboard.export')}
            </Button>
          </Box>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.entriesOverTime} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis 
                dataKey="time" 
                stroke="#b0b0b0" 
                tick={{ fill: '#b0b0b0', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#b0b0b0" 
                tick={{ fill: '#b0b0b0', fontSize: 12 }}
                width={40}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
              />
              <Legend wrapperStyle={{ color: '#b0b0b0', fontSize: '12px' }} />
              <Line type="monotone" dataKey="entries" stroke="#2196f3" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Site Activity Comparison */}
        <Box id="chart-entriesBySite" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#b0b0b0' }}>
              {t('adminDashboard.siteActivityComparison')}
            </Typography>
            <Button
              size="small"
              startIcon={<Download />}
              onClick={() => handleExport('entriesBySite')}
              sx={{ minWidth: 'auto' }}
            >
              {t('adminDashboard.export')}
            </Button>
          </Box>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.entriesBySite.slice(0, 10)} margin={{ top: 5, right: 10, left: 0, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis 
                dataKey="site" 
                stroke="#b0b0b0" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fill: '#b0b0b0', fontSize: 11 }}
                interval={0}
              />
              <YAxis 
                stroke="#b0b0b0" 
                tick={{ fill: '#b0b0b0', fontSize: 12 }}
                width={40}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
              />
              <Bar dataKey="entries" fill="#4caf50" />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        {/* Entry Type Breakdown */}
        <Box id="chart-entryTypeBreakdown">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#b0b0b0' }}>
              {t('adminDashboard.entryTypeBreakdown')}
            </Typography>
            <Button
              size="small"
              startIcon={<Download />}
              onClick={() => handleExport('entryTypeBreakdown')}
              sx={{ minWidth: 'auto' }}
            >
              {t('adminDashboard.export')}
            </Button>
          </Box>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart margin={{ top: 10, right: 20, left: 20, bottom: 40 }}>
              <Pie
                data={data.entryTypeBreakdown}
                cx="50%"
                cy="50%"
                labelLine={{ stroke: '#b0b0b0', strokeWidth: 1 }}
                label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={60}
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
              <Legend 
                wrapperStyle={{ color: '#b0b0b0', fontSize: '12px' }}
                verticalAlign="bottom"
                height={36}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

