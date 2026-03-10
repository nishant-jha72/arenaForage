const db = require('../DB/index');

const Notification = {

    create: async ({ userId, userType, title, message, type }) => {
        // userType: 'user' | 'admin'
        // type: 'tournament' | 'team' | 'account' | 'general'
        const sql = `
            INSERT INTO notifications (user_id, user_type, title, message, type, is_read)
            VALUES (?, ?, ?, ?, ?, 0)
        `;
        const [result] = await db.execute(sql, [userId, userType, title, message, type]);
        return { success: true, insertId: result.insertId };
    },

    // Create notification for multiple users at once
    createBulk: async (notifications) => {
        if (!notifications.length) return;
        const values = notifications.map(n => [n.userId, n.userType, n.title, n.message, n.type, 0]);
        const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
        const flat = values.flat();
        const sql = `INSERT INTO notifications (user_id, user_type, title, message, type, is_read) VALUES ${placeholders}`;
        const [result] = await db.execute(sql, flat);
        return { success: true, count: result.affectedRows };
    },

    getByUser: async (userId, userType, { page = 1, limit = 20 } = {}) => {
        const offset = (page - 1) * limit;
        const sql = `
            SELECT * FROM notifications
            WHERE user_id = ? AND user_type = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.execute(sql, [userId, userType, limit, offset]);
        const [[{ total }]] = await db.execute(
            `SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND user_type = ?`,
            [userId, userType]
        );
        const [[{ unread }]] = await db.execute(
            `SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND user_type = ? AND is_read = 0`,
            [userId, userType]
        );
        return { notifications: rows, total, unread, page, limit };
    },

    markAsRead: async (id, userId, userType) => {
        const [result] = await db.execute(
            `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ? AND user_type = ?`,
            [id, userId, userType]
        );
        return result.affectedRows > 0;
    },

    markAllAsRead: async (userId, userType) => {
        const [result] = await db.execute(
            `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND user_type = ? AND is_read = 0`,
            [userId, userType]
        );
        return result.affectedRows;
    },

    deleteById: async (id, userId) => {
        const [result] = await db.execute(
            `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
            [id, userId]
        );
        return result.affectedRows > 0;
    },

    getUnreadCount: async (userId, userType) => {
        const [[{ count }]] = await db.execute(
            `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND user_type = ? AND is_read = 0`,
            [userId, userType]
        );
        return count;
    },
};

module.exports = Notification;