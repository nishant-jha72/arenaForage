const SuperAdmin = require("../Models/SuperAdmin.model");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const ApiError = require("../Utils/ApiError.utils");
const ApiResponse = require("../Utils/ApiResponse.utils");
const uploadOnCloudinary = require("../Utils/cloudinary.utils");
const nodemailer = require("nodemailer");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateTokens = (superAdminId) => {
    const accessToken = jwt.sign(
        { id: superAdminId, role: "superadmin" },
        process.env.SUPER_ADMIN_ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
        { id: superAdminId, role: "superadmin" },
        process.env.SUPER_ADMIN_REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
    );
    return { accessToken, refreshToken };
};

const sendEmail = async ({ to, subject, text }) => {
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
};

const sanitizeSuperAdmin = (sa) => ({
    id:         sa.id,
    name:       sa.name,
    email:      sa.email,
    created_by: sa.created_by,
    last_login: sa.last_login,
    created_at: sa.created_at,
});

const cookieOptions = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
};

// ─── Controller ───────────────────────────────────────────────────────────────

const superAdminController = {

    // ── SEED / CREATE SUPER ADMIN ─────────────────────────────────────────────
    // POST /api/superadmin/create
    // First super admin: requires SUPER_ADMIN_SEED_SECRET in body
    // Subsequent super admins: requires existing super admin JWT
    create: async (req, res, next) => {
        try {
            const { name, email, password, seedSecret } = req.body;

            if ([name, email, password].some((f) => !f?.trim())) {
                throw new ApiError(400, "Name, email and password are required");
            }

            // Check if any super admin exists
            const allSuperAdmins = await SuperAdmin.findAll();

            if (allSuperAdmins.length === 0) {
                // First super admin — must provide seed secret
                if (seedSecret !== process.env.SUPER_ADMIN_SEED_SECRET) {
                    throw new ApiError(403, "Invalid seed secret");
                }
                const result = await SuperAdmin.create({ name, email, password, createdBy: null });
                return res.status(201).json(
                    new ApiResponse(201, { id: result.insertId }, "First super admin created successfully")
                );
            }

            // Subsequent super admins — verify their token directly here
            const token =
                req.cookies?.saAccessToken ||
                req.header("Authorization")?.replace("Bearer ", "");

            if (!token) {
                throw new ApiError(403, "Only an existing super admin can create another super admin");
            }

            let decoded;
            try {
                decoded = jwt.verify(token, process.env.SUPER_ADMIN_ACCESS_TOKEN_SECRET);
            } catch {
                throw new ApiError(403, "Invalid or expired super admin token");
            }

            if (decoded.role !== "superadmin") {
                throw new ApiError(403, "Only an existing super admin can create another super admin");
            }

            const creatingSA = await SuperAdmin.findById(decoded.id);
            if (!creatingSA) throw new ApiError(403, "Super admin not found");
            req.superAdmin = creatingSA;

            const existing = await SuperAdmin.findByEmail(email);
            if (existing) throw new ApiError(409, "A super admin with this email already exists");

            const result = await SuperAdmin.create({
                name,
                email,
                password,
                createdBy: req.superAdmin.id,
            });

            return res.status(201).json(
                new ApiResponse(201, { id: result.insertId }, "Super admin created successfully")
            );
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    // POST /api/superadmin/login
    login: async (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email?.trim() || !password?.trim()) {
                throw new ApiError(400, "Email and password are required");
            }

            const superAdmin = await SuperAdmin.findByEmail(email);
            if (!superAdmin || !(await SuperAdmin.comparePassword(password, superAdmin.password))) {
                throw new ApiError(401, "Invalid email or password");
            }

            const { accessToken, refreshToken } = generateTokens(superAdmin.id);

            // Save refresh token + update last login
            await SuperAdmin.update(superAdmin.id, {
                refreshToken,
                last_login: new Date(),
            });

            return res
                .status(200)
                .cookie("saAccessToken", accessToken, cookieOptions)
                .cookie("saRefreshToken", refreshToken, cookieOptions)
                .json(new ApiResponse(200, {
                    superAdmin: sanitizeSuperAdmin(superAdmin),
                    accessToken,
                }, "Login successful"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── LOGOUT ────────────────────────────────────────────────────────────────
    // POST /api/superadmin/logout  (protected)
    logout: async (req, res, next) => {
        try {
            await SuperAdmin.update(req.superAdmin.id, { refreshToken: null });
            return res
                .status(200)
                .clearCookie("saAccessToken", cookieOptions)
                .clearCookie("saRefreshToken", cookieOptions)
                .json(new ApiResponse(200, {}, "Logged out successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── REFRESH TOKEN ─────────────────────────────────────────────────────────
    // POST /api/superadmin/refresh-token
    refreshAccessToken: async (req, res, next) => {
        try {
            const incomingToken = req.cookies?.saRefreshToken || req.body?.refreshToken;
            if (!incomingToken) throw new ApiError(401, "Refresh token is missing");

            let decoded;
            try {
                decoded = jwt.verify(incomingToken, process.env.SUPER_ADMIN_REFRESH_TOKEN_SECRET);
            } catch {
                throw new ApiError(401, "Invalid or expired refresh token. Please log in again.");
            }

            if (decoded.role !== "superadmin") throw new ApiError(403, "Invalid token role");

            const superAdmin = await SuperAdmin.findById(decoded.id);
            if (!superAdmin) throw new ApiError(401, "Super admin not found");

            if (superAdmin.refreshToken !== incomingToken) {
                throw new ApiError(401, "Refresh token revoked. Please log in again.");
            }

            const { accessToken, refreshToken: newRefreshToken } = generateTokens(superAdmin.id);
            await SuperAdmin.update(superAdmin.id, { refreshToken: newRefreshToken });

            return res
                .status(200)
                .cookie("saAccessToken", accessToken, cookieOptions)
                .cookie("saRefreshToken", newRefreshToken, cookieOptions)
                .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── GET OWN PROFILE ───────────────────────────────────────────────────────
    // GET /api/superadmin/profile  (protected)
    getProfile: async (req, res, next) => {
        try {
            const sa = await SuperAdmin.findById(req.superAdmin.id);
            if (!sa) throw new ApiError(404, "Super admin not found");
            return res.status(200).json(new ApiResponse(200, { superAdmin: sanitizeSuperAdmin(sa) }, "Profile fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ── CHANGE PASSWORD ───────────────────────────────────────────────────────
    // PATCH /api/superadmin/change-password  (protected)
    changePassword: async (req, res, next) => {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword?.trim() || !newPassword?.trim()) {
                throw new ApiError(400, "Both current and new password are required");
            }
            if (currentPassword === newPassword) {
                throw new ApiError(400, "New password must be different");
            }

            const sa = await SuperAdmin.findById(req.superAdmin.id);
            const isMatch = await SuperAdmin.comparePassword(currentPassword, sa.password);
            if (!isMatch) throw new ApiError(401, "Current password is incorrect");

            await SuperAdmin.updatePassword(req.superAdmin.id, newPassword);
            return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // DASHBOARD
    // ══════════════════════════════════════════════════════════════════════════

    // GET /api/superadmin/dashboard
    getDashboard: async (req, res, next) => {
        try {
            const [stats, tournamentStats] = await Promise.all([
                SuperAdmin.getDashboardStats(),
                SuperAdmin.getTournamentStats(),
            ]);

            return res.status(200).json(new ApiResponse(200, {
                ...stats,
                tournaments: tournamentStats,
            }, "Dashboard fetched successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // USER MANAGEMENT
    // ══════════════════════════════════════════════════════════════════════════

    // GET /api/superadmin/users?page=1&limit=20&search=
    getAllUsers: async (req, res, next) => {
        try {
            const { page = 1, limit = 20, search = '' } = req.query;
            const data = await SuperAdmin.getAllUsers({ page: +page, limit: +limit, search });
            return res.status(200).json(new ApiResponse(200, data, "Users fetched successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // GET /api/superadmin/users/:id
    getUserById: async (req, res, next) => {
        try {
            const user = await SuperAdmin.getUserById(req.params.id);
            if (!user) throw new ApiError(404, "User not found");
            return res.status(200).json(new ApiResponse(200, { user }, "User fetched successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // DELETE /api/superadmin/users/:id
    deleteUser: async (req, res, next) => {
        try {
            const user = await SuperAdmin.getUserById(req.params.id);
            if (!user) throw new ApiError(404, "User not found");

            // Delete Cloudinary image if exists
            if (user.profile_picture) {
                const parts = user.profile_picture.split("/");
                const uploadIndex = parts.indexOf("upload");
                if (uploadIndex !== -1) {
                    let startIndex = uploadIndex + 1;
                    if (/^v\d+$/.test(parts[startIndex])) startIndex++;
                    const publicId = parts.slice(startIndex).join("/").replace(/\.[^/.]+$/, "");
                    const cloudinary = require("cloudinary").v2;
                    await cloudinary.uploader.destroy(publicId);
                }
            }

            await SuperAdmin.deleteUser(req.params.id);
            return res.status(200).json(new ApiResponse(200, {}, "User deleted successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // PATCH /api/superadmin/users/:id/ban
    banUser: async (req, res, next) => {
        try {
            const user = await SuperAdmin.getUserById(req.params.id);
            if (!user) throw new ApiError(404, "User not found");
            if (user.isBanned) throw new ApiError(400, "User is already banned");

            await SuperAdmin.banUser(req.params.id);
            return res.status(200).json(new ApiResponse(200, {}, "User banned successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // PATCH /api/superadmin/users/:id/unban
    unbanUser: async (req, res, next) => {
        try {
            const user = await SuperAdmin.getUserById(req.params.id);
            if (!user) throw new ApiError(404, "User not found");
            if (!user.isBanned) throw new ApiError(400, "User is not banned");

            await SuperAdmin.unbanUser(req.params.id);
            return res.status(200).json(new ApiResponse(200, {}, "User unbanned successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // ADMIN MANAGEMENT
    // ══════════════════════════════════════════════════════════════════════════

    // GET /api/superadmin/admins?page=1&limit=20&search=
    getAllAdmins: async (req, res, next) => {
        try {
            const { page = 1, limit = 20, search = '' } = req.query;
            const data = await SuperAdmin.getAllAdmins({ page: +page, limit: +limit, search });
            return res.status(200).json(new ApiResponse(200, data, "Admins fetched successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // GET /api/superadmin/admins/:id
    getAdminById: async (req, res, next) => {
        try {
            const admin = await SuperAdmin.getAdminById(req.params.id);
            if (!admin) throw new ApiError(404, "Admin not found");
            return res.status(200).json(new ApiResponse(200, { admin }, "Admin fetched successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // PATCH /api/superadmin/admins/:id/approve
    approveAdmin: async (req, res, next) => {
        try {
            const admin = await SuperAdmin.getAdminById(req.params.id);
            if (!admin) throw new ApiError(404, "Admin not found");
            if (admin.superAdminVerified === "YES") throw new ApiError(400, "Admin is already approved");
            if (admin.isBanned) throw new ApiError(400, "Cannot approve a banned admin");

            await SuperAdmin.approveAdmin(req.params.id);

            // Notify admin via email
            await sendEmail({
                to: admin.email,
                subject: "Your admin account has been approved!",
                text: `Hello ${admin.name},\n\nYour admin account has been approved by a super admin. You now have full access to perform all actions.\n\nLogin at: ${process.env.CLIENT_URL}/admin/login`,
            });

            return res.status(200).json(new ApiResponse(200, {}, "Admin approved successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // PATCH /api/superadmin/admins/:id/revoke
    revokeAdmin: async (req, res, next) => {
        try {
            const admin = await SuperAdmin.getAdminById(req.params.id);
            if (!admin) throw new ApiError(404, "Admin not found");
            if (admin.superAdminVerified === "NO") throw new ApiError(400, "Admin is already revoked");

            await SuperAdmin.revokeAdmin(req.params.id);
            return res.status(200).json(new ApiResponse(200, {}, "Admin approval revoked successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // PATCH /api/superadmin/admins/:id/ban
    banAdmin: async (req, res, next) => {
        try {
            const admin = await SuperAdmin.getAdminById(req.params.id);
            if (!admin) throw new ApiError(404, "Admin not found");
            if (admin.isBanned) throw new ApiError(400, "Admin is already banned");

            await SuperAdmin.banAdmin(req.params.id);
            return res.status(200).json(new ApiResponse(200, {}, "Admin banned and approval revoked"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // PATCH /api/superadmin/admins/:id/unban
    unbanAdmin: async (req, res, next) => {
        try {
            const admin = await SuperAdmin.getAdminById(req.params.id);
            if (!admin) throw new ApiError(404, "Admin not found");
            if (!admin.isBanned) throw new ApiError(400, "Admin is not banned");

            await SuperAdmin.unbanAdmin(req.params.id);
            return res.status(200).json(new ApiResponse(200, {}, "Admin unbanned successfully. Re-approve to restore full access."));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // DELETE /api/superadmin/admins/:id
    deleteAdmin: async (req, res, next) => {
        try {
            const admin = await SuperAdmin.getAdminById(req.params.id);
            if (!admin) throw new ApiError(404, "Admin not found");

            if (admin.profile_picture) {
                const parts = admin.profile_picture.split("/");
                const uploadIndex = parts.indexOf("upload");
                if (uploadIndex !== -1) {
                    let startIndex = uploadIndex + 1;
                    if (/^v\d+$/.test(parts[startIndex])) startIndex++;
                    const publicId = parts.slice(startIndex).join("/").replace(/\.[^/.]+$/, "");
                    const cloudinary = require("cloudinary").v2;
                    await cloudinary.uploader.destroy(publicId);
                }
            }

            await SuperAdmin.deleteAdmin(req.params.id);
            return res.status(200).json(new ApiResponse(200, {}, "Admin deleted successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // TOURNAMENT STATS
    // ══════════════════════════════════════════════════════════════════════════

    // GET /api/superadmin/tournaments/stats
    getTournamentStats: async (req, res, next) => {
        try {
            const stats = await SuperAdmin.getTournamentStats();
            return res.status(200).json(new ApiResponse(200, stats, "Tournament stats fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // GET /api/superadmin/tournaments/today
    getTodayTournaments: async (req, res, next) => {
        try {
            const tournaments = await SuperAdmin.getTodayTournaments();
            return res.status(200).json(new ApiResponse(200, { tournaments }, "Today's tournaments fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // GET /api/superadmin/tournaments/upcoming?limit=10
    getUpcomingTournaments: async (req, res, next) => {
        try {
            const { limit = 10 } = req.query;
            const tournaments = await SuperAdmin.getUpcomingTournaments({ limit: +limit });
            return res.status(200).json(new ApiResponse(200, { tournaments }, "Upcoming tournaments fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // SUPER ADMIN MANAGEMENT (by another super admin)
    // ══════════════════════════════════════════════════════════════════════════

    // GET /api/superadmin/all
    getAllSuperAdmins: async (req, res, next) => {
        try {
            const superAdmins = await SuperAdmin.findAll();
            return res.status(200).json(new ApiResponse(200, { superAdmins }, "Super admins fetched"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    // DELETE /api/superadmin/:id  (cannot delete yourself)
    deleteSuperAdmin: async (req, res, next) => {
        try {
            if (+req.params.id === req.superAdmin.id) {
                throw new ApiError(400, "You cannot delete your own super admin account");
            }

            const sa = await SuperAdmin.findById(req.params.id);
            if (!sa) throw new ApiError(404, "Super admin not found");

            await SuperAdmin.deleteById(req.params.id);
            return res.status(200).json(new ApiResponse(200, {}, "Super admin deleted successfully"));
        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },
    getCommissionReport : async (req, res, next) => {
    try {
        const db = require('../DB/index');
        const commissionRate = parseFloat(process.env.COMMISSION_RATE || 0.10);

        // Per admin commission breakdown
        const [admins] = await db.execute(`
            SELECT 
                id, name, organization_name,
                tournaments_organised,
                revenue,
                ROUND(revenue * ?, 2) as commission_owed
            FROM admins
            WHERE superAdminVerified = 'YES'
            ORDER BY revenue DESC
        `, [commissionRate]);

        const [[totals]] = await db.execute(`
            SELECT 
                SUM(revenue) as totalRevenue,
                ROUND(SUM(revenue) * ?, 2) as totalCommission
            FROM admins
            WHERE superAdminVerified = 'YES'
        `, [commissionRate]);

        return res.status(200).json(new ApiResponse(200, {
            commissionRate:  `${commissionRate * 100}%`,
            totalRevenue:    totals.totalRevenue    || 0,
            totalCommission: totals.totalCommission || 0,
            perAdmin:        admins,
        }, "Commission report fetched"));
    } catch (error) {
        next(new ApiError(error.statusCode || 500, error.message));
    }
}
};


module.exports = superAdminController;