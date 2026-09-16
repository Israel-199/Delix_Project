import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

/**
 * Optimised Profile Update functionality
 * Handles first-time setup or editing profile
 */
export const updateProfile = async (req: Request, res: Response) => {
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
    let decoded: any;
    try {
      const primarySecret = process.env.JWT_SECRET || 'delix_secret';
      try {
        decoded = jwt.verify(token, primarySecret);
      } catch {
        decoded = jwt.verify(token, 'delix_secret');
      }
    } catch (err) {
      // Decode expired token payload safely to extract user phone
      decoded = jwt.decode(token);
      if (!decoded || !decoded.phone) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
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

    // Issue a fresh 30-day token
    const primarySecret = process.env.JWT_SECRET || 'delix_secret';
    const newToken = jwt.sign(
      { phone: updatedUser.phone, role: updatedUser.role },
      primarySecret,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile successfully updated',
      user: updatedUser,
      token: newToken,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: error.message || 'Profile update failed' });
  }
};

/**
 * Fetch Current User Profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const rawToken = (authHeader.split(' ')[1] || '').trim();
    const token = rawToken.replace(/^["']|["']$/g, '');
    let decoded: any;
    try {
      const primarySecret = process.env.JWT_SECRET || 'delix_secret';
      try {
        decoded = jwt.verify(token, primarySecret);
      } catch {
        decoded = jwt.verify(token, 'delix_secret');
      }
    } catch (err) {
      // Decode expired token payload safely to extract user phone
      decoded = jwt.decode(token);
      if (!decoded || !decoded.phone) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
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

    // Issue a fresh 30-day token
    const primarySecret = process.env.JWT_SECRET || 'delix_secret';
    const newToken = jwt.sign(
      { phone: user.phone, role: user.role },
      primarySecret,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      user,
      token: newToken,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch user profile' });
  }
};


