const db = require('../DB/index');

const Notification = {

    create: async ({ userId, userType, title, message, type }) => {
        const sql = `
            INSERT INTO notifications (user_id, user_type, title, message, type, is_read)
            VALUES (?, ?, ?, ?, ?, 0)
        `;
        const [result] = await db.execute(sql, [
            Number(userId), userType, title, message, type
        ]);
        return { success: true, insertId: result.insertId };
    },

    createBulk: async (notifications) => {
        if (!notifications.length) return;
        const values = notifications.map(n => [
            Number(n.userId), n.userType, n.title, n.message, n.type, 0
        ]);
        const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
        const flat = values.flat();
        const sql = `INSERT INTO notifications (user_id, user_type, title, message, type, is_read) VALUES ${placeholders}`;
        const [result] = await db.execute(sql, flat);
        return { success: true, count: result.affectedRows };
    },

   getByUser: async (userId, userType, { page = 1, limit = 20 } = {}) => {
    const uid = Number(userId);
    const lim = parseInt(limit, 10);
    const off = parseInt((page - 1) * lim, 10);

    // Use .query() for LIMIT/OFFSET — .execute() rejects non-literal integers
    const [rows] = await db.query(
        `SELECT * FROM notifications
         WHERE user_id = ? AND user_type = ?
         ORDER BY created_at DESC
         LIMIT ${lim} OFFSET ${off}`,   // ← inline integers, not bound params
        [uid, userType]
    );

    const [[{ total }]] = await db.execute(
        `SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND user_type = ?`,
        [uid, userType]
    );
    const [[{ unread }]] = await db.execute(
        `SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND user_type = ? AND is_read = 0`,
        [uid, userType]
    );

    return { notifications: rows, total, unread, page: Number(page), limit: lim };
},

    markAsRead: async (id, userId, userType) => {
        const [result] = await db.execute(
            `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ? AND user_type = ?`,
            [Number(id), Number(userId), userType]
        );
        return result.affectedRows > 0;
    },

    markAllAsRead: async (userId, userType) => {
        const [result] = await db.execute(
            `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND user_type = ? AND is_read = 0`,
            [Number(userId), userType]
        );
        return result.affectedRows;
    },

    deleteById: async (id, userId) => {
        const [result] = await db.execute(
            `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
            [Number(id), Number(userId)]
        );
        return result.affectedRows > 0;
    },

    getUnreadCount: async (userId, userType) => {
        const [[{ count }]] = await db.execute(
            `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND user_type = ? AND is_read = 0`,
            [Number(userId), userType]
        );
        return count;
    },
};

module.exports = Notification;