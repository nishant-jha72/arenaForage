const bcrypt = require('bcrypt');
const db = require('../DB/index');

const Admin = {

    create: async ({
        name,
        email,
        password,
        profilePicture,
        organizationName,
        phoneNumber,
        instagram,
        twitter,
        facebook,
        linkedin,
        verificationToken,
        verificationExpiry
    }) => {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const sql = `
                INSERT INTO admins (
                    name, email, password, profile_picture,
                    organization_name, phone_number,
                    instagram, twitter, facebook, linkedin,
                    emailVerified, superAdminVerified,
                    tournaments_organised, revenue,
                    verificationToken, verificationExpiry
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NO', 'NO', 0, 0.00, ?, ?)
            `;

            const [result] = await db.execute(sql, [
                name,
                email,
                hashedPassword,
                profilePicture || null,
                organizationName || null,
                phoneNumber || null,
                instagram || null,
                twitter || null,
                facebook || null,
                linkedin || null,
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

    findByEmail: async (email) => {
        const sql = `SELECT * FROM admins WHERE email = ?`;
        const [rows] = await db.execute(sql, [email]);
        return rows[0];
    },

    findById: async (id) => {
        const sql = `SELECT * FROM admins WHERE id = ?`;
        const [rows] = await db.execute(sql, [id]);
        return rows[0];
    },

    comparePassword: async (inputPassword, storedHash) => {
        return await bcrypt.compare(inputPassword, storedHash);
    },

    update: async (id, fields) => {
        const keys = Object.keys(fields);
        if (keys.length === 0) return;

        const setClause = keys.map((k) => `${k} = ?`).join(', ');
        const values = keys.map((k) => fields[k]);

        const sql = `UPDATE admins SET ${setClause} WHERE id = ?`;
        const [result] = await db.execute(sql, [...values, id]);
        return result.affectedRows > 0;
    },

    updatePassword: async (id, newPassword) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        const sql = `UPDATE admins SET password = ?, resetToken = NULL, resetExpiry = NULL WHERE id = ?`;
        const [result] = await db.execute(sql, [hashedPassword, id]);
        return result.affectedRows > 0;
    },

    verifyEmail: async (id) => {
        const sql = `UPDATE admins SET emailVerified = 'YES', verificationToken = NULL, verificationExpiry = NULL WHERE id = ?`;
        const [result] = await db.execute(sql, [id]);
        return result.affectedRows > 0;
    },

    deleteById: async (id) => {
        const sql = `DELETE FROM admins WHERE id = ?`;
        const [result] = await db.execute(sql, [id]);
        return result.affectedRows > 0;
    },

    // Called by super admin to approve an admin
    verifybySuperAdmin: async (id) => {
        const sql = `UPDATE admins SET superAdminVerified = 'YES' WHERE id = ?`;
        const [result] = await db.execute(sql, [id]);
        return result.affectedRows > 0;
    },

    // Increment tournament count and add revenue
    recordTournament: async (id, revenueEarned = 0) => {
        const sql = `
            UPDATE admins 
            SET tournaments_organised = tournaments_organised + 1,
                revenue = revenue + ?
            WHERE id = ?
        `;
        const [result] = await db.execute(sql, [revenueEarned, id]);
        return result.affectedRows > 0;
    }
};

module.exports = Admin;