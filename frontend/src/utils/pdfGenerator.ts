import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AuditLog } from '../services/auditLogService';
import type { ReportData } from '../services/reportService';

/**
 * Generate PDF for audit logs
 */
export const generateAuditLogsPDF = (logs: AuditLog[], filters?: any): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Security Access Management System', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Audit Logs Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Report metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
  yPosition += 5;

  if (filters) {
    if (filters.date_from && filters.date_to) {
      doc.text(`Date Range: ${filters.date_from} to ${filters.date_to}`, 14, yPosition);
      yPosition += 5;
    }
    if (filters.user_id) {
      doc.text(`User Filter: ${filters.user_id}`, 14, yPosition);
      yPosition += 5;
    }
    if (filters.action) {
      doc.text(`Action Filter: ${filters.action}`, 14, yPosition);
      yPosition += 5;
    }
  }

  yPosition += 5;

  // Table data
  const tableData = logs.map((log) => [
    new Date(log.timestamp).toLocaleString(),
    log.username || log.user_id || 'N/A',
    log.action,
    log.resource_type,
    log.resource_id.substring(0, 8) + '...',
    typeof log.details === 'object' ? JSON.stringify(log.details).substring(0, 50) + '...' : String(log.details).substring(0, 50),
  ]);

  // Generate table
  autoTable(doc, {
    startY: yPosition,
    head: [['Timestamp', 'User', 'Action', 'Resource Type', 'Resource ID', 'Details']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [25, 118, 210],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 50 },
    },
    margin: { top: yPosition, left: 14, right: 14 },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY || yPosition;
  doc.setFontSize(8);
  doc.text(
    `Total Logs: ${logs.length} | Page ${doc.getCurrentPageInfo().pageNumber}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  return doc;
};

/**
 * Generate PDF for report summary
 */
export const generateReportPDF = (report: ReportData, filters: any): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Security Access Management System', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Analytics Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Report metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
  yPosition += 5;

  let dateRange = `Date Range: ${filters.date_from} to ${filters.date_to}`;
  if (filters.time_from || filters.time_to) {
    dateRange += ` (${filters.time_from || '00:00'} to ${filters.time_to || '23:59'})`;
  }
  doc.text(dateRange, 14, yPosition);
  yPosition += 5;

  if (filters.job_site_id) {
    doc.text(`Job Site: ${filters.job_site_id}`, 14, yPosition);
    yPosition += 5;
  }

  yPosition += 10;

  // Summary Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const summaryData = [
    ['Total Entries', report.summary.total_entries.toString()],
    ['Total Exits', report.summary.total_exits.toString()],
    ['Active Entries', report.summary.active_entries.toString()],
    ['Vehicles', report.summary.by_type.vehicles.toString()],
    ['Visitors', report.summary.by_type.visitors.toString()],
    ['Trucks', report.summary.by_type.trucks.toString()],
    ['Average Duration (minutes)', report.average_duration.toString()],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'striped',
    headStyles: {
      fillColor: [25, 118, 210],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 120, fontStyle: 'bold' },
      1: { cellWidth: 60, halign: 'right' },
    },
    margin: { top: yPosition, left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Peak Hours Section
  if (report.peak_hours.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Peak Hours', 14, yPosition);
    yPosition += 8;

    const peakHoursData = report.peak_hours.map((ph) => [`${ph.hour}:00`, ph.count.toString()]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Hour', 'Entry Count']],
      body: peakHoursData,
      theme: 'striped',
      headStyles: {
        fillColor: [25, 118, 210],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 90, halign: 'right' },
      },
      margin: { top: yPosition, left: 14, right: 14 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Daily Breakdown Section
  if (report.daily_breakdown.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Daily Breakdown', 14, yPosition);
    yPosition += 8;

    const dailyData = report.daily_breakdown.map((day) => [
      day.date,
      day.entries.toString(),
      day.exits.toString(),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Entries', 'Exits']],
      body: dailyData,
      theme: 'striped',
      headStyles: {
        fillColor: [25, 118, 210],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 60, halign: 'right' },
        2: { cellWidth: 60, halign: 'right' },
      },
      margin: { top: yPosition, left: 14, right: 14 },
    });
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.text(
    `Page ${doc.getCurrentPageInfo().pageNumber}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  return doc;
};

/**
 * Generate PDF for detailed entries
 */
export const generateEntriesPDF = (entries: any[], filters?: any): jsPDF => {
  const doc = new jsPDF('landscape'); // Landscape for more columns
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Security Access Management System', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('Detailed Entry Logs', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Report metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition);
  yPosition += 5;

  if (filters) {
    if (filters.date_from && filters.date_to) {
      let dateRange = `Date Range: ${filters.date_from} to ${filters.date_to}`;
      if (filters.time_from || filters.time_to) {
        dateRange += ` (${filters.time_from || '00:00'} to ${filters.time_to || '23:59'})`;
      }
      doc.text(dateRange, 14, yPosition);
      yPosition += 5;
    }
    if (filters.job_site_id) {
      doc.text(`Job Site: ${filters.job_site_id}`, 14, yPosition);
      yPosition += 5;
    }
  }

  yPosition += 5;

  // Calculate duration helper
  const calculateDuration = (entry: any): string => {
    if (!entry.exit_time) return 'N/A';
    const entryTime = new Date(entry.entry_time);
    const exitTime = new Date(entry.exit_time);
    const diffMs = exitTime.getTime() - entryTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return diffMins.toString();
  };

  // Table data
  const tableData = entries.map((entry) => {
    const data = entry.entry_data || {};
    return [
      entry.entry_type,
      (entry as any).job_site_name || 'N/A',
      entry.status,
      new Date(entry.entry_time).toLocaleString(),
      entry.exit_time ? new Date(entry.exit_time).toLocaleString() : 'N/A',
      calculateDuration(entry),
      (entry as any).guard_username || 'N/A',
      data.license_plate || data.name || 'N/A',
      data.driver_name || 'N/A',
      data.company || 'N/A',
      data.purpose || 'N/A',
    ];
  });

  // Generate table
  autoTable(doc, {
    startY: yPosition,
    head: [['Type', 'Job Site', 'Status', 'Entry Time', 'Exit Time', 'Duration (min)', 'Guard', 'License/Name', 'Driver', 'Company', 'Purpose']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [25, 118, 210],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7,
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 25 },
      2: { cellWidth: 15 },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
      5: { cellWidth: 18 },
      6: { cellWidth: 20 },
      7: { cellWidth: 25 },
      8: { cellWidth: 20 },
      9: { cellWidth: 25 },
      10: { cellWidth: 30 },
    },
    margin: { top: yPosition, left: 14, right: 14 },
  });

  // Footer
  doc.setFontSize(8);
  doc.text(
    `Total Entries: ${entries.length} | Page ${doc.getCurrentPageInfo().pageNumber}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  return doc;
};

