const User = require('../Models/user.model');
const jwt = require('jsonwebtoken');
const ApiError = require('../Utils/ApiError.utils');       // Adjust path as needed
const ApiResponse = require('../Utils/ApiResponse.utils'); // Adjust path as needed

const JWT_SECRET = process.env.JWT_SECRET;

const userController = {
  register: async (req, res, next) => {
    try {
      const { name, age, gmail, profilePicture, password } = req.body;

      if ([name, gmail, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Name, Gmail, and Password are required");
      }

      const result = await User.create(name, age, gmail, profilePicture, password);
      
      return res.status(201).json(
        new ApiResponse(201, { userId: result.userId }, "User registered successfully")
      );

    } catch (error) {
      // If the model threw an "Email already exists" error
      if (error.message === 'Email already exists') {
        return next(new ApiError(409, error.message));
      }
      next(new ApiError(500, error.message || "Registration failed"));
    }
  },

  login: async (req, res, next) => {
    try {
      const { gmail, password } = req.body;

      const user = await User.findByEmail(gmail);
      if (!user) {
        throw new ApiError(401, "Invalid credentials");
      }

      const isMatch = await User.comparePassword(password, user.password);
      if (!isMatch) {
        throw new ApiError(401, "Invalid credentials");
      }

      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });

      return res.status(200).json(
        new ApiResponse(200, { token, user: { name: user.name, id: user.id } }, "Login successful")
      );

    } catch (error) {
      next(new ApiError(500, error.message));
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const userId = req.params.id;
      const { name, age, profilePicture } = req.body;

      // Ensure the logged-in user is only updating themselves
      if (req.user.id != userId) {
        throw new ApiError(403, "You are not authorized to update this profile");
      }

      const sql = `UPDATE users SET name = ?, age = ?, profile_picture = ? WHERE id = ?`;
      const [result] = await db.execute(sql, [name, age, profilePicture, userId]);

      if (result.affectedRows === 0) {
        throw new ApiError(404, "User not found");
      }

      return res.status(200).json(
        new ApiResponse(200, null, "Profile updated successfully")
      );

    } catch (error) {
      next(new ApiError(500, error.message));
    }
  },

  verifyEmail: async (req, res, next) => {
    try {
      const userId = req.params.id;
      const success = await User.verifyEmail(userId);
      if (!success) throw new ApiError(404, "User not found");
      
      return res.status(200).json(
        new ApiResponse(200, null, "Email verified successfully")
      );
    } catch (error) {
      next(new ApiError(500, error.message));
    }
  }
};

module.exports = userController;