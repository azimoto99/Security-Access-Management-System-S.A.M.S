# Changelog

All notable changes to the Security Access Management System will be documented in this file.

## [1.0.0] - 2024-01-XX

### Added

#### Core Features
- Real-time entry/exit logging for vehicles, visitors, and trucks
- Multi-site job site management with capacity tracking
- Photo capture and management with thumbnail generation
- Real-time occupancy tracking with WebSocket support
- Advanced search and filtering capabilities
- Security alerts and watchlist system
- Emergency management mode with bulk exit processing
- Comprehensive audit logging
- Analytics and reporting with charts
- User management with role-based access control (RBAC)

#### HR Document Management
- HR document upload and management
- Document assignment to employees
- Bulk document assignment
- Document download and preview
- Employee onboarding dashboard
- DocuSign integration for electronic signatures
- Webhook handling for signature status updates
- Automatic onboarding completion detection

#### Security & Performance
- JWT-based authentication with refresh tokens
- Password reset functionality
- Rate limiting for API endpoints
- API response caching
- Database query optimization
- Failed login attempt tracking
- Account lockout protection

#### Infrastructure
- Docker containerization
- Docker Compose setup
- Production build optimization
- Health check endpoints
- System monitoring and metrics
- Error tracking and logging
- Database migration system
- Automated backup scripts

#### Testing
- Integration test framework
- End-to-end testing with Cypress
- Test coverage configuration

#### Documentation
- Comprehensive deployment guide
- Production configuration guide
- API documentation
- Setup instructions

### Technical Stack

**Backend:**
- Node.js 18+ with Express.js
- TypeScript
- PostgreSQL 14+
- WebSocket for real-time communication
- DocuSign API integration
- Sharp.js for image processing
- Jest for testing

**Frontend:**
- React 19 with TypeScript
- Vite for build tooling
- Material-UI for components
- React Query for state management
- Cypress for E2E testing

### Security Features
- Helmet.js security headers
- CORS configuration
- Input validation with Joi
- SQL injection prevention
- File upload security
- Rate limiting
- Secure password hashing

### Performance Optimizations
- API response caching
- Database indexing
- Connection pooling
- Code splitting
- Asset optimization
- Gzip compression

## [1.1.0] - 2024-12-XX

### Added
- Quick Actions section on guard dashboard for easy access to Reports and Audit Logs
- HR Docs quick action button on admin and guard dashboards
- Infinite scrolling for recent activity feeds on admin and client dashboards
- Manual Exit button moved inside Vehicles On Site box for better accessibility

### Changed
- Default entry type in guard dashboard changed from "vehicle" to "truck"
- Quick Actions button labels simplified ("Add New User" → "Users", "Create New Site" → "Job Sites")
- Analytics charts improved with better margins and label positioning to prevent text cutoff
- Pie chart labels now use label lines to prevent text cutoff
- Recent activity sections now support endless scrolling to view all historical entries

### Fixed
- Fixed text cutoff issues in analytics charts (line charts, bar charts, and pie charts)
- Fixed pie chart label cutoff for "trucks" entry type
- Removed non-functional System Settings button from admin quick actions

### Removed
- Client portal usage section removed from admin dashboard
- System Settings quick action (route did not exist)









