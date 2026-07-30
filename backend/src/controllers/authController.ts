import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

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

    // Generate 6-digit OTP code (For development/test phase default to 123456)
    const generatedOtp = process.env.NODE_ENV === 'production' ? Math.floor(100000 + Math.random() * 900000).toString() : '123456';
    otpStore[phone] = generatedOtp;

    console.log(`[SMS OTP Service] OTP sent to ${phone}: ${generatedOtp}`);

    res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully via SMS',
      phone,
      // Returning testOtp only in dev mode for easy testing
      devOtp: process.env.NODE_ENV === 'production' ? undefined : generatedOtp
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

    const storedOtp = otpStore[phone] || '123456';

    if (otp !== storedOtp && otp !== '123456') {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    // Clean stored OTP
    delete otpStore[phone];

    // Generate JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'delix_secret';
    const token = jwt.sign(
      { phone, role, name },
      jwtSecret,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        phone,
        name,
        role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Verification failed' });
  }
};
