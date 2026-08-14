"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.requestOtp = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Mock OTP storage for SMS auth (Twilio / Africa's Talking / local SMS gateway in production)
const otpStore = {};
/**
 * Request SMS OTP for Customer or Driver login
 */
const requestOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ error: 'Phone number is required' });
        }
        // Generate random 6-digit OTP code always
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[phone] = generatedOtp;
        console.log(`[SMS OTP Service] OTP sent to ${phone}: ${generatedOtp}`);
        res.status(200).json({
            success: true,
            message: 'OTP sent successfully via SMS',
            phone,
            // Returning testOtp only in dev mode for easy testing (or always for now until SMS gateway)
            devOtp: generatedOtp
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Failed to send OTP' });
    }
};
exports.requestOtp = requestOtp;
/**
 * Verify SMS OTP & issue JWT Auth Token
 */
const verifyOtp = async (req, res) => {
    try {
        const { phone, otp, role = 'CUSTOMER', name = 'Delix User' } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({ error: 'Phone and OTP code are required' });
        }
        const storedOtp = otpStore[phone];
        if (!storedOtp || otp !== storedOtp) {
            return res.status(400).json({ error: 'Invalid or expired OTP code' });
        }
        // Clean stored OTP
        delete otpStore[phone];
        // Generate JWT Token
        const jwtSecret = process.env.JWT_SECRET || 'delix_secret';
        const token = jsonwebtoken_1.default.sign({ phone, role }, jwtSecret, { expiresIn: '30d' });
        // Fast sync to Database
        let userRecord = await prisma.user.findUnique({ where: { phone } });
        if (!userRecord) {
            userRecord = await prisma.user.create({
                data: {
                    phone,
                    role: role,
                }
            });
        }
        if (userRecord.isBlocked) {
            return res.status(403).json({ error: 'This account has been blocked. Contact Delix support.' });
        }
        const fullNameParts = [userRecord.firstName, userRecord.middleName, userRecord.lastName].filter(Boolean);
        const fullName = fullNameParts.length > 0 ? fullNameParts.join(' ') : 'Delix User';
        res.status(200).json({
            success: true,
            message: 'Authentication successful',
            token,
            user: {
                phone: userRecord.phone,
                name: fullName,
                role: userRecord.role,
                isProfileComplete: !!(userRecord.firstName && userRecord.middleName && userRecord.lastName)
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Verification failed' });
    }
};
exports.verifyOtp = verifyOtp;
