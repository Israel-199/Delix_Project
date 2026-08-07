import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock OTP storage for SMS auth (Twilio / Africa's Talking / local SMS gateway in production)
const otpStore: Record<string, string> = {};

/**
 * Request SMS OTP for Customer or Driver login
 */
export const requestOtp = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
};

/**
 * Verify SMS OTP & issue JWT Auth Token
 */
export const verifyOtp = async (req: Request, res: Response) => {
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
    const token = jwt.sign(
      { phone, role },
      jwtSecret,
      { expiresIn: '30d' }
    );

    // Fast sync to Database
    let userRecord = await prisma.user.findUnique({ where: { phone } });
    if (!userRecord) {
      userRecord = await prisma.user.create({
        data: {
          phone,
          role: role as any,
        }
      });
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
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Verification failed' });
  }
};

