import { AuditLog } from '../services/auditLogService';
import { ReportData } from '../services/reportService';
import pool from '../config/database';
import type { EntryFieldConfig } from '../types/customField';

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
 * Get field configurations for entries (grouped by job_site_id and entry_type)
 */
const getFieldConfigsForEntries = async (entries: any[]): Promise<Map<string, EntryFieldConfig[]>> => {
  const configMap = new Map<string, EntryFieldConfig[]>();
  
  // Get unique job_site_id + entry_type combinations
  const uniqueCombos = new Set<string>();
  entries.forEach((entry) => {
    if (entry.job_site_id && entry.entry_type) {
      uniqueCombos.add(`${entry.job_site_id}:${entry.entry_type}`);
    }
  });

  // Fetch field configs for each combination
  for (const combo of uniqueCombos) {
    const [job_site_id, entry_type] = combo.split(':');
    try {
      const result = await pool.query(
        'SELECT * FROM entry_field_configs WHERE job_site_id = $1 AND entry_type = $2 AND is_active = true ORDER BY display_order',
        [job_site_id, entry_type]
      );
      
      const configs = result.rows.map((row) => ({
        ...row,
        options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options || [],
        validation: typeof row.validation === 'string' ? JSON.parse(row.validation) : row.validation || {},
      }));
      
      configMap.set(combo, configs);
    } catch (error) {
      console.error(`Error fetching field configs for ${combo}:`, error);
      configMap.set(combo, []);
    }
  }

  return configMap;
};

/**
 * Export entries to CSV format with dynamic custom fields
 */
export const exportEntriesToCSV = async (entries: any[]): Promise<string> => {
  // Base headers (always included)
  const baseHeaders = [
    'ID',
    'Job Site',
    'Type',
    'Status',
    'Entry Time',
    'Exit Time',
    'Duration (minutes)',
    'Guard',
  ];

  // Get field configurations
  const fieldConfigMap = await getFieldConfigsForEntries(entries);
  
  // Collect all unique field keys across all entries (for custom fields not in configs)
  const allCustomFieldKeys = new Set<string>();
  entries.forEach((entry) => {
    const data = entry.entry_data || {};
    Object.keys(data).forEach((key) => {
      // Skip standard fields that are already in base headers or will be added
      const standardFields = ['license_plate', 'driver_name', 'name', 'company', 'purpose', 'vehicle_type', 'truck_number', 'trailer_number', 'exit_trailer_number', 'cargo_description', 'delivery_pickup', 'expected_duration', 'contact_phone', 'host_contact'];
      if (!standardFields.includes(key)) {
        allCustomFieldKeys.add(key);
      }
    });
  });

  // Build dynamic headers from field configs
  const dynamicHeaders: string[] = [];
  const fieldKeyToLabel = new Map<string, string>();
  
  // Add standard field headers
  const standardFieldHeaders = [
    'License Plate',
    'Driver Name',
    'Visitor Name',
    'Company',
    'Purpose',
    'Vehicle Type',
    'Truck Number',
    'Trailer Number',
    'Exit Trailer Number',
    'Cargo Description',
    'Delivery/Pickup',
    'Expected Duration (minutes)',
    'Contact Phone',
    'Host Contact',
  ];
  const standardFieldKeys = [
    'license_plate',
    'driver_name',
    'name',
    'company',
    'purpose',
    'vehicle_type',
    'truck_number',
    'trailer_number',
    'exit_trailer_number',
    'cargo_description',
    'delivery_pickup',
    'expected_duration',
    'contact_phone',
    'host_contact',
  ];
  
  standardFieldKeys.forEach((key, index) => {
    dynamicHeaders.push(standardFieldHeaders[index]);
    fieldKeyToLabel.set(key, standardFieldHeaders[index]);
  });

  // Add configured custom fields (grouped by entry type to avoid duplicates)
  const addedCustomFields = new Set<string>();
  fieldConfigMap.forEach((configs) => {
    configs.forEach((config) => {
      if (config.is_custom && !addedCustomFields.has(config.field_key)) {
        dynamicHeaders.push(config.field_label);
        fieldKeyToLabel.set(config.field_key, config.field_label);
        addedCustomFields.add(config.field_key);
      }
    });
  });

  // Add any remaining custom fields not in configs
  allCustomFieldKeys.forEach((key) => {
    if (!fieldKeyToLabel.has(key)) {
      // Convert snake_case to Title Case
      const label = key
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      dynamicHeaders.push(label);
      fieldKeyToLabel.set(key, label);
    }
  });

  const headers = [...baseHeaders, ...dynamicHeaders];

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
    const combo = `${entry.job_site_id}:${entry.entry_type}`;
    const fieldConfigs = fieldConfigMap.get(combo) || [];
    
    // Base row data
    const row: any[] = [
      entry.id,
      (entry as any).job_site_name || 'N/A',
      entry.entry_type,
      entry.status,
      new Date(entry.entry_time).toLocaleString('en-US', { timeZone: 'UTC' }),
      entry.exit_time ? new Date(entry.exit_time).toLocaleString('en-US', { timeZone: 'UTC' }) : 'N/A',
      calculateDuration(entry),
      (entry as any).guard_username || 'N/A',
    ];

    // Add standard fields
    standardFieldKeys.forEach((key) => {
      let value = data[key] || 'N/A';
      // Format select fields
      if (key === 'delivery_pickup' && value !== 'N/A') {
        value = value === 'delivery' ? 'Delivery' : 'Pickup';
      }
      row.push(value);
    });

    // Add configured custom fields
    const customFieldKeys = new Set(fieldConfigs.filter((f) => f.is_custom).map((f) => f.field_key));
    customFieldKeys.forEach((key) => {
      let value = data[key];
      if (value === undefined || value === null || value === '') {
        value = 'N/A';
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      row.push(value);
    });

    // Add any remaining custom fields
    Object.keys(data).forEach((key) => {
      if (!standardFieldKeys.includes(key) && !customFieldKeys.has(key)) {
        let value = data[key];
        if (value === undefined || value === null || value === '') {
          value = 'N/A';
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        row.push(value);
      }
    });

    return row;
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






