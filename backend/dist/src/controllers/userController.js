"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.updateProfile = void 0;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
/**
 * Optimised Profile Update functionality
 * Handles first-time setup or editing profile
 */
const updateProfile = async (req, res) => {
    try {
        const { firstName, middleName, lastName, profilePhoto } = req.body;
        // First Name, Middle Name, Last Name are required
        if (!firstName?.trim() || !middleName?.trim() || !lastName?.trim()) {
            return res.status(400).json({
                error: 'First name, middle name, and last name are required'
            });
        }
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
        }
        const rawToken = (authHeader.split(' ')[1] || '').trim();
        const token = rawToken.replace(/^["']|["']$/g, '');
        let decoded;
        try {
            const primarySecret = process.env.JWT_SECRET || 'delix_secret';
            try {
                decoded = jsonwebtoken_1.default.verify(token, primarySecret);
            }
            catch {
                decoded = jsonwebtoken_1.default.verify(token, 'delix_secret');
            }
        }
        catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        const phone = decoded.phone;
        if (!phone) {
            return res.status(401).json({ error: 'Invalid token payload' });
        }
        // Upsert user profile so existing user is updated or a new record is created seamlessly
        const updatedUser = await prisma.user.upsert({
            where: { phone },
            update: {
                firstName: firstName.trim(),
                middleName: middleName.trim(),
                lastName: lastName.trim(),
                profilePhotoUrl: profilePhoto || null,
            },
            create: {
                phone,
                firstName: firstName.trim(),
                middleName: middleName.trim(),
                lastName: lastName.trim(),
                profilePhotoUrl: profilePhoto || null,
                role: decoded.role || 'CUSTOMER',
            },
        });
        return res.status(200).json({
            success: true,
            message: 'Profile successfully updated',
            user: updatedUser,
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ error: error.message || 'Profile update failed' });
    }
};
exports.updateProfile = updateProfile;
/**
 * Fetch Current User Profile
 */
const getProfile = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
        }
        const rawToken = (authHeader.split(' ')[1] || '').trim();
        const token = rawToken.replace(/^["']|["']$/g, '');
        let decoded;
        try {
            const primarySecret = process.env.JWT_SECRET || 'delix_secret';
            try {
                decoded = jsonwebtoken_1.default.verify(token, primarySecret);
            }
            catch {
                decoded = jsonwebtoken_1.default.verify(token, 'delix_secret');
            }
        }
        catch (err) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        const phone = decoded.phone;
        if (!phone) {
            return res.status(401).json({ error: 'Invalid token payload' });
        }
        const user = await prisma.user.findUnique({
            where: { phone },
        });
        if (!user) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        return res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to fetch user profile' });
    }
};
exports.getProfile = getProfile;
