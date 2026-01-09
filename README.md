```
 ███████╗██╗  ██╗██╗███████╗██╗     ██████╗
 ██╔════╝██║  ██║██║██╔════╝██║     ██╔══██╗
 ███████╗███████║██║█████╗  ██║     ██║  ██║
 ╚════██║██╔══██║██║██╔══╝  ██║     ██║  ██║
 ███████║██║  ██║██║███████╗███████╗██████╔╝
 ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═════╝
```

# Security Access Management System (S.A.M.S)

## 🚀 Overview

**S.A.M.S** is a comprehensive, enterprise-grade security access management platform designed specifically for construction sites and industrial facilities. Our system provides real-time tracking and management of vehicle, visitor, and truck access across multiple job sites with advanced security features and compliance tools.

### 🎯 Core Purpose

S.A.M.S empowers security personnel and administrators with:
- **Complete Visibility**: Real-time monitoring of all site access and occupancy
- **Enhanced Security**: Advanced watchlist system and emergency protocols
- **Compliance Ready**: Comprehensive audit trails and reporting
- **Operational Efficiency**: Streamlined workflows for security guards and administrators
- **Scalability**: Multi-site management with centralized control

## 🏗️ Key Features

### 🔐 Access Management
- **Real-time Entry/Exit Logging** - Instant tracking of vehicles, visitors, and trucks
- **Multi-site Support** - Manage multiple job sites from a single dashboard
- **Custom Field Configuration** - Adapt entry forms to specific site requirements
- **Photo Capture** - Automatic photo documentation for security records

### 📊 Monitoring & Analytics
- **Live Occupancy Tracking** - Real-time site capacity monitoring via WebSocket
- **Advanced Search & Filtering** - Powerful tools for finding historical records
- **Comprehensive Reporting** - Export detailed access logs and analytics
- **Performance Metrics** - Track security response times and efficiency

### 🚨 Security & Compliance
- **Watchlist System** - Automated alerts for flagged individuals/vehicles
- **Emergency Mode** - Rapid bulk exit procedures for critical situations
- **Audit Logging** - Complete trail of all system activities
- **Role-based Access Control** - Granular permissions for different user types

### 📋 HR & Document Management
- **Employee Onboarding** - Streamlined new hire processing
- **Document Management** - Secure storage and tracking of HR documents
- **DocuSign Integration** - Electronic signature capabilities
- **Compliance Tracking** - Ensure all required documentation is current

## 👥 User Roles

### 🛡️ Security Guards
- Log vehicle, visitor, and truck entries/exits
- Take photos and capture entry details
- Monitor real-time occupancy
- Access site-specific information
- Generate quick reports

### 👔 Administrators
- Configure job sites and access rules
- Manage users and permissions
- Customize entry forms and fields
- Monitor system-wide activity
- Generate comprehensive reports

### 🏢 Clients
- View access logs for their sites
- Monitor occupancy in real-time
- Receive alerts and notifications
- Access historical data

## 🛠️ Technology Stack

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **Database**: PostgreSQL with advanced JSON support
- **Authentication**: JWT with refresh token rotation
- **Real-time**: WebSocket for live updates
- **File Processing**: Sharp.js for image optimization
- **Testing**: Jest with comprehensive test coverage

### Frontend Architecture
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: Material-UI (MUI) for consistent, accessible components
- **State Management**: React Query for server state and caching
- **Routing**: React Router for client-side navigation
- **Internationalization**: React i18next for multi-language support

### Infrastructure & DevOps
- **Containerization**: Docker for consistent deployment
- **Monitoring**: Built-in logging and performance tracking
- **Security**: Helmet.js, CORS, rate limiting, input validation
- **Database**: Connection pooling and migration system
- **Caching**: Redis integration for performance optimization

## 📁 Project Structure

```
Shield/
├── backend/              # Express.js TypeScript backend
│   ├── src/
│   │   ├── config/       # Database, auth, and app configuration
│   │   ├── controllers/  # Request handlers and business logic
│   │   ├── middleware/   # Authentication, validation, error handling
│   │   ├── routes/       # API endpoint definitions
│   │   ├── services/     # External integrations and core services
│   │   ├── types/        # TypeScript type definitions
│   │   ├── utils/        # Helper functions and utilities
│   │   └── db/           # Database migrations and scripts
│   └── package.json
├── frontend/             # React TypeScript frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Main application pages
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API client services
│   │   ├── types/        # Frontend type definitions
│   │   ├── contexts/     # React context providers
│   │   ├── utils/        # Frontend utilities
│   │   └── i18n/         # Internationalization files
│   └── package.json
└── docs/                 # Documentation and training materials
```

## 📚 Documentation

### Training Guides
- **[Guard Training Guide](./TRAINING_GUARD.md)** - Complete guide for security guards covering entry/exit logging, search, reports, and all guard-specific features
- **[Administrator Training Guide](./TRAINING_ADMIN.md)** - Complete guide for administrators covering user management, job site configuration, security features, and all administrative functions

### Technical Documentation
- **[Environment Variables](./ENVIRONMENT_VARIABLES.md)** - Complete guide to required and optional environment variables
- **[Monitoring Setup](./MONITORING_SETUP.md)** - Production monitoring and alerting configuration
- **[Production Deployment Checklist](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - Pre-deployment and post-deployment checklists

## 🏆 Key Benefits

### For Security Teams
- **Reduced Manual Work**: Automated logging and photo capture
- **Better Situational Awareness**: Real-time occupancy and alerts
- **Faster Response Times**: Instant notifications and streamlined workflows
- **Compliance Assurance**: Complete audit trails and reporting

### For Management
- **Data-Driven Decisions**: Comprehensive analytics and reporting
- **Risk Mitigation**: Proactive security monitoring and alerts
- **Operational Visibility**: Real-time insights across all sites
- **Scalability**: Easy expansion to new sites and users

### For Organizations
- **Cost Reduction**: Efficient security operations and reduced paperwork
- **Enhanced Safety**: Better site security and emergency response
- **Regulatory Compliance**: Comprehensive documentation and audit trails
- **Professional Standards**: Enterprise-grade security management

## 🔧 Development Guidelines

- **TypeScript First**: Strict typing for all new code
- **Component Architecture**: Functional components with hooks
- **State Management**: Local state for components, context for global state
- **Performance**: Optimize renders, use memoization strategically
- **Testing**: Write tests for critical business logic
- **Code Quality**: ESLint, Prettier, and consistent patterns
- **Documentation**: Clear comments and meaningful commit messages

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for construction site security professionals**


