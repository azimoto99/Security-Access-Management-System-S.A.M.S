import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
  message?: string;
}

export const useWebSocket = (onMessage?: (message: WebSocketMessage) => void) => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No authentication token');
        return;
      }

      // Auto-detect WebSocket URL if not set
      const getWsUrl = (): string => {
        // Use environment variable if set
        const envWsUrl = import.meta.env.VITE_WS_URL;
        if (envWsUrl) {
          return envWsUrl;
        }
        
        // Try to derive from API URL
        const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
        if (apiUrl.includes('https://')) {
          return apiUrl.replace('https://', 'wss://').replace('/api', '');
        }
        if (apiUrl.includes('http://')) {
          return apiUrl.replace('http://', 'ws://').replace('/api', '');
        }
        
        // Runtime detection for production
        if (typeof window !== 'undefined') {
          const host = window.location.hostname;
          
          // If on Render or fixer.gg, use known backend URL
          if (host.includes('onrender.com') || host === 'fixer.gg' || host.includes('fixer.gg')) {
            return 'wss://security-access-management-system-s-a-m-s.onrender.com';
          }
        }
        
        // Development default
        return 'ws://localhost:3001';
      };
      
      const WS_URL = getWsUrl();
      const wsUrlWithToken = `${WS_URL}?token=${token}`;
      console.log('Attempting WebSocket connection to:', WS_URL);
      const ws = new WebSocket(wsUrlWithToken);

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        wsRef.current = ws;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          if (onMessage) {
            onMessage(message);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        console.error('WebSocket URL attempted:', WS_URL);
        setError('WebSocket connection error');
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        wsRef.current = null;
        console.log('WebSocket closed:', event.code, event.reason);

        // Don't reconnect if it was a normal closure or authentication failure
        if (event.code === 1000 || event.code === 1008) {
          console.log('WebSocket closed normally or authentication failed, not reconnecting');
          return;
        }

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Exponential backoff, max 30s
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts}) in ${delay}ms`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
          setError('Failed to reconnect to server');
        }
      };
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    }
  }, [isAuthenticated, user, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect]);

  return {
    isConnected,
    error,
    lastMessage,
    sendMessage,
    disconnect,
    connect,
  };
};


