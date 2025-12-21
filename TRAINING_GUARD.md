# Security Access Management System - Guard Training Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Logging Entries](#logging-entries)
5. [Processing Exits](#processing-exits)
6. [Searching Entries](#searching-entries)
7. [Viewing Reports and Logs](#viewing-reports-and-logs)
8. [Managing Alerts](#managing-alerts)
9. [Emergency Procedures](#emergency-procedures)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Introduction

Welcome to the Security Access Management System (S.A.M.S.) training guide for guards. This system helps you track and manage vehicle and visitor access at job sites efficiently and securely.

### What You'll Learn
- How to log entries for vehicles, visitors, and trucks
- How to process exits for logged entries
- How to log manual exits for vehicles/trucks not logged in
- How to search and view entry history
- How to view and download reports and audit logs
- How to manage security alerts
- How to handle emergency situations

### System Requirements
- Modern web browser (Chrome, Firefox, Edge, or Safari)
- Internet connection
- Your login credentials provided by your administrator

---

## Getting Started

### Logging In

1. **Access the System**
   - Open your web browser
   - Navigate to the system URL provided by your administrator
   - You'll see the login page

2. **Enter Credentials**
   - Enter your username in the "Username" field
   - Enter your password in the "Password" field
   - Click the "Login" button

3. **First Login**
   - If this is your first login, you may be prompted to change your password
   - Follow the on-screen instructions

4. **Dashboard Access**
   - After successful login, you'll be taken to the Dashboard
   - The Dashboard shows real-time occupancy information for your assigned job sites

### Understanding Your Access

As a guard, you have access to:
- **Job Sites**: Only the job sites assigned to you by an administrator
- **Entry Logging**: Create new entries for vehicles, visitors, and trucks
- **Exit Processing**: Process exits for active entries
- **Manual Exits**: Log exits for vehicles/trucks not logged in
- **Search**: Search and view entry history
- **Reports**: Generate and download reports for your job sites
- **Audit Logs**: View and download audit logs for your job sites
- **Alerts**: View and manage security alerts
- **Emergency Mode**: Activate and manage emergency procedures

---

## Dashboard Overview

The Dashboard is your central hub for monitoring activity at your job sites.

### Dashboard Components

1. **Header Bar**
   - Shows the system logo
   - Displays your username and role
   - Logout button (top right)

2. **Real-time Occupancy Section**
   - Shows current occupancy for each job site you have access to
   - Displays:
     - Job site name
     - Current count of active entries
     - Capacity information
     - Entry breakdown by type (Vehicles, Visitors, Trucks)
   - Updates automatically in real-time

3. **Quick Actions Section**
   - **Log Entry**: Create a new entry
   - **Process Exit**: Process exits for active entries
   - **Search Entries**: Search entry history
   - **Audit Logs**: View system activity logs
   - **Reports**: Generate analytics reports
   - **Alerts**: View security alerts
   - **Emergency**: Access emergency mode
   - **My Documents**: View your HR documents

### Navigating the Dashboard

- Click any Quick Action card to navigate to that feature
- The Dashboard automatically refreshes to show current occupancy
- Use the browser's back button to return to the Dashboard

---

## Logging Entries

Logging entries is one of your primary responsibilities. You can log three types of entries: Vehicles, Visitors, and Trucks.

### Accessing Entry Logging

1. From the Dashboard, click the **"Log Entry"** card
2. Or use the navigation menu if available

### Selecting Job Site

1. **Job Site Dropdown**
   - Select the job site where the entry is occurring
   - You'll only see job sites you have access to
   - The dropdown is located at the top of the entry form

2. **Entry Type Tabs**
   - Click the appropriate tab: **Vehicle**, **Visitor**, or **Truck**
   - Each type has different required fields

### Logging a Vehicle Entry

**Required Fields:**
- **License Plate**: Enter the vehicle's license plate number (automatically converted to uppercase)

**Optional Fields:**
- **Vehicle Type**: Select from dropdown (Car, SUV, Van, etc.)
- **Driver Name**: Name of the driver
- **Company**: Company name if applicable
- **Purpose**: Reason for visit
- **Expected Duration**: Estimated stay duration

**Steps:**
1. Select "Vehicle" tab
2. Select the job site
3. Enter the license plate (required)
4. Fill in optional fields as needed
5. **Add Photos** (optional but recommended):
   - Click "Add Photos" button
   - Take photos using your device camera or upload from files
   - You can add multiple photos
   - Photos are automatically uploaded after entry creation
6. Click **"Submit Entry"** button
7. Wait for confirmation message

**Important Notes:**
- License plate is automatically converted to uppercase
- The system may autofill information from previous entries with the same license plate
- Photos are optional but highly recommended for security purposes
- Once submitted, the entry appears in the active entries list

### Logging a Visitor Entry

**Required Fields:**
- **Name**: Visitor's full name

**Optional Fields:**
- **Company**: Company name
- **Contact Phone**: Phone number
- **Purpose**: Reason for visit
- **Host Contact**: Name of person they're visiting
- **Expected Duration**: Estimated stay duration

**Steps:**
1. Select "Visitor" tab
2. Select the job site
3. Enter visitor's name (required)
4. Fill in optional fields
5. Add photos if needed
6. Click **"Submit Entry"** button

### Logging a Truck Entry

**Required Fields:**
- **License Plate**: Truck's license plate
- **Truck Number**: Company truck number

**Optional Fields:**
- **Trailer Number**: Trailer number if applicable
- **Company**: Company name
- **Driver Name**: Name of the driver
- **Cargo Description**: Description of cargo
- **Delivery/Pickup**: Select delivery or pickup
- **Expected Duration**: Estimated stay duration

**Steps:**
1. Select "Truck" tab
2. Select the job site
3. Enter license plate (required)
4. Enter truck number (required)
5. Fill in optional fields
6. Add photos if needed
7. Click **"Submit Entry"** button

### Photo Management

**Adding Photos:**
1. Click the **"Add Photos"** button
2. Choose an option:
   - **Take Photo**: Use your device camera
   - **Upload File**: Select from device storage
3. You can add multiple photos
4. Photos are automatically uploaded after entry creation
5. Photos cannot be added before entry submission

**Photo Guidelines:**
- Take clear, well-lit photos
- Include license plates, vehicle identification, or visitor faces
- Multiple angles are helpful
- Photos are stored securely and linked to the entry

### Entry Submission Process

1. **Validation**: System checks required fields
2. **Entry Creation**: Entry is created in the database
3. **Photo Upload**: If photos were added, they upload automatically
4. **Confirmation**: Success message appears
5. **Real-time Update**: Occupancy updates immediately
6. **Audit Log**: Entry is logged in audit trail

**Common Errors:**
- **Missing Required Fields**: Red error messages appear below fields
- **Job Site Not Selected**: Must select a job site before submitting
- **Photo Upload Failed**: Retry photo upload or submit without photos

---

## Processing Exits

Processing exits is how you record when vehicles, visitors, or trucks leave the job site.

### Accessing Exit Processing

1. From the Dashboard, click **"Process Exit"** card
2. You'll see the Exit Processing page

### Selecting Job Site

1. **Job Site Dropdown**
   - Select the job site you want to process exits for
   - You can switch between your accessible job sites
   - The list shows all active entries for the selected job site

### Viewing Active Entries

The Exit Processing page shows:
- **Type**: Entry type (Vehicle, Visitor, Truck)
- **Details**: License plate/name and driver/visitor name
- **Entry Time**: When the entry was logged
- **Duration**: How long the entry has been active
- **Actions**: "Process Exit" button

### Filtering Entries

1. **Entry Type Tabs**
   - **All**: Shows all entry types
   - **Vehicles**: Only vehicles
   - **Visitors**: Only visitors
   - **Trucks**: Only trucks

2. **Search Bar**
   - Located below the tabs
   - Search by:
     - License plate (for vehicles/trucks)
     - Driver name (for vehicles/trucks)
     - Visitor name (for visitors)
     - Company name (for all types)
   - Search is case-insensitive and works in real-time

### Processing an Exit

**Standard Exit Process:**
1. Find the entry in the list (use search if needed)
2. Click the **"Process Exit"** button for that entry
3. Review the exit confirmation dialog:
   - Entry type
   - Details (license plate, name, etc.)
   - Entry time
   - Duration
4. Click **"Confirm Exit"** button
5. Entry is marked as exited
6. Occupancy updates automatically

**Manual Override:**
- Use when you need to exit an entry with special circumstances
- Click **"Manual Override"** toggle in the exit dialog
- Enter a reason for the override (required)
- Click **"Confirm Exit"**
- Entry is marked as "emergency_exit" status

### Logging Manual Exits

Sometimes vehicles or trucks leave without being logged in. You can log these as manual exits.

**Accessing Manual Exit:**
1. On the Exit Processing page, click **"Log Manual Exit"** button (top right)
2. A form dialog opens

**For Vehicles:**
1. Select "Vehicle" from Entry Type dropdown
2. Enter **License Plate** (required)
3. Optional fields:
   - Trailer Number
   - Driver Name
   - Company
4. Click **"Log Exit"**

**For Trucks:**
1. Select "Truck" from Entry Type dropdown
2. Enter **License Plate** (required)
3. Enter **Truck Number** (required)
4. Optional fields:
   - Trailer Number
   - **Destination**: Select North or South (important for tracking)
   - Driver Name
   - Company
   - Cargo Description
5. Click **"Log Exit"**

**Important Notes:**
- Manual exits create entries with exit_time set immediately
- These entries appear in search results with status "exited"
- Use manual exits when vehicles/trucks weren't logged in but need to be recorded
- Destination field (North/South) is important for truck tracking

---

## Searching Entries

The Search feature allows you to find and view historical entries.

### Accessing Search

1. From the Dashboard, click **"Search Entries"** card
2. Or use the search page directly

### Quick Search

**Quick Search Bar:**
- Located at the top of the search page
- Searches across multiple fields:
  - License plates
  - Names (visitor/driver)
  - Company names
- Type your search term and press Enter or click the search icon
- Results appear immediately

### Advanced Filters

Use advanced filters for precise searches:

1. **License Plate**: Exact or partial license plate match
2. **Name**: Visitor or driver name
3. **Company**: Company name
4. **Job Site**: Filter by specific job site (only shows your accessible sites)
5. **Entry Type**: Vehicle, Visitor, or Truck
6. **Status**: Active, Exited, or Emergency Exit
7. **Date From**: Start date for date range
8. **Date To**: End date for date range

**Using Advanced Filters:**
1. Fill in the fields you want to filter by
2. Click **"Search"** button
3. Results appear in a table below
4. Click **"Clear"** to reset all filters

### Viewing Search Results

**Results Table Shows:**
- Type: Entry type badge
- Details: License plate/name and driver/visitor
- Job Site: Job site name
- Entry Time: When entry was logged
- Status: Active, Exited, or Emergency Exit (color-coded)

**Viewing Entry Details:**
1. Click the **eye icon** (👁️) in the Actions column
2. A dialog opens showing:
   - Full entry information
   - Entry data (all fields)
   - **Photos**: If photos were attached, they appear here
   - You can click photos to view full size
3. Click **"Close"** to return to search results

**Pagination:**
- If there are many results, use pagination at the bottom
- Click page numbers to navigate
- Shows current page and total pages

### Exporting Search Results

Search results can be exported through the Reports feature (see Reports section).

---

## Viewing Reports and Logs

As a guard, you can generate reports and view audit logs for your accessible job sites.

### Accessing Reports

1. From the Dashboard, click **"Reports"** card
2. You'll see the Reports & Analytics page

### Generating Reports

**Setting Up Report Filters:**

1. **Job Site**: 
   - Select a specific job site or "All Job Sites"
   - You'll only see job sites you have access to

2. **Entry Type**:
   - All Types, Vehicle, Visitor, or Truck

3. **Date From**: 
   - Select start date using date picker

4. **Date To**: 
   - Select end date using date picker

5. **Time From** (optional):
   - Select start time (e.g., 8:00 AM)
   - Useful for specific timeframes like "8am to 8pm"

6. **Time To** (optional):
   - Select end time (e.g., 8:00 PM)

**Generating the Report:**
1. Set your filters
2. Click **"Generate Report"** button
3. Wait for the report to load
4. View analytics and charts

### Understanding Reports

**Summary Cards:**
- **Total Entries**: Number of entries in the date range
- **Total Exits**: Number of completed exits
- **Active Entries**: Currently active entries
- **Average Duration**: Average time entries stayed (in minutes)

**Charts:**
- **Entries by Type**: Bar chart showing breakdown of vehicles, visitors, and trucks
- **Peak Hours**: Bar chart showing busiest hours of the day
- **Daily Breakdown**: Line chart showing entries and exits per day

**Job Site Breakdown Table:**
- Shows entries and exits per job site (if multiple sites selected)

### Exporting Reports

**Export Summary CSV:**
1. Generate a report first
2. Click **"Export Summary CSV"** button
3. File downloads automatically
4. Contains summary statistics and charts data

**Download Detailed Logs:**
1. Generate a report first
2. Click **"Download Detailed Logs"** button
3. File downloads with filename like `detailed-logs-2024-01-15-1234567890.csv`
4. Contains all entry details including:
   - Entry ID, Job Site, Type, Status
   - Entry Time, Exit Time, Duration
   - Guard username
   - License Plate, Driver Name, Visitor Name
   - Company, Purpose
   - Vehicle details (Make, Model, Color)
   - Contact information
   - Notes

**Use Cases:**
- Client reports: Export detailed logs for specific timeframes
- Daily summaries: Generate daily reports
- Time-specific reports: Use time filters for shifts (e.g., 8am-8pm)
- Company records: Export for record-keeping

### Viewing Audit Logs

**Accessing Audit Logs:**
1. From the Dashboard, click **"Audit Logs"** card
2. You'll see the Audit Logs page

**Understanding Audit Logs:**
- Shows all system activity related to your accessible job sites
- Each log entry shows:
  - **Timestamp**: When the action occurred
  - **User**: Who performed the action
  - **Action**: What action was taken (create_entry, exit, etc.)
  - **Resource Type**: Type of resource (entry, user, etc.)
  - **Resource ID**: ID of the affected resource
  - **Details**: Additional information (JSON format)

**Filtering Audit Logs:**
1. **User**: Filter by specific user
2. **Action**: Filter by action type
3. **Resource Type**: Filter by resource type
4. **Date From/To**: Filter by date range
5. Click **"Search"** or use filters in real-time
6. Click **"Clear"** to reset filters

**Viewing Entry Details from Logs:**
1. If a log is related to an entry (resource_type = "entry")
2. Click the log entry
3. Dialog shows log details
4. If the entry has photos, they appear in the dialog
5. Click **"Close"** when done

**Exporting Audit Logs:**
1. Set your filters (optional)
2. Click **"Export CSV"** button
3. File downloads with all filtered logs
4. Contains: ID, Timestamp, User, Action, Resource Type, Resource ID, Details

**Pagination:**
- Audit logs are paginated (50 per page by default)
- Use pagination controls at the bottom to navigate

---

## Managing Alerts

The Alerts system helps you stay informed about security-related events.

### Accessing Alerts

1. From the Dashboard, click **"Alerts"** card
2. You'll see the Alerts page

### Understanding Alert Types

**Watchlist Matches:**
- Triggered when a vehicle, visitor, or truck matches an entry in the watchlist
- Shows matching criteria (license plate, name, etc.)
- Requires immediate attention

**Capacity Warnings:**
- Triggered when a job site approaches or exceeds capacity
- Helps prevent overcrowding

**Other Alerts:**
- Various security-related alerts as configured by administrators

### Viewing Alerts

**Alert List Shows:**
- Alert type and severity
- Job site affected
- Timestamp
- Status (Active, Acknowledged, Resolved)
- Details

**Alert Actions:**
1. **Acknowledge**: Mark alert as acknowledged
2. **Resolve**: Mark alert as resolved (if you have permission)
3. **View Details**: Click to see full alert information

### Responding to Alerts

**Watchlist Match:**
1. Review the alert details
2. Check the matching entry
3. Follow your site's security procedures
4. Acknowledge or resolve the alert
5. Document any actions taken

**Capacity Warning:**
1. Review current occupancy
2. Consider delaying new entries if at capacity
3. Notify supervisor if needed
4. Acknowledge the alert

---

## Emergency Procedures

The Emergency Mode feature allows you to handle emergency situations quickly.

### Accessing Emergency Mode

1. From the Dashboard, click **"Emergency"** card
2. You'll see the Emergency Management page

### Understanding Emergency Mode

**What Emergency Mode Does:**
- Disables normal entry processing
- Allows bulk exit processing
- Tracks emergency exits separately
- Provides emergency-specific reporting

### Activating Emergency Mode

**Note**: Only administrators can activate emergency mode. As a guard, you can:
- View active emergency modes
- Process exits during emergency mode
- See emergency-specific information

### Processing Exits During Emergency

During emergency mode:
1. Normal entry logging is disabled
2. You can still process exits
3. Exits are marked as "emergency_exit" status
4. Bulk exit options may be available (admin only)

### Deactivating Emergency Mode

Emergency mode must be deactivated by an administrator.

---

## Best Practices

### Entry Logging Best Practices

1. **Always Take Photos**
   - Photos provide visual evidence
   - Help identify vehicles/visitors later
   - Required for security audits

2. **Complete All Fields**
   - Fill in optional fields when possible
   - More complete data = better reporting
   - Helps with future searches

3. **Verify Information**
   - Double-check license plates
   - Confirm names and company information
   - Ensure job site is correct

4. **Use Consistent Formatting**
   - License plates are auto-uppercased
   - Use full names, not nicknames
   - Standardize company names

### Exit Processing Best Practices

1. **Process Exits Promptly**
   - Don't delay exit processing
   - Accurate duration tracking requires timely exits
   - Helps maintain accurate occupancy

2. **Use Search When Needed**
   - If you can't find an entry, use search
   - Search by license plate or name
   - Check different job sites if applicable

3. **Manual Exits for Unlogged Vehicles**
   - Always log manual exits for vehicles that weren't logged in
   - Include as much information as possible
   - Mark truck destinations (North/South) when applicable

4. **Document Overrides**
   - Use manual override only when necessary
   - Always provide a clear reason
   - Overrides are logged in audit trail

### Search and Reporting Best Practices

1. **Use Specific Date Ranges**
   - Narrow date ranges for faster searches
   - Use time filters for shift-specific reports
   - Export only what you need

2. **Regular Report Generation**
   - Generate daily/weekly reports as needed
   - Export for client records
   - Keep reports organized

3. **Review Audit Logs Regularly**
   - Check logs for your activities
   - Verify entries and exits are recorded correctly
   - Export logs for record-keeping

### Security Best Practices

1. **Protect Your Credentials**
   - Never share your password
   - Log out when finished
   - Report suspicious activity

2. **Verify Before Processing**
   - Double-check entry details before exit
   - Verify license plates match
   - Confirm job site is correct

3. **Follow Site Procedures**
   - Adhere to your site's security protocols
   - Respond to alerts promptly
   - Document unusual situations

---

## Troubleshooting

### Common Issues and Solutions

**Problem: Can't Log In**
- **Solution**: Verify username and password are correct
- **Solution**: Check if account is locked (contact administrator)
- **Solution**: Clear browser cache and try again

**Problem: Can't See Expected Job Sites**
- **Solution**: You only see job sites assigned to you
- **Solution**: Contact administrator to verify your access
- **Solution**: Refresh the page

**Problem: Photos Won't Upload**
- **Solution**: Check internet connection
- **Solution**: Ensure photos aren't too large
- **Solution**: Try submitting entry without photos, then add photos later
- **Solution**: Check browser permissions for camera/file access

**Problem: Can't Find an Entry**
- **Solution**: Use the search function with license plate or name
- **Solution**: Check if entry is at a different job site
- **Solution**: Verify date range in search filters
- **Solution**: Check if entry was already exited

**Problem: Exit Button Not Working**
- **Solution**: Ensure entry is still active (not already exited)
- **Solution**: Verify you have access to that job site
- **Solution**: Refresh the page and try again

**Problem: Report Not Generating**
- **Solution**: Verify date range is valid (from date before to date)
- **Solution**: Check if you have entries in that date range
- **Solution**: Ensure job site is selected if filtering by site

**Problem: Can't View Photos**
- **Solution**: Photos may take time to load
- **Solution**: Check internet connection
- **Solution**: Try refreshing the page
- **Solution**: Contact administrator if photos consistently fail

### Getting Help

**Contact Your Administrator:**
- For access issues
- For technical problems
- For questions about procedures
- For account lockouts

**System Information to Provide:**
- Your username
- Job site(s) you have access to
- Description of the problem
- Steps you've already tried
- Screenshots if possible

---

## Quick Reference

### Keyboard Shortcuts
- **Enter**: Submit forms, trigger search
- **Tab**: Navigate between form fields
- **Escape**: Close dialogs

### Required Fields Quick Reference

**Vehicle Entry:**
- License Plate ✓

**Visitor Entry:**
- Name ✓

**Truck Entry:**
- License Plate ✓
- Truck Number ✓

**Manual Exit (Vehicle):**
- License Plate ✓

**Manual Exit (Truck):**
- License Plate ✓
- Truck Number ✓

### Status Types
- **Active**: Entry is currently active (not exited)
- **Exited**: Entry has been processed for exit
- **Emergency Exit**: Entry was exited during emergency mode or with override

### Entry Types
- **Vehicle**: Cars, SUVs, vans, motorcycles
- **Visitor**: Pedestrians, walk-ins
- **Truck**: Commercial trucks, delivery vehicles

---

## Conclusion

You now have a comprehensive understanding of the Security Access Management System as a guard. Remember to:
- Log entries accurately and completely
- Process exits promptly
- Use search and reports effectively
- Follow security best practices
- Contact your administrator with questions

For additional training or questions, contact your system administrator.

---

**Last Updated**: 2024-12-21
**Version**: 1.0.0




