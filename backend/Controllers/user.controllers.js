const User = require("../Models/user.model");
const jwt = require("jsonwebtoken");
const ApiError = require("../Utils/ApiError.utils");
const ApiResponse = require("../Utils/ApiResponse.utils");
const uploadOnCloudinary = require("../Utils/cloudinary.utils");


const generateAccessAndRefreshTokens = async (userId) => {
    const accessToken = jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

const userController = {
    // THIS WAS THE MISSING PIECE:
    register: async (req, res, next) => {
        try {
            const { name, age, gmail, password } = req.body;

            // 1. Validation
            if ([name, gmail, password].some((field) => field?.trim() === "")) {
                throw new ApiError(400, "All fields (Name, Gmail, Password) are required");
            }

            // 2. Check if user already exists
            const existedUser = await User.findByEmail(gmail);
            if (existedUser) {
                throw new ApiError(409, "User with this email already exists");
            }

            // 3. Handle File Upload
            const profilePictureLocalPath = req.file?.path;
            if (!profilePictureLocalPath) {
                throw new ApiError(400, "Profile picture is required");
            }

            const cloudResponse = await uploadOnCloudinary(profilePictureLocalPath);
            if (!cloudResponse) {
                throw new ApiError(400, "Failed to upload image to Cloudinary");
            }

            // 4. Create User in MySQL
            const result = await User.create(
                name,
                age,
                gmail,
                cloudResponse.url, // Cloudinary URL
                password
            );

            // 5. Send Response
            return res.status(201).json(
                new ApiResponse(201, { userId: result.insertId }, "User registered successfully")
            );

        } catch (error) {
            next(new ApiError(error.statusCode || 500, error.message));
        }
    },

    login: async (req, res, next) => {
        try {
            const { gmail, password } = req.body;
            const user = await User.findByEmail(gmail);
            
            if (!user || !(await User.comparePassword(password, user.password))) {
                throw new ApiError(401, "Invalid email or password");
            }

            const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

            const options = { httpOnly: true, secure: true, sameSite: 'None' };

            return res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", refreshToken, options)
                .json(new ApiResponse(200, { 
                    user: { id: user.id, name: user.name, gmail: user.gmail } 
                }, "Login successful"));
        } catch (error) {
            next(new ApiError(500, error.message));
        }
    },

    logout: async (req, res, next) => {
        const options = { httpOnly: true, secure: true, sameSite: 'None' };
        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "Logged out successfully"));
    }
};

module.exports = userController;