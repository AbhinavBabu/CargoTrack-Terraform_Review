import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './swagger';

// Routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import shipmentRoutes from './routes/shipments';
import trackingRoutes from './routes/tracking';
import documentRoutes from './routes/documents';
import notificationRoutes from './routes/notifications';
import reportRoutes from './routes/reports';
import adminRoutes from './routes/admin';

const prisma = new PrismaClient();

/**
 * Automatically creates the admin account on startup if it doesn't exist.
 * Uses ADMIN_EMAIL and ADMIN_PASSWORD environment variables.
 * This replaces the need for any manual docker exec commands.
 */
async function ensureAdminExists(): Promise<void> {
  try {
    const existing = await prisma.user.findUnique({
      where: { email: config.adminEmail },
    });

    if (!existing) {
      const hashed = await bcrypt.hash(config.adminPassword, 10);
      await prisma.user.create({
        data: {
          email: config.adminEmail,
          password: hashed,
          name: 'Admin',
          role: 'ADMIN',
        },
      });
      console.log(`[startup] Admin account created: ${config.adminEmail}`);
    } else if (existing.role !== 'ADMIN') {
      // Ensure the account has ADMIN role even if it was created as USER
      await prisma.user.update({
        where: { email: config.adminEmail },
        data: { role: 'ADMIN' },
      });
      console.log(`[startup] Admin role updated for: ${config.adminEmail}`);
    } else {
      console.log(`[startup] Admin account already exists: ${config.adminEmail}`);
    }
  } catch (err) {
    console.error('[startup] Failed to ensure admin exists:', err);
    // Non-fatal: server still starts even if admin seeding fails
  }
}

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(config.uploadDir));

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Error handler (must be last)
app.use(errorHandler);

async function main() {
  // Ensure admin account exists before accepting traffic
  await ensureAdminExists();

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`CargoTrack API running on port ${config.port}`);
    console.log(`Swagger docs: http://localhost:${config.port}/api/docs`);
    console.log(`Environment: ${config.nodeEnv}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
