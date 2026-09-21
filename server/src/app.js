import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import env from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import testRoutes from './routes/test.routes.js';
import municipalityRoutes from './routes/municipality.routes.js';
import wardRoutes from './routes/ward.routes.js';
import areaRoutes from './routes/area.routes.js';
import departmentRoutes from './routes/department.routes.js';
import designationRoutes from './routes/designation.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import workerTeamRoutes from './routes/workerTeam.routes.js';
import complaintCategoryRoutes from './routes/complaintCategory.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import workerRoutes from './routes/worker.routes.js';
import { notFoundHandler, globalErrorHandler } from './middlewares/error.middleware.js';

const app = express();

// --------------- Middleware ---------------

// Request logging (development only)
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// CORS — allow requests from the configured client URL
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Serve static files for uploads
app.use(express.static('public'));

// --------------- API Routes ---------------

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

if (env.NODE_ENV === 'development') {
  app.use('/api/test', testRoutes);
}

// Future route modules will be mounted here, e.g.:
app.use('/api/complaint-categories', complaintCategoryRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/municipalities', municipalityRoutes);
app.use('/api/wards', wardRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/designations', designationRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/worker-teams', workerTeamRoutes);
app.use('/api/worker', workerRoutes);

// --------------- Error Handling ---------------

// 404 — route not found
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

export default app;
