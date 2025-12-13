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
    'Guard',
    'License Plate/Name',
    'Company',
    'Purpose',
  ];

  const rows = entries.map((entry) => {
    const data = entry.entry_data || {};
    return [
      entry.id,
      (entry as any).job_site_name || 'N/A',
      entry.entry_type,
      entry.status,
      new Date(entry.entry_time).toISOString(),
      entry.exit_time ? new Date(entry.exit_time).toISOString() : 'N/A',
      (entry as any).guard_username || 'N/A',
      data.license_plate || data.name || data.driver_name || 'N/A',
      data.company || 'N/A',
      data.purpose || 'N/A',
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
  lines.push(`Date Range: ${filters.date_from} to ${filters.date_to}`);
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



