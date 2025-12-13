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

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update the `.env` file with your database credentials and configuration:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=security_access_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret_key_here_min_32_characters
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_min_32_characters
```

5. Create the PostgreSQL database:
```bash
createdb security_access_db
```

6. Start the development server:
```bash
npm run dev
```

The backend server will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The frontend application will run on `http://localhost:5173`

## Available Scripts

### Backend Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Type check without emitting files

### Frontend Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Type check without emitting files

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

## Deployment

### Quick Start with Docker

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Shield
   ```

2. **Set up environment variables:**
   - Copy `.env.example` files in `backend/` and `frontend/` directories
   - Update with your configuration

3. **Deploy:**
   ```bash
   ./scripts/deploy.sh production
   ```

4. **Access the application:**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:3001/api
   - Health Check: http://localhost:3001/api/health

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

For production configuration, see [PRODUCTION.md](./PRODUCTION.md)

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


