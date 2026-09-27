const express = require('express');
const http = require('http');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const path = require('path');

// Load environment variables from backend/.env (robust resolution)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('./config/db');
const logger = require('./config/logger');
const createRequestLogger = require('./middleware/requestLogger');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const contactRoutes = require('./routes/contactRoutes');
const alertRoutes = require('./routes/alertRoutes');
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const stickerOrderRoutes = require('./routes/stickerOrderRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ADMIN_PANEL_ORIGIN || 'http://localhost:5173',
  },
});

app.set('io', io);

// Connect Database
connectDB();

// Init Middleware
app.use(createRequestLogger());
app.use(cors({
  origin: process.env.ADMIN_PANEL_ORIGIN || 'http://localhost:5173',
}));
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});
const publicCardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many emergency-card requests. Please try again later.' },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/alerts', authLimiter);
app.use('/api/public/emergency', publicCardLimiter);

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/orders', stickerOrderRoutes);
app.use('/api/public', publicRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Scan2Rescue API running' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'scan2rescue-api' });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  req.log.error({ err: error }, 'Unhandled request error');
  res.status(error.statusCode || 500).json({ message: 'Internal server error' });
});

// Define Port
const PORT = process.env.PORT || 5000;

io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'Admin real-time client connected');
});

httpServer.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server listening');
});
