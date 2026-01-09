# Security Access Management System

A comprehensive web-based application for tracking and managing vehicle and visitor access at multiple job sites, with HR document management and DocuSign integration.

## Project Structure

```
Shield/
├── backend/          # Express.js TypeScript backend
│   ├── src/
│   │   ├── config/   # Configuration files
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   ├── types/        # TypeScript type definitions
│   │   ├── utils/        # Utility functions
│   │   └── server.ts     # Application entry point
│   └── package.json
├── frontend/         # React TypeScript frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API services
│   │   ├── types/        # TypeScript type definitions
│   │   ├── utils/        # Utility functions
│   │   └── main.tsx      # Application entry point
│   └── package.json
└── .kiro/            # Project specifications
```


## Technology Stack

### Backend
- Node.js with Express.js
- TypeScript
- PostgreSQL
- JWT for authentication
- WebSocket for real-time updates
- DocuSign API for document signing
- Sharp.js for image processing
- Jest for testing
- Docker for containerization

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- Material-UI for components
- React Query for state management
- Cypress for E2E testing


## Training Documentation

Comprehensive training guides are available for different user roles:

- **[Guard Training Guide](./TRAINING_GUARD.md)** - Complete guide for security guards covering entry/exit logging, search, reports, and all guard-specific features
- **[Administrator Training Guide](./TRAINING_ADMIN.md)** - Complete guide for administrators covering user management, job site configuration, security features, and all administrative functions

These guides are designed for creating external training materials and include step-by-step instructions, best practices, troubleshooting, and quick reference guides.

## Features

- ✅ Real-time entry/exit logging for vehicles, visitors, and trucks
- ✅ Multi-site job site management
- ✅ Photo capture and management
- ✅ Real-time occupancy tracking with WebSocket
- ✅ Advanced search and filtering
- ✅ Security alerts and watchlist system
- ✅ Emergency management mode
- ✅ Audit logging and reporting
- ✅ User management with role-based access control
- ✅ HR document management with DocuSign integration
- ✅ Employee onboarding workflow
- ✅ Performance optimization and caching
- ✅ Comprehensive testing suite
- React Router for navigation
- Axios for HTTP requests

## Environment Variables

See `.env.example` files in both `backend/` and `frontend/` directories for required environment variables.

## Development Guidelines

- Follow TypeScript best practices
- Use ESLint and Prettier for code quality
- Write tests for new features
- Follow the existing folder structure
- Use meaningful commit messages

## License

MIT


