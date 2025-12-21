import { AuditLog } from '../services/auditLogService';
import { ReportData } from '../services/reportService';

/**
 * Export audit logs to CSV format
 */
export const exportLogsToCSV = (logs: AuditLog[]): string => {
  const headers = ['ID', 'Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'Details'];
  const rows = logs.map((log) => [
    log.id,
    new Date(log.timestamp).toISOString(),
    log.username || log.user_id,
    log.action,
    log.resource_type,
    log.resource_id,
    JSON.stringify(log.details),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
};

/**
 * Export entries to CSV format
 */
export const exportEntriesToCSV = (entries: any[]): string => {
  const headers = [
    'ID',
    'Job Site',
    'Type',
    'Status',
    'Entry Time',
    'Exit Time',
    'Duration (minutes)',
    'Guard',
    'License Plate',
    'Driver Name',
    'Visitor Name',
    'Company',
    'Purpose',
    'Vehicle Make',
    'Vehicle Model',
    'Vehicle Color',
    'Phone Number',
    'Email',
    'Notes',
  ];

  const calculateDuration = (entry: any): string => {
    if (!entry.exit_time) return 'N/A';
    const entryTime = new Date(entry.entry_time);
    const exitTime = new Date(entry.exit_time);
    const diffMs = exitTime.getTime() - entryTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return diffMins.toString();
  };

  const rows = entries.map((entry) => {
    const data = entry.entry_data || {};
    return [
      entry.id,
      (entry as any).job_site_name || 'N/A',
      entry.entry_type,
      entry.status,
      new Date(entry.entry_time).toLocaleString('en-US', { timeZone: 'UTC' }),
      entry.exit_time ? new Date(entry.exit_time).toLocaleString('en-US', { timeZone: 'UTC' }) : 'N/A',
      calculateDuration(entry),
      (entry as any).guard_username || 'N/A',
      data.license_plate || 'N/A',
      data.driver_name || 'N/A',
      data.name || 'N/A',
      data.company || 'N/A',
      data.purpose || 'N/A',
      data.vehicle_make || 'N/A',
      data.vehicle_model || 'N/A',
      data.vehicle_color || 'N/A',
      data.phone || data.phone_number || 'N/A',
      data.email || 'N/A',
      data.notes || data.additional_notes || 'N/A',
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
};

/**
 * Export report to CSV format
 */
export const exportReportToCSV = (report: ReportData, filters: any): string => {
  const lines: string[] = [];

  lines.push('Security Access Management System - Report');
  lines.push(`Generated: ${new Date().toISOString()}`);
  let dateRange = `Date Range: ${filters.date_from} to ${filters.date_to}`;
  if (filters.time_from || filters.time_to) {
    dateRange += ` (${filters.time_from || '00:00'} to ${filters.time_to || '23:59'})`;
  }
  lines.push(dateRange);
  lines.push('');

  // Summary
  lines.push('SUMMARY');
  lines.push(`Total Entries,${report.summary.total_entries}`);
  lines.push(`Total Exits,${report.summary.total_exits}`);
  lines.push(`Active Entries,${report.summary.active_entries}`);
  lines.push(`Vehicles,${report.summary.by_type.vehicles}`);
  lines.push(`Visitors,${report.summary.by_type.visitors}`);
  lines.push(`Trucks,${report.summary.by_type.trucks}`);
  lines.push(`Average Duration (minutes),${report.average_duration}`);
  lines.push('');

  // Peak Hours
  lines.push('PEAK HOURS');
  lines.push('Hour,Count');
  report.peak_hours.forEach((ph) => {
    lines.push(`${ph.hour},${ph.count}`);
  });
  lines.push('');

  // Daily Breakdown
  if (report.daily_breakdown.length > 0) {
    lines.push('DAILY BREAKDOWN');
    lines.push('Date,Entries,Exits');
    report.daily_breakdown.forEach((day) => {
      lines.push(`${day.date},${day.entries},${day.exits}`);
    });
  }

  return lines.join('\n');
};






