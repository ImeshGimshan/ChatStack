// src/app.js
const express = require('express');
const cors = require('cors');
const profileRoutes = require('./routes/profile.routes');

const app = express();

// Middleware
app.use(cors({
  origin: 'https://chat-stack-azure.vercel.app',
  credentials: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'User Profile Service',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/profile', profileRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'User Profile Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      myProfile: 'GET /api/profile/me',
      updateProfile: 'PUT /api/profile/me',
      viewProfile: 'GET /api/profile/:userId'
    },
    documentation: 'All endpoints require Bearer token authentication'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: [
      'GET /health',
      'GET /api/profile/me',
      'PUT /api/profile/me',
      'GET /api/profile/:userId'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;