import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { JobSiteManagementPage } from './pages/JobSiteManagementPage';
import { EntryPage } from './pages/EntryPage';
import { ExitPage } from './pages/ExitPage';
import { SearchPage } from './pages/SearchPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ReportsPage } from './pages/ReportsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { WatchlistManagementPage } from './pages/WatchlistManagementPage';
import { AlertsPage } from './pages/AlertsPage';
import { EmergencyManagementPage } from './pages/EmergencyManagementPage';
import { OnboardingDashboardPage } from './pages/OnboardingDashboardPage';
import { HRDocumentManagerPage } from './pages/HRDocumentManagerPage';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffd700', // Yellow
      light: '#ffed4e',
      dark: '#ccaa00',
      contrastText: '#000000',
    },
    secondary: {
      main: '#ffffff', // White
      light: '#f5f5f5',
      dark: '#cccccc',
      contrastText: '#000000',
    },
    background: {
      default: '#0a0a0a', // Black
      paper: '#1a1a1a', // Dark grey
    },
    text: {
      primary: '#ffffff', // White
      secondary: '#b0b0b0', // Light grey
    },
    divider: '#2a2a2a', // Grey divider
    action: {
      active: '#ffd700',
      hover: '#2a2a2a',
      selected: '#3a3a3a',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '0.875rem',
    },
    body2: {
      fontSize: '0.75rem',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          boxShadow: '0 1px 3px rgba(255, 215, 0, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: '#ffd700',
            boxShadow: '0 4px 12px rgba(255, 215, 0, 0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '6px',
          padding: '8px 16px',
        },
        contained: {
          backgroundColor: '#ffd700',
          color: '#000000',
          '&:hover': {
            backgroundColor: '#ffed4e',
          },
        },
        outlined: {
          borderColor: '#ffd700',
          color: '#ffd700',
          '&:hover': {
            borderColor: '#ffed4e',
            backgroundColor: 'rgba(255, 215, 0, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          border: '1px solid #2a2a2a',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/job-sites"
              element={
                <ProtectedRoute>
                  <JobSiteManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/entry"
              element={
                <ProtectedRoute allowedRoles={['guard', 'admin']}>
                  <EntryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exit"
              element={
                <ProtectedRoute allowedRoles={['guard', 'admin']}>
                  <ExitPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute allowedRoles={['guard', 'admin']}>
                  <SearchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/watchlist"
              element={
                <ProtectedRoute allowedRoles={['admin', 'guard']}>
                  <WatchlistManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute allowedRoles={['admin', 'guard']}>
                  <AlertsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/emergency"
              element={
                <ProtectedRoute allowedRoles={['admin', 'guard']}>
                  <EmergencyManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hr/documents"
              element={
                <ProtectedRoute allowedRoles={['employee', 'guard']}>
                  <OnboardingDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hr/manage"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <HRDocumentManagerPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
