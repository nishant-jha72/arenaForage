const bcrypt = require('bcrypt');
const db = require('../DB/index');

const User = {

    create: async (name, age, gmail, profilePicture, password, verificationToken, verificationExpiry) => {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const sql = `
                INSERT INTO users (name, age, gmail, profile_picture, password, emailVerified, verificationToken, verificationExpiry) 
                VALUES (?, ?, ?, ?, ?, 'NO', ?, ?)
            `;

            const [result] = await db.execute(sql, [
                name,
                age,
                gmail,
                profilePicture || null,
                hashedPassword,
                verificationToken,
                verificationExpiry
            ]);

            return { success: true, insertId: result.insertId };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Email already exists');
            }
            throw error;
        }
    },

    findByEmail: async (gmail) => {
        const sql = `SELECT * FROM users WHERE gmail = ?`;
        const [rows] = await db.execute(sql, [gmail]);
        return rows[0];
    },

    findById: async (id) => {
        const sql = `SELECT * FROM users WHERE id = ?`;
        const [rows] = await db.execute(sql, [id]);
        return rows[0];
    },

    comparePassword: async (inputPassword, storedHash) => {
        return await bcrypt.compare(inputPassword, storedHash);
    },

    // Generic update — pass an object of columns to update
    // e.g. User.update(1, { refreshToken: 'abc', emailVerified: 'YES' })
    update: async (id, fields) => {
        const keys = Object.keys(fields);
        if (keys.length === 0) return;

        const setClause = keys.map((k) => `${k} = ?`).join(', ');
        const values = keys.map((k) => fields[k]);

        const sql = `UPDATE users SET ${setClause} WHERE id = ?`;
        const [result] = await db.execute(sql, [...values, id]);
        return result.affectedRows > 0;
    },

    // Hash password before updating (used in resetPassword)
    updatePassword: async (id, newPassword) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        const sql = `UPDATE users SET password = ?, resetToken = NULL, resetExpiry = NULL WHERE id = ?`;
        const [result] = await db.execute(sql, [hashedPassword, id]);
        return result.affectedRows > 0;
    },

    verifyEmail: async (userId) => {
        const sql = `UPDATE users SET emailVerified = 'YES', verificationToken = NULL, verificationExpiry = NULL WHERE id = ?`;
        const [result] = await db.execute(sql, [userId]);
        return result.affectedRows > 0;
    },

    deleteById: async (id) => {
        const sql = `DELETE FROM users WHERE id = ?`;
        const [result] = await db.execute(sql, [id]);
        return result.affectedRows > 0;
    }
};

module.exports = User;