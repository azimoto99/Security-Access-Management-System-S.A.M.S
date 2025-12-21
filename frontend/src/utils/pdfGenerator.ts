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

  // Handle empty entries
  if (!entries || entries.length === 0) {
    doc.setFontSize(12);
    doc.text('No entries found for the selected date range.', pageWidth / 2, yPosition + 20, { align: 'center' });
    return doc;
  }

  // Calculate duration helper
  const calculateDuration = (entry: any): string => {
    if (!entry.exit_time || !entry.entry_time) return 'N/A';
    try {
      const entryTime = new Date(entry.entry_time);
      const exitTime = new Date(entry.exit_time);
      const diffMs = exitTime.getTime() - entryTime.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins.toString();
    } catch (e) {
      return 'N/A';
    }
  };

  // Helper to parse entry_data (might be string or object)
  const parseEntryData = (entryData: any): any => {
    if (!entryData) return {};
    if (typeof entryData === 'string') {
      try {
        return JSON.parse(entryData);
      } catch (e) {
        return {};
      }
    }
    return entryData || {};
  };

  // Table data
  const tableData = entries.map((entry) => {
    const data = parseEntryData(entry.entry_data);
    // Get entry trailer (original) and exit trailer (if updated on exit)
    const entryTrailer = data.entry_trailer_number || data.trailer_number || 'N/A';
    // Exit trailer: use exit_trailer_number if set, otherwise use entry trailer if exited, or 'N/A' if not exited
    const exitTrailer = data.exit_trailer_number 
      ? data.exit_trailer_number 
      : (entry.exit_time ? entryTrailer : 'N/A');
    
    try {
      return [
        entry.entry_type || 'N/A',
        (entry as any).job_site_name || 'N/A',
        entry.status || 'N/A',
        entry.entry_time ? new Date(entry.entry_time).toLocaleString() : 'N/A',
        entry.exit_time ? new Date(entry.exit_time).toLocaleString() : 'N/A',
        calculateDuration(entry),
        (entry as any).guard_username || 'N/A',
        data.license_plate || data.name || 'N/A',
        data.truck_number || 'N/A',
        entryTrailer,
        exitTrailer,
        data.driver_name || 'N/A',
        data.company || 'N/A',
        data.purpose || 'N/A',
      ];
    } catch (e) {
      // Return a row with error indicator if something goes wrong
      return [
        'ERROR',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A',
      ];
    }
  });

  // Generate table
  // Use compact column widths that fit within landscape page
  autoTable(doc, {
    startY: yPosition,
    head: [['Type', 'Job Site', 'Status', 'Entry Time', 'Exit Time', 'Dur', 'Guard', 'License/Name', 'Truck', 'Entry Trailer', 'Exit Trailer', 'Driver', 'Company', 'Purpose']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [25, 118, 210],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 6,
    },
    styles: {
      fontSize: 6,
      cellPadding: 0.8,
    },
    columnStyles: {
      0: { cellWidth: 7 }, // Type
      1: { cellWidth: 14 }, // Job Site
      2: { cellWidth: 7 }, // Status
      3: { cellWidth: 18 }, // Entry Time
      4: { cellWidth: 18 }, // Exit Time
      5: { cellWidth: 8 }, // Duration
      6: { cellWidth: 10 }, // Guard
      7: { cellWidth: 14 }, // License/Name
      8: { cellWidth: 10 }, // Truck #
      9: { cellWidth: 10 }, // Entry Trailer
      10: { cellWidth: 10 }, // Exit Trailer
      11: { cellWidth: 10 }, // Driver
      12: { cellWidth: 14 }, // Company
      13: { cellWidth: 18 }, // Purpose
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

