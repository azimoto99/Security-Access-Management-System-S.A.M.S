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
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
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
