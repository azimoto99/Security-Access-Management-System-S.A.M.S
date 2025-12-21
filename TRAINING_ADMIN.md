# Security Access Management System - Administrator Training Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [User Management](#user-management)
5. [Job Site Management](#job-site-management)
6. [Entry and Exit Management](#entry-and-exit-management)
7. [Watchlist Management](#watchlist-management)
8. [Alerts Management](#alerts-management)
9. [Reports and Analytics](#reports-and-analytics)
10. [Audit Logs](#audit-logs)
11. [Emergency Management](#emergency-management)
12. [HR Document Management](#hr-document-management)
13. [System Configuration](#system-configuration)
14. [Best Practices](#best-practices)
15. [Troubleshooting](#troubleshooting)

---

## Introduction

Welcome to the Security Access Management System (S.A.M.S.) administrator training guide. As an administrator, you have full access to all system features and are responsible for managing users, job sites, security settings, and system configuration.

### What You'll Learn
- User account management and role assignment
- Job site creation and configuration
- Watchlist and security alert management
- Comprehensive reporting and analytics
- Emergency mode activation and management
- HR document management with DocuSign
- System monitoring and audit trail review
- Advanced search and filtering capabilities

### Administrator Responsibilities
- Create and manage user accounts
- Assign job site access to guards
- Configure and manage job sites
- Monitor security alerts and watchlist
- Generate reports for management
- Handle emergency situations
- Manage HR documents and employee onboarding
- Review audit logs for compliance
- System configuration and maintenance

---

## Getting Started

### Logging In

1. **Access the System**
   - Navigate to the system URL
   - You'll see the login page

2. **Enter Credentials**
   - Enter your administrator username
   - Enter your password
   - Click "Login"

3. **First Login**
   - Change default password immediately
   - Set up security questions if prompted
   - Review system settings

### Administrator Access

As an administrator, you have access to:
- **All Features**: Full access to every system feature
- **All Job Sites**: Can view and manage all job sites
- **User Management**: Create, edit, and delete users
- **System Configuration**: Configure security settings
- **Emergency Mode**: Activate and manage emergency procedures
- **All Reports**: Generate reports for any job site or date range
- **All Audit Logs**: View complete system audit trail
- **Watchlist Management**: Add and manage watchlist entries
- **HR Management**: Manage documents and employee onboarding

---

## Dashboard Overview

The Dashboard provides a comprehensive overview of all system activity.

### Dashboard Components

1. **Header Bar**
   - System logo
   - Your username and role (Admin)
   - Logout button

2. **Real-time Occupancy Section**
   - Shows occupancy for ALL job sites
   - Displays:
     - Job site name
     - Current active entries count
     - Capacity information
     - Breakdown by entry type
   - Updates in real-time via WebSocket

3. **Quick Actions Section**
   - **Log Entry**: Create entries (same as guards)
   - **Process Exit**: Process exits (same as guards)
   - **Search Entries**: Advanced search across all sites
   - **Job Sites**: Manage job sites
   - **Users**: Manage user accounts
   - **Audit Logs**: View complete audit trail
   - **Reports**: Generate comprehensive reports
   - **Watchlist**: Manage security watchlist
   - **Alerts**: View and manage all alerts
   - **HR Docs**: Manage HR documents and DocuSign
   - **Emergency**: Activate emergency mode

---

## User Management

User management is a core administrative function. You can create, edit, and manage all user accounts.

### Accessing User Management

1. From Dashboard, click **"Users"** card
2. You'll see the User Management page

### Viewing Users

**User List Shows:**
- Username
- Role (Admin, Guard, Employee)
- Employee ID (if applicable)
- Job Site Access (number of sites)
- Status (Active/Inactive)
- Created Date
- Actions (Edit, Delete)

**Filtering Users:**
- Use search bar to find specific users
- Filter by role using dropdown
- Filter by status (Active/Inactive)

### Creating a New User

**Steps:**
1. Click **"Add User"** button
2. Fill in the user form:

   **Required Fields:**
   - **Username**: Unique username (minimum 3 characters)
   - **Password**: Secure password (minimum 8 characters)
   - **Role**: Select from dropdown:
     - **Admin**: Full system access
     - **Guard**: Entry/exit logging, limited access
     - **Employee**: HR document access only

   **Optional Fields:**
   - **Employee ID**: Company employee ID
   - **Job Site Access**: Select job sites this user can access
     - For Guards: Select one or more job sites
     - For Admins: Access to all sites (no selection needed)
     - For Employees: Usually no job site access needed

3. Click **"Create User"** button
4. User is created and can log in immediately

**Best Practices:**
- Use descriptive usernames (e.g., firstname.lastname)
- Set strong passwords initially
- Assign appropriate job sites to guards
- Document employee IDs for HR integration

### Editing a User

**Steps:**
1. Find the user in the list
2. Click **"Edit"** button (pencil icon)
3. Modify fields:
   - Can change username, role, employee ID
   - Can add/remove job site access
   - Password field: Leave blank to keep current password, or enter new password
4. Click **"Update User"** button

**Common Edits:**
- **Adding Job Site Access**: Select additional job sites
- **Removing Job Site Access**: Deselect job sites
- **Changing Role**: Update user's role (be careful with admin role)
- **Resetting Password**: Enter new password in password field

### Deactivating/Activating Users

**Deactivating:**
1. Click **"Edit"** for the user
2. Change status to "Inactive"
3. User cannot log in while inactive
4. User's data is preserved

**Activating:**
1. Click **"Edit"** for inactive user
2. Change status to "Active"
3. User can log in again

### Deleting Users

**Warning**: Deleting a user is permanent and cannot be undone.

**Steps:**
1. Click **"Delete"** button (trash icon)
2. Confirm deletion in dialog
3. User account is permanently removed
4. User's entries and logs are preserved (linked by user ID)

**When to Delete:**
- User no longer works for the company
- Duplicate accounts
- Test accounts

**When NOT to Delete:**
- Active users (deactivate instead)
- Users with important historical data (deactivate instead)

### Bulk User Operations

**Exporting User List:**
- User data can be exported through reports
- Use Reports feature to generate user activity reports

---

## Job Site Management

Job sites are the locations where entries and exits are tracked. You can create, edit, and manage all job sites.

### Accessing Job Site Management

1. From Dashboard, click **"Job Sites"** card
2. You'll see the Job Site Management page

### Viewing Job Sites

**Job Site List Shows:**
- Site Name
- Address
- Capacity (maximum entries)
- Status (Active/Inactive)
- Created Date
- Actions (Edit, Delete)

### Creating a New Job Site

**Steps:**
1. Click **"Add Job Site"** button
2. Fill in the form:

   **Required Fields:**
   - **Name**: Job site name (e.g., "Main Warehouse", "Construction Site A")
   - **Address**: Physical address
   - **Capacity**: Maximum number of active entries allowed
     - Set to 0 for unlimited capacity
     - Used for capacity warnings and alerts

   **Optional Fields:**
   - **Description**: Additional details about the site
   - **Contact Information**: Site contact details

3. Click **"Create Job Site"** button
4. Site is created and immediately available for entry logging

**Best Practices:**
- Use clear, descriptive names
- Set realistic capacity limits
- Include complete address information
- Add contact information for reference

### Editing a Job Site

**Steps:**
1. Find the job site in the list
2. Click **"Edit"** button
3. Modify fields:
   - Can change name, address, capacity
   - Can update description and contact info
   - Can activate/deactivate site
4. Click **"Update Job Site"** button

**Common Edits:**
- **Updating Capacity**: Adjust based on site changes
- **Changing Address**: Update if site relocates
- **Deactivating**: Temporarily disable site (prevents new entries)

### Deactivating Job Sites

**When to Deactivate:**
- Site is temporarily closed
- Site is being relocated
- Site is no longer in use (but keep for historical data)

**Steps:**
1. Edit the job site
2. Change status to "Inactive"
3. Site no longer appears in entry logging dropdowns
4. Historical data is preserved

**Note**: Deactivating a site doesn't affect active entries. You may need to process exits for active entries first.

### Deleting Job Sites

**Warning**: Deleting a job site is permanent and affects all associated entries.

**Steps:**
1. Ensure no active entries exist for the site
2. Click **"Delete"** button
3. Confirm deletion
4. Site and all associated data are removed

**When to Delete:**
- Site was created by mistake
- Site is permanently closed and data cleanup is required

**When NOT to Delete:**
- Site has historical entries (deactivate instead)
- Site may be used again in the future

---

## Entry and Exit Management

As an administrator, you can perform all entry and exit operations that guards can, plus additional capabilities.

### Logging Entries

**Same as Guards:**
- Log vehicle, visitor, and truck entries
- Add photos to entries
- Select any job site (not limited to assigned sites)
- All entry types and fields available

**Additional Capabilities:**
- Can log entries for any job site
- Can view and process exits for any job site
- Can search across all job sites

### Processing Exits

**Same as Guards:**
- Process exits for active entries
- Use manual override when needed
- Log manual exits for unlogged vehicles/trucks

**Additional Capabilities:**
- Can process exits for any job site
- Can view all active entries across all sites
- Can search and process exits from any site

### Advanced Search

**Cross-Site Search:**
- Search across ALL job sites
- Filter by any job site or all sites
- View entries from any site in search results

**All Other Features:**
- Same search capabilities as guards
- Advanced filtering options
- Export capabilities through reports

---

## Watchlist Management

The watchlist is a security feature that alerts you when specific vehicles, visitors, or trucks attempt to enter.

### Accessing Watchlist

1. From Dashboard, click **"Watchlist"** card
2. You'll see the Watchlist Management page

### Understanding Watchlist

**Purpose:**
- Track vehicles, visitors, or trucks that require special attention
- Generate alerts when matches occur
- Maintain security blacklist/whitelist

**Match Types:**
- **License Plate**: Exact or partial match
- **Name**: Visitor or driver name
- **Company**: Company name
- **Truck Number**: Company truck number

### Viewing Watchlist Entries

**Watchlist Shows:**
- Type (Vehicle, Visitor, Truck)
- Match Criteria (what to match against)
- Reason/Notes
- Created Date
- Status (Active/Inactive)
- Actions (Edit, Delete)

### Adding Watchlist Entry

**Steps:**
1. Click **"Add to Watchlist"** button
2. Fill in the form:

   **Required Fields:**
   - **Type**: Vehicle, Visitor, or Truck
   - **Match Criteria**: 
     - For Vehicle: License plate
     - For Visitor: Name
     - For Truck: License plate or truck number
   - **Reason**: Why this entry is on the watchlist

   **Optional Fields:**
   - **Notes**: Additional information
   - **Alert Level**: Severity of alert (if configured)

3. Click **"Add to Watchlist"** button
4. Entry is added and will trigger alerts on matches

**Best Practices:**
- Use specific match criteria (exact license plates work best)
- Provide clear reasons for watchlist entries
- Review and update watchlist regularly
- Remove entries when no longer needed

### Editing Watchlist Entry

**Steps:**
1. Find the entry in the list
2. Click **"Edit"** button
3. Modify fields as needed
4. Click **"Update"** button

### Deactivating Watchlist Entry

**Steps:**
1. Edit the watchlist entry
2. Change status to "Inactive"
3. Entry remains in list but won't trigger alerts
4. Historical alerts are preserved

### Deleting Watchlist Entry

**Steps:**
1. Click **"Delete"** button
2. Confirm deletion
3. Entry is permanently removed

---

## Alerts Management

The alerts system notifies you of security events and system issues.

### Accessing Alerts

1. From Dashboard, click **"Alerts"** card
2. You'll see the Alerts Management page

### Alert Types

**Watchlist Matches:**
- Triggered when entry matches watchlist criteria
- Shows matching entry details
- Requires immediate review

**Capacity Warnings:**
- Triggered when job site approaches capacity
- Shows current occupancy vs. capacity
- Helps prevent overcrowding

**System Alerts:**
- Various system-level alerts
- Configuration issues
- Performance warnings

### Viewing Alerts

**Alert List Shows:**
- Alert Type
- Severity (High, Medium, Low)
- Job Site (if applicable)
- Timestamp
- Status (Active, Acknowledged, Resolved)
- Details

**Filtering Alerts:**
- Filter by type
- Filter by status
- Filter by severity
- Filter by job site
- Filter by date range

### Managing Alerts

**Acknowledging Alerts:**
1. Click on alert to view details
2. Click **"Acknowledge"** button
3. Alert status changes to "Acknowledged"
4. Alert remains visible but marked as reviewed

**Resolving Alerts:**
1. After taking appropriate action
2. Click **"Resolve"** button
3. Alert status changes to "Resolved"
4. Resolved alerts can be filtered out

**Bulk Operations:**
- Acknowledge multiple alerts
- Resolve multiple alerts
- Export alert history

### Alert Configuration

**Capacity Alert Thresholds:**
- Configure when capacity warnings trigger
- Set percentage thresholds (e.g., 80%, 90%, 100%)
- Configure per job site if needed

---

## Reports and Analytics

As an administrator, you have access to comprehensive reporting and analytics across all job sites.

### Accessing Reports

1. From Dashboard, click **"Reports"** card
2. You'll see the Reports & Analytics page

### Generating Reports

**Report Filters:**

1. **Job Site**:
   - Select specific job site or "All Job Sites"
   - Can generate reports for any site

2. **Entry Type**:
   - All Types, Vehicle, Visitor, or Truck

3. **Date Range**:
   - **Date From**: Start date
   - **Date To**: End date
   - **Time From**: Start time (optional, e.g., 8:00 AM)
   - **Time To**: End time (optional, e.g., 8:00 PM)

**Generating Report:**
1. Set all desired filters
2. Click **"Generate Report"** button
3. Report loads with analytics and charts

### Report Components

**Summary Statistics:**
- Total Entries
- Total Exits
- Active Entries
- Average Duration
- Breakdown by type (Vehicles, Visitors, Trucks)

**Visualizations:**
- **Entries by Type**: Bar chart
- **Peak Hours**: Bar chart showing busiest hours
- **Daily Breakdown**: Line chart showing trends over time
- **Job Site Breakdown**: Table comparing sites (if multiple selected)

### Exporting Reports

**Export Summary CSV:**
- Contains summary statistics
- Chart data
- Suitable for presentations

**Download Detailed Logs:**
- Complete entry details
- All fields for each entry
- Suitable for client reports and record-keeping
- Includes: Entry ID, Job Site, Type, Status, Times, Duration, Guard, License Plate, Names, Company, Purpose, Vehicle Details, Contact Info, Notes

**Use Cases:**
- **Client Reports**: Export detailed logs for specific timeframes
- **Management Reports**: Summary reports for executives
- **Compliance**: Detailed logs for regulatory requirements
- **Analysis**: Data for further analysis in Excel/other tools

### Advanced Reporting

**Custom Date Ranges:**
- Use time filters for shift-specific reports (e.g., 8am-8pm)
- Generate reports for specific days, weeks, or months
- Compare different time periods

**Multi-Site Reports:**
- Generate reports across multiple job sites
- Compare activity between sites
- Aggregate statistics

---

## Audit Logs

The audit log provides a complete record of all system activity for compliance and security purposes.

### Accessing Audit Logs

1. From Dashboard, click **"Audit Logs"** card
2. You'll see the Audit Logs page

### Understanding Audit Logs

**What's Logged:**
- All entry creations and exits
- User account changes
- Job site modifications
- Watchlist changes
- Alert acknowledgments
- System configuration changes
- And more...

**Log Entry Contains:**
- **Timestamp**: Exact time of action
- **User**: Who performed the action
- **Action**: What action was taken
- **Resource Type**: Type of resource affected
- **Resource ID**: ID of the resource
- **Details**: Additional information (JSON format)

### Filtering Audit Logs

**Available Filters:**
- **User**: Filter by specific user
- **Action**: Filter by action type (create_entry, exit, etc.)
- **Resource Type**: Filter by resource type (entry, user, etc.)
- **Date Range**: Filter by date from/to

**Using Filters:**
1. Set desired filters
2. Results update automatically
3. Use "Clear" to reset all filters

### Viewing Entry Details from Logs

**Steps:**
1. Find log entry related to an entry (resource_type = "entry")
2. Click on the log entry
3. Dialog shows:
   - Complete log details
   - Related entry information
   - Photos if available
4. Click "Close" when done

### Exporting Audit Logs

**Steps:**
1. Set filters if needed (optional)
2. Click **"Export CSV"** button
3. File downloads with all filtered logs
4. Contains: ID, Timestamp, User, Action, Resource Type, Resource ID, Details

**Use Cases:**
- **Compliance Audits**: Export logs for regulatory reviews
- **Security Investigations**: Review suspicious activity
- **Performance Analysis**: Analyze system usage patterns
- **Record Keeping**: Maintain audit trail archives

### Audit Log Best Practices

1. **Regular Reviews**: Review logs regularly for anomalies
2. **Export Regularly**: Export logs for archival purposes
3. **Monitor User Activity**: Review user actions for security
4. **Investigate Alerts**: Use logs to investigate security alerts
5. **Compliance**: Maintain logs for compliance requirements

---

## Emergency Management

Emergency mode allows you to quickly handle emergency situations that require immediate action.

### Accessing Emergency Management

1. From Dashboard, click **"Emergency"** card
2. You'll see the Emergency Management page

### Understanding Emergency Mode

**What Emergency Mode Does:**
- Disables normal entry processing
- Allows bulk exit processing
- Tracks emergency exits separately
- Provides emergency-specific reporting
- Can be activated per job site

### Activating Emergency Mode

**Steps:**
1. Navigate to Emergency Management page
2. Select the job site from dropdown
3. Click **"Activate Emergency Mode"** button
4. Confirm activation in dialog
5. Emergency mode is now active for that job site

**What Happens:**
- Normal entry logging is disabled for that site
- Guards see emergency mode notification
- Bulk exit options become available
- All exits are marked as "emergency_exit"

### Managing Active Emergency Modes

**Viewing Active Modes:**
- List shows all active emergency modes
- Displays job site, activation time, activated by
- Shows current occupancy

**Processing Bulk Exits:**
1. Select emergency mode from list
2. Click **"Process Bulk Exit"** button
3. Select job site (if multiple sites in emergency)
4. Confirm bulk exit
5. All active entries are marked as emergency exits
6. Occupancy resets to zero

**Warning**: Bulk exit affects ALL active entries. Use with caution.

### Deactivating Emergency Mode

**Steps:**
1. Find active emergency mode in list
2. Click **"Deactivate"** button
3. Confirm deactivation
4. Normal entry processing resumes
5. Emergency mode is logged in audit trail

**When to Deactivate:**
- Emergency situation is resolved
- Normal operations can resume
- After bulk exit has been processed

### Emergency Mode Best Practices

1. **Activate Promptly**: Activate immediately when emergency occurs
2. **Communicate**: Notify guards and staff of emergency mode
3. **Process Exits**: Use bulk exit if needed to clear site
4. **Document**: Document reason for emergency mode activation
5. **Deactivate Promptly**: Deactivate when emergency is resolved
6. **Review**: Review emergency mode usage in reports

---

## HR Document Management

The HR Document Management system integrates with DocuSign for electronic document signing and employee onboarding.

### Accessing HR Management

1. From Dashboard, click **"HR Docs"** card
2. You'll see the HR Document Management page

### Understanding HR Documents

**Document Types:**
- Employment contracts
- Policy acknowledgments
- Training certificates
- Compliance documents
- And more...

**Workflow:**
1. Upload document template
2. Assign document to employee(s)
3. Employee receives DocuSign email
4. Employee signs document
5. System tracks signature status
6. Onboarding completion is tracked

### Uploading Documents

**Steps:**
1. Click **"Upload Document"** button
2. Fill in form:
   - **Document Name**: Descriptive name
   - **Description**: What the document is for
   - **File**: Upload PDF file (DocuSign compatible)
   - **Category**: Select category (Contract, Policy, etc.)
3. Click **"Upload"** button
4. Document is stored and available for assignment

**Best Practices:**
- Use clear, descriptive names
- Ensure PDFs are DocuSign-compatible
- Add descriptions for reference
- Organize by category

### Assigning Documents

**Single Assignment:**
1. Find document in list
2. Click **"Assign"** button
3. Select employee from dropdown
4. Click **"Assign"** button
5. Employee receives DocuSign email

**Bulk Assignment:**
1. Find document in list
2. Click **"Bulk Assign"** button
3. Select multiple employees
4. Click **"Assign"** button
5. All selected employees receive DocuSign emails

### Tracking Document Status

**Status Types:**
- **Pending**: Assigned but not signed
- **Sent**: DocuSign email sent
- **Signed**: Document signed by employee
- **Completed**: Fully processed

**Viewing Status:**
- Document list shows assignment count
- Click document to see assignment details
- View individual employee status
- Track completion progress

### Employee Onboarding Dashboard

**Accessing:**
- Navigate to employee's profile or onboarding page
- View all assigned documents
- See completion status
- Track onboarding progress

**Onboarding Completion:**
- System automatically detects when all required documents are signed
- Onboarding status updates to "Completed"
- Employee can access full system features (if applicable)

### DocuSign Integration

**How It Works:**
1. Document is uploaded to system
2. Document is assigned to employee
3. System sends document to DocuSign
4. DocuSign sends email to employee
5. Employee signs via DocuSign
6. DocuSign webhook updates system
7. System reflects signed status

**Configuration:**
- DocuSign API credentials must be configured
- Webhook endpoint must be set up
- Integration is handled automatically

---

## System Configuration

While most system configuration is handled through the interface, there are some administrative tasks to be aware of.

### User Role Management

**Roles Available:**
- **Admin**: Full system access (you)
- **Guard**: Entry/exit logging, limited access
- **Employee**: HR document access only

**Role Permissions:**
- Admins: All features
- Guards: Entry/exit, search, reports (their sites only), alerts, emergency view
- Employees: HR documents only

### Job Site Configuration

**Capacity Settings:**
- Set maximum capacity per site
- Used for capacity warnings
- Set to 0 for unlimited

**Status Management:**
- Activate/deactivate sites
- Inactive sites don't appear in entry logging
- Historical data is preserved

### Security Settings

**Watchlist Configuration:**
- Add/remove watchlist entries
- Configure alert levels
- Manage match criteria

**Alert Configuration:**
- Set capacity warning thresholds
- Configure alert types
- Set notification preferences

### System Maintenance

**Regular Tasks:**
- Review and clean up old watchlist entries
- Review and resolve alerts
- Export and archive audit logs
- Review user accounts (deactivate unused)
- Monitor system performance

**Backup and Recovery:**
- System backups should be configured
- Review backup procedures
- Test recovery procedures regularly

---

## Best Practices

### User Management Best Practices

1. **Create Users Promptly**: Create accounts when new staff start
2. **Assign Appropriate Access**: Only grant necessary job site access
3. **Use Strong Passwords**: Enforce password policies
4. **Regular Reviews**: Review user accounts quarterly
5. **Deactivate, Don't Delete**: Deactivate unused accounts, preserve history
6. **Document Changes**: Keep records of user access changes

### Job Site Management Best Practices

1. **Clear Naming**: Use descriptive, consistent names
2. **Accurate Capacity**: Set realistic capacity limits
3. **Complete Information**: Fill in all fields (address, contact)
4. **Regular Updates**: Update site information as needed
5. **Deactivate Unused**: Deactivate sites no longer in use

### Security Best Practices

1. **Regular Watchlist Review**: Review and update watchlist monthly
2. **Monitor Alerts**: Respond to alerts promptly
3. **Review Audit Logs**: Review logs weekly for anomalies
4. **User Access Reviews**: Review user access quarterly
5. **Emergency Preparedness**: Test emergency procedures regularly

### Reporting Best Practices

1. **Regular Reports**: Generate reports on schedule (daily/weekly/monthly)
2. **Export for Records**: Export reports for archival
3. **Client Reports**: Generate client-specific reports as needed
4. **Time-Specific Reports**: Use time filters for shift reports
5. **Multi-Site Analysis**: Compare activity across sites

### HR Management Best Practices

1. **Organize Documents**: Use categories to organize documents
2. **Clear Naming**: Use descriptive document names
3. **Track Assignments**: Monitor document assignment status
4. **Follow Up**: Follow up on unsigned documents
5. **Complete Onboarding**: Ensure all required documents are assigned

---

## Troubleshooting

### Common Issues and Solutions

**Problem: User Can't Log In**
- **Solution**: Check if account is active
- **Solution**: Verify username is correct
- **Solution**: Reset password if needed
- **Solution**: Check if account is locked

**Problem: Guard Can't See Job Site**
- **Solution**: Verify job site is assigned to guard
- **Solution**: Check if job site is active
- **Solution**: Refresh user's session

**Problem: Watchlist Not Triggering Alerts**
- **Solution**: Verify watchlist entry is active
- **Solution**: Check match criteria (case sensitivity, exact match)
- **Solution**: Review alert configuration

**Problem: Reports Not Generating**
- **Solution**: Verify date range is valid
- **Solution**: Check if data exists for date range
- **Solution**: Try smaller date ranges
- **Solution**: Check system logs for errors

**Problem: DocuSign Not Working**
- **Solution**: Verify DocuSign API credentials
- **Solution**: Check webhook configuration
- **Solution**: Review DocuSign integration logs
- **Solution**: Contact DocuSign support if needed

**Problem: Emergency Mode Won't Activate**
- **Solution**: Check if another emergency mode is active
- **Solution**: Verify job site is active
- **Solution**: Check system logs
- **Solution**: Try deactivating and reactivating

### Getting Technical Support

**When to Contact Support:**
- System errors or crashes
- Integration issues (DocuSign, etc.)
- Performance problems
- Data corruption concerns
- Security incidents

**Information to Provide:**
- Description of problem
- Steps to reproduce
- Error messages (screenshots)
- User accounts affected
- Time/date of issue
- System logs if available

---

## Quick Reference

### Administrator Capabilities

**Full Access To:**
- All job sites (view and manage)
- All users (create, edit, delete)
- All entries (view, create, process exits)
- All reports (any site, any date range)
- All audit logs
- Watchlist management
- Alert management
- Emergency mode activation
- HR document management
- System configuration

### User Roles Summary

**Admin:**
- Full system access
- User and job site management
- Emergency mode activation
- All reporting capabilities

**Guard:**
- Entry/exit logging
- Search (assigned sites only)
- Reports (assigned sites only)
- Audit logs (assigned sites only)
- Alerts viewing
- Emergency mode viewing

**Employee:**
- HR document access only
- Document signing via DocuSign

### Status Types

**Entry Status:**
- **Active**: Currently on site
- **Exited**: Normal exit processed
- **Emergency Exit**: Exited during emergency or with override

**User Status:**
- **Active**: Can log in
- **Inactive**: Cannot log in, data preserved

**Job Site Status:**
- **Active**: Available for entry logging
- **Inactive**: Not available, data preserved

**Alert Status:**
- **Active**: New, unacknowledged
- **Acknowledged**: Reviewed but not resolved
- **Resolved**: Action taken, issue closed

---

## Conclusion

You now have comprehensive knowledge of the Security Access Management System as an administrator. Your responsibilities include:

- Managing users and their access
- Configuring and maintaining job sites
- Monitoring security through watchlist and alerts
- Generating reports for management and clients
- Handling emergency situations
- Managing HR documents and employee onboarding
- Reviewing audit logs for compliance

Remember to:
- Follow security best practices
- Regularly review system activity
- Maintain accurate user and job site information
- Respond promptly to alerts and emergencies
- Generate and archive reports regularly
- Keep documentation updated

For technical support or additional training, contact your system administrator or technical support team.

---

**Last Updated**: 2024-12-21
**Version**: 1.0.0

