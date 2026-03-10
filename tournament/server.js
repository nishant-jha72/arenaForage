const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const app = express();
const routes = require('./Routes/Tournament.routes');
const internalRoutes = require('./Routes/internal.routes');

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
    origin: process.env.MAIN_SERVICE_URL,
    credentials: true,
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── MongoDB Connection ────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.error('MongoDB connection error:', err));

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.send('Tournament Service Running'));
app.use('/api', routes);
app.use('/api/internal', internalRoutes); // internal routes for main service callbacks

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`[ERROR] ${status} — ${message}`);
    return res.status(status).json({ success: false, message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(5001, () => {
    console.log('Tournament service running on port 5001');
});