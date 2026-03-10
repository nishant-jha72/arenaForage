const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

const db = require('./DB');
const userRoutes = require('./Routes/user.routes');
const adminRoutes = require('./Routes/Admin.routes');
const superAdminRoutes = require('./Routes/SuperAdmin.routes');

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // allows cookies to be sent cross-origin
}));

// ── Rate Limiters ─────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." },
});

const superAdminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." },
});

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.send('Welcome to the Arena Forage API!');
});

app.use('/api/users', userRoutes);
app.use('/api/users/login', loginLimiter);

app.use('/api/admin', adminRoutes);
app.use('/api/admin/login', loginLimiter);

app.use('/api/superadmin', superAdminRoutes);
app.use('/api/superadmin/login', superAdminLoginLimiter);

const internalRoutes = require('./Routes/internal.main.routes');
app.use('/api/internal', internalRoutes);

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`[ERROR] ${status} — ${message}`);
    return res.status(status).json({ success: false, message });
});

// ── Start Server ──────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.listen(5000, () => {
        console.log('Server is running on port 5000');
    });
}

module.exports = app;