// src/app.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { createServer } from 'http';
import 'express-async-errors';
import { env } from './config/env';
import { db } from './services/database.service';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import inventoryRoutes from './routes/inventory.routes';
import warehouseRoutes from './routes/warehouse.routes';
import productRoutes from './routes/product.routes';
import alertRoutes from './routes/alert.routes';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerOptions from './config/swagger';

const swaggerSpec = swaggerJsdoc(swaggerOptions);


class App {
  public app: Application;
  public port: number;
  public server: any;
  public io: Server;

  constructor() {
    this.app = express();
    this.port = env.PORT;
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: env.CLIENT_URL,
        credentials: true,
      },
    });

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSocketIO();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }));

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', async (req: Request, res: Response) => {
      const dbHealth = await db.healthCheck();
      res.status(dbHealth ? 200 : 503).json({
        status: dbHealth ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: dbHealth ? 'connected' : 'disconnected',
      });
    });

    // API routes
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/inventory', authenticate, inventoryRoutes);
    this.app.use('/api/warehouses', authenticate, warehouseRoutes);
    this.app.use('/api/products', authenticate, productRoutes);
    this.app.use('/api/alerts', authenticate, alertRoutes);

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private initializeSocketIO(): void {
    this.app.set('io', this.io);

    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      socket.on('inventory:subscribe', (warehouseId: string) => {
        socket.join(`warehouse:${warehouseId}`);
        console.log(`Client ${socket.id} subscribed to warehouse ${warehouseId}`);
      });

      socket.on('alert:acknowledge', (alertId: string) => {
        socket.emit('alert:acknowledged', { alertId });
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  public async start(): Promise<void> {
    try {
      await db.connect();
      
      this.server.listen(this.port, () => {
        console.log(`Server running on port ${this.port}`);
        console.log(`Environment: ${env.NODE_ENV}`);
        console.log(`Client URL: ${env.CLIENT_URL}`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    await db.disconnect();
    this.server.close();
    console.log('Server stopped');
  }
}

// Create and start the application
const app = new App();
app.start();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await app.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await app.stop();
  process.exit(0);
});

export default app;