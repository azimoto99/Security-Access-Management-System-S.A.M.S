import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        padding: 2,
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            padding: 3,
            width: '100%',
            backgroundColor: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="Shield Canine Services Logo"
              sx={{
                height: 60,
              }}
            />
          </Box>
          <Typography
            component="h1"
            variant="h5"
            align="center"
            gutterBottom
            sx={{ fontWeight: 600, mb: 1 }}
          >
            {t('login.title')}
          </Typography>
          <Typography
            variant="body2"
            align="center"
            sx={{ mb: 3, color: '#b0b0b0', fontSize: '0.75rem' }}
          >
            {t('login.signInToAccount')}
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                backgroundColor: '#2a1a1a',
                border: '1px solid #ff4444',
                color: '#ff6666',
                '& .MuiAlert-icon': { color: '#ff4444' },
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label={t('common.username')}
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#2a2a2a',
                  },
                  '&:hover fieldset': {
                    borderColor: '#ffd700',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ffd700',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffd700',
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('common.password')}
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#2a2a2a',
                  },
                  '&:hover fieldset': {
                    borderColor: '#ffd700',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ffd700',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#ffd700',
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 2,
                mb: 2,
                py: 1.25,
                fontWeight: 600,
                backgroundColor: '#ffd700',
                color: '#000000',
                '&:hover': {
                  backgroundColor: '#ffed4e',
                },
                '&:disabled': {
                  backgroundColor: '#3a3a3a',
                  color: '#666666',
                },
              }}
              disabled={loading}
            >
              {loading ? t('common.signingIn') : t('common.signIn')}
            </Button>
            <Box textAlign="center">
              <Link
                href="/forgot-password"
                variant="body2"
                sx={{
                  color: '#ffd700',
                  textDecoration: 'none',
                  fontSize: '0.75rem',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {t('common.forgotPassword')}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};




