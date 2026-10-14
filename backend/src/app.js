import express from 'express';
import cors from 'cors';
import fs from 'fs';
import config from './config/config.js';
import './models/index.js';
import apiV1Router from './routes/api.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Ensure public storage directory exists
if (!fs.existsSync(config.storageDir)) {
  fs.mkdirSync(config.storageDir, { recursive: true });
}

// Enable CORS for frontend clients
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Standard parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static asset delivery matching Laravel's /storage symlink
app.use('/storage', express.static(config.storageDir));

// Health check / root ping
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API v1 router
app.use('/api/v1', apiV1Router);

// 404 handler for missing endpoints
app.use(notFoundHandler);

// Global centralized error handler
app.use(errorHandler);

export default app;
