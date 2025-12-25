import { WebSocket } from 'ws';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { calculateAllOccupancy, calculateJobSiteOccupancy, JobSiteOccupancy } from './occupancyService';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  username?: string;
  role?: string;
  jobSiteAccess?: string[];
  isAlive?: boolean;
}

class WebSocketService {
  private wss: any;
  private clients: Set<AuthenticatedWebSocket> = new Set();

  initialize(wss: any) {
    this.wss = wss;

    wss.on('connection', (ws: AuthenticatedWebSocket, req: any) => {
      this.handleConnection(ws, req);
    });

    // Heartbeat to keep connections alive
    setInterval(() => {
      this.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  private async handleConnection(ws: AuthenticatedWebSocket, req: any) {
    try {
      // Extract token from query string or headers
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify token
      const decoded = verifyAccessToken(token);
      ws.userId = decoded.id;
      ws.username = decoded.username;
      ws.role = decoded.role;
      ws.jobSiteAccess = decoded.job_site_access || [];
      ws.isAlive = true;

      this.clients.add(ws);

      logger.info(`WebSocket connection authenticated: ${ws.username} (${ws.userId})`);

      // Send initial occupancy data
      this.sendOccupancyUpdate(ws);

      // Handle pong response
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle messages
      ws.on('message', async (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleMessage(ws, data);
        } catch (error) {
          logger.error('Error handling WebSocket message:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      // Handle close
      ws.on('close', () => {
        this.clients.delete(ws);
        logger.info(`WebSocket connection closed: ${ws.username}`);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  private async handleMessage(ws: AuthenticatedWebSocket, data: any) {
    switch (data.type) {
      case 'get_occupancy':
        await this.sendOccupancyUpdate(ws, data.job_site_id);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  }

  private async sendOccupancyUpdate(ws: AuthenticatedWebSocket, jobSiteId?: string) {
    try {
      let occupancy: JobSiteOccupancy | JobSiteOccupancy[] | null = null;

      if (jobSiteId) {
        // Send specific job site occupancy
        occupancy = await calculateJobSiteOccupancy(jobSiteId);
      } else {
        // Send all job sites occupancy
        const allOccupancy = await calculateAllOccupancy();
        
        // Filter by user access if not admin
        if (ws.role !== 'admin' && ws.jobSiteAccess) {
          occupancy = allOccupancy.filter((occ) => ws.jobSiteAccess?.includes(occ.job_site_id));
        } else {
          occupancy = allOccupancy;
        }
      }

      ws.send(
        JSON.stringify({
          type: 'occupancy_update',
          data: occupancy,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      logger.error('Error sending occupancy update:', error);
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'Failed to fetch occupancy data',
        })
      );
    }
  }

  /**
   * Broadcast occupancy update to all connected clients
   */
  async broadcastOccupancyUpdate(jobSiteId?: string) {
    const promises = Array.from(this.clients).map(async (ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        await this.sendOccupancyUpdate(ws, jobSiteId);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Broadcast alert to all connected guards and admins
   */
  broadcastAlert(alert: any) {
    if (!this.wss) return;

    const message = JSON.stringify({
      type: 'alert',
      alert,
      timestamp: new Date().toISOString(),
    });

    // Broadcast to all guards and admins
    this.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        (client.role === 'guard' || client.role === 'admin')
      ) {
        // If alert has a job site, only send to users with access to that site
        if (alert.job_site_id) {
          if (
            client.role === 'admin' ||
            (client.jobSiteAccess && client.jobSiteAccess.includes(alert.job_site_id))
          ) {
            client.send(message);
          }
        } else {
          // Send to all guards/admins for alerts without specific job site
          client.send(message);
        }
      }
    });
  }

  /**
   * Broadcast emergency mode status to all connected guards and admins
   */
  broadcastEmergencyMode(data: any) {
    if (!this.wss) return;

    const message = JSON.stringify({
      type: 'emergency_mode',
      ...data,
    });

    // Broadcast to all guards and admins
    this.clients.forEach((client) => {
      if (
        client.readyState === WebSocket.OPEN &&
        (client.role === 'guard' || client.role === 'admin')
      ) {
        // If emergency mode has a job site, only send to users with access to that site
        if (data.emergency_mode?.job_site_id) {
          if (
            client.role === 'admin' ||
            (client.jobSiteAccess && client.jobSiteAccess.includes(data.emergency_mode.job_site_id))
          ) {
            client.send(message);
          }
        } else {
          // Send to all guards/admins for site-wide emergency
          client.send(message);
        }
      }
    });
  }

  /**
   * Broadcast entry created event to clients with access to the job site
   */
  broadcastEntryCreated(entry: any, jobSiteId: string) {
    if (!this.wss) return;

    const message = JSON.stringify({
      type: 'entry:created',
      entry,
      job_site_id: jobSiteId,
      timestamp: new Date().toISOString(),
    });

    // Broadcast to all clients (including client role) with access to this job site
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        if (
          client.role === 'admin' ||
          (client.jobSiteAccess && client.jobSiteAccess.includes(jobSiteId))
        ) {
          client.send(message);
        }
      }
    });
  }

  /**
   * Broadcast entry updated event (e.g., exit processed) to clients with access to the job site
   */
  broadcastEntryUpdated(entry: any, jobSiteId: string) {
    if (!this.wss) return;

    const message = JSON.stringify({
      type: 'entry:updated',
      entry,
      job_site_id: jobSiteId,
      timestamp: new Date().toISOString(),
    });

    // Broadcast to all clients (including client role) with access to this job site
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        if (
          client.role === 'admin' ||
          (client.jobSiteAccess && client.jobSiteAccess.includes(jobSiteId))
        ) {
          client.send(message);
        }
      }
    });
  }
}

export const webSocketService = new WebSocketService();

