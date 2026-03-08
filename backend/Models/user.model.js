const bcrypt = require('bcrypt');
const db = require('../DB/index'); // Import your mysql2 pool connection

const User = {
  create: async (name, age, gmail, profilePicture, password) => {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const sql = `
        INSERT INTO users (name, age, gmail, profile_picture, password, emailVerified) 
        VALUES (?, ?, ?, ?, ?, 'NO')
      `;
      
      const [result] = await db.execute(sql, [
        name, 
        age, 
        gmail, 
        profilePicture || null, 
        hashedPassword
      ]);

      return { success: true, userId: result.insertId };
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
    return rows[0]; // Returns the user object or undefined
  },

  comparePassword: async (inputPassword, storedHash) => {
    return await bcrypt.compare(inputPassword, storedHash);
  },

  verifyEmail: async (userId) => {
    const sql = `UPDATE users SET emailVerified = 'YES' WHERE id = ?`;
    const [result] = await db.execute(sql, [userId]);
    return result.affectedRows > 0;
  }
};

module.exports = User;