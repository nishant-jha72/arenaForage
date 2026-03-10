const bcrypt = require('bcrypt');
const db = require('../DB/index');

const SuperAdmin = {
    
    // ── Core CRUD ─────────────────────────────────────────────────────────────

    create: async ({ name, email, password, createdBy = null }) => {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const sql = `
                INSERT INTO super_admins (name, email, password, created_by)
                VALUES (?, ?, ?, ?)
            `;
            const [result] = await db.execute(sql, [name, email, hashedPassword, createdBy]);
            return { success: true, insertId: result.insertId };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') throw new Error('Email already exists');
            throw error;
        }
    },

    findByEmail: async (email) => {
        const [rows] = await db.execute(`SELECT * FROM super_admins WHERE email = ?`, [email]);
        return rows[0];
    },

    findById: async (id) => {
        const [rows] = await db.execute(`SELECT * FROM super_admins WHERE id = ?`, [id]);
        return rows[0];
    },

    findAll: async () => {
        const [rows] = await db.execute(`SELECT id, name, email, created_by, last_login, created_at FROM super_admins`);
        return rows;
    },

    update: async (id, fields) => {
        const keys = Object.keys(fields);
        if (keys.length === 0) return;
        const setClause = keys.map((k) => `${k} = ?`).join(', ');
        const values = keys.map((k) => fields[k]);
        const [result] = await db.execute(`UPDATE super_admins SET ${setClause} WHERE id = ?`, [...values, id]);
        return result.affectedRows > 0;
    },

    updatePassword: async (id, newPassword) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        const [result] = await db.execute(
            `UPDATE super_admins SET password = ?, resetToken = NULL, resetExpiry = NULL WHERE id = ?`,
            [hashedPassword, id]
        );
        return result.affectedRows > 0;
    },

    comparePassword: async (inputPassword, storedHash) => {
        return await bcrypt.compare(inputPassword, storedHash);
    },

    deleteById: async (id) => {
        const [result] = await db.execute(`DELETE FROM super_admins WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    },

    // ── User Management ───────────────────────────────────────────────────────

    getAllUsers: async ({ page = 1, limit = 20, search = '' } = {}) => {
        const offset = (page - 1) * limit;
        const searchParam = `%${search}%`;
        const [rows] = await db.execute(
            `SELECT id, name, age, gmail, emailVerified, profile_picture, created_at, isBanned
             FROM users
             WHERE name LIKE ? OR gmail LIKE ?
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [searchParam, searchParam, limit, offset]
        );
        const [[{ total }]] = await db.execute(
            `SELECT COUNT(*) as total FROM users WHERE name LIKE ? OR gmail LIKE ?`,
            [searchParam, searchParam]
        );
        return { users: rows, total, page, limit };
    },

    getUserById: async (id) => {
        const [rows] = await db.execute(
            `SELECT id, name, age, gmail, emailVerified, profile_picture, created_at, isBanned FROM users WHERE id = ?`,
            [id]
        );
        return rows[0];
    },

    banUser: async (id) => {
        const [result] = await db.execute(`UPDATE users SET isBanned = 1 WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    },

    unbanUser: async (id) => {
        const [result] = await db.execute(`UPDATE users SET isBanned = 0 WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    },

    deleteUser: async (id) => {
        const [result] = await db.execute(`DELETE FROM users WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    },

    // ── Admin Management ──────────────────────────────────────────────────────

    getAllAdmins: async ({ page = 1, limit = 20, search = '' } = {}) => {
        const offset = (page - 1) * limit;
        const searchParam = `%${search}%`;
        const [rows] = await db.execute(
            `SELECT id, name, email, organization_name, phone_number,
                    emailVerified, superAdminVerified, tournaments_organised,
                    revenue, isBanned, created_at
             FROM admins
             WHERE name LIKE ? OR email LIKE ? OR organization_name LIKE ?
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [searchParam, searchParam, searchParam, limit, offset]
        );
        const [[{ total }]] = await db.execute(
            `SELECT COUNT(*) as total FROM admins WHERE name LIKE ? OR email LIKE ? OR organization_name LIKE ?`,
            [searchParam, searchParam, searchParam]
        );
        return { admins: rows, total, page, limit };
    },

    getAdminById: async (id) => {
        const [rows] = await db.execute(
            `SELECT id, name, email, organization_name, phone_number, profile_picture,
                    instagram, twitter, facebook, linkedin,
                    emailVerified, superAdminVerified, tournaments_organised,
                    revenue, isBanned, created_at
             FROM admins WHERE id = ?`,
            [id]
        );
        return rows[0];
    },

    approveAdmin: async (id) => {
        const [result] = await db.execute(`UPDATE admins SET superAdminVerified = 'YES' WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    },

    revokeAdmin: async (id) => {
        const [result] = await db.execute(`UPDATE admins SET superAdminVerified = 'NO' WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    },

    banAdmin: async (id) => {
        const [result] = await db.execute(`UPDATE admins SET isBanned = 1, superAdminVerified = 'NO' WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    },

    unbanAdmin: async (id) => {
        const [result] = await db.execute(`UPDATE admins SET isBanned = 0 WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    },

    deleteAdmin: async (id) => {
        const [result] = await db.execute(`DELETE FROM admins WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    },

    // ── Dashboard Stats ───────────────────────────────────────────────────────

    getDashboardStats: async () => {
        const [[userStats]]    = await db.execute(`SELECT COUNT(*) as total, SUM(isBanned) as banned FROM users`);
        const [[adminStats]]   = await db.execute(`SELECT COUNT(*) as total, SUM(isBanned) as banned, SUM(superAdminVerified = 'YES') as verified FROM admins`);
        const [[revenueStats]] = await db.execute(`SELECT SUM(revenue) as totalRevenue, SUM(tournaments_organised) as totalTournaments FROM admins`);

        return {
            users: {
                total:  userStats.total  || 0,
                banned: userStats.banned || 0,
                active: (userStats.total || 0) - (userStats.banned || 0),
            },
            admins: {
                total:            adminStats.total    || 0,
                banned:           adminStats.banned   || 0,
                verified:         adminStats.verified || 0,
                pendingApproval:  (adminStats.total || 0) - (adminStats.verified || 0),
            },
            tournaments: {
                total:        revenueStats.totalTournaments || 0,
            },
            revenue: {
                total: revenueStats.totalRevenue || 0,
            },
        };
    },

    // ── Tournament Stats (reads from tournaments table via microservice) ───────
    // These queries assume a `tournaments` table exists (created by microservice)
    // Super admin can still read from it directly

    getTournamentStats: async () => {
        const today = new Date().toISOString().split('T')[0];
        const [todayRows]    = await db.execute(`SELECT COUNT(*) as count FROM tournaments WHERE DATE(start_date) = ?`, [today]);
        const [upcomingRows] = await db.execute(`SELECT COUNT(*) as count FROM tournaments WHERE start_date > NOW()`);
        const [liveRows]     = await db.execute(`SELECT COUNT(*) as count FROM tournaments WHERE start_date <= NOW() AND end_date >= NOW()`);
        const [totalRows]    = await db.execute(`SELECT COUNT(*) as count FROM tournaments`);

        return {
            today:    todayRows[0].count,
            upcoming: upcomingRows[0].count,
            live:     liveRows[0].count,
            total:    totalRows[0].count,
        };
    },

    getUpcomingTournaments: async ({ limit = 10 } = {}) => {
        const [rows] = await db.execute(
            `SELECT t.*, a.name as organizer_name, a.organization_name
             FROM tournaments t
             LEFT JOIN admins a ON t.admin_id = a.id
             WHERE t.start_date > NOW()
             ORDER BY t.start_date ASC
             LIMIT ?`,
            [limit]
        );
        return rows;
    },

    getTodayTournaments: async () => {
        const today = new Date().toISOString().split('T')[0];
        const [rows] = await db.execute(
            `SELECT t.*, a.name as organizer_name, a.organization_name
             FROM tournaments t
             LEFT JOIN admins a ON t.admin_id = a.id
             WHERE DATE(t.start_date) = ?
             ORDER BY t.start_date ASC`,
            [today]
        );
        return rows;
    },
    getCommissionStats : async () => {
    const commissionRate = parseFloat(process.env.COMMISSION_RATE || 0.10);

    const [[stats]] = await db.execute(`
        SELECT 
            SUM(revenue) as totalRevenue,
            COUNT(*) as totalAdmins,
            SUM(tournaments_organised) as totalTournaments
        FROM admins 
        WHERE superAdminVerified = 'YES'
    `);

    const totalRevenue   = parseFloat(stats.totalRevenue || 0);
    const commission     = totalRevenue * commissionRate;

    return {
        totalRevenue,
        commission,
        commissionRate: `${commissionRate * 100}%`,
        totalAdmins:      stats.totalAdmins,
        totalTournaments: stats.totalTournaments,
    };
}
};


module.exports = SuperAdmin;