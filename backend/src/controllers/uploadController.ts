import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file && !req.body.image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (req.file) {
      console.log(`[Upload] Processing multipart file upload (${req.file.size} bytes)`);
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'delix_users', resource_type: 'image' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload stream error:', error);
            return res.status(500).json({ error: error.message || 'Image upload failed' });
          }
          return res.status(200).json({ secure_url: result?.secure_url });
        }
      );
      stream.end(req.file.buffer);
    } else if (req.body.image) {
      console.log('[Upload] Processing base64 image upload');
      const fileStr = req.body.image.startsWith('data:') 
        ? req.body.image 
        : `data:image/jpeg;base64,${req.body.image}`;
        
      const result = await cloudinary.uploader.upload(fileStr, {
        folder: 'delix_users',
        resource_type: 'image',
      });
      return res.status(200).json({ secure_url: result.secure_url });
    }
  } catch (error: any) {
    console.error('Upload Error:', error);
    return res.status(500).json({ error: error.message || 'Image upload failed' });
  }
};
