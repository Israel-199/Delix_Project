import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';

const sanitizeFolder = (folder?: string) => {
  const value = String(folder ?? 'delix_users').trim();
  if (!value || value.includes('..') || value.startsWith('/')) {
    return 'delix_users';
  }
  return value.replace(/[^a-zA-Z0-9/_-]/g, '');
};

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file && !req.body.image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const folder = sanitizeFolder(req.body.folder ?? req.query.folder);

    if (req.file) {
      console.log(`[Upload] Processing multipart file upload (${req.file.size} bytes) → ${folder}`);
      const fallbackDataUri = `data:${req.file.mimetype || 'image/jpeg'};base64,${req.file.buffer.toString('base64')}`;

      try {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: 'image' },
          (error, result) => {
            if (error) {
              console.warn('[Upload Warning] Cloudinary upload stream error (falling back to data URI):', error.message || error);
              return res.status(200).json({
                secure_url: fallbackDataUri,
                fallback: true,
              });
            }
            return res.status(200).json({
              secure_url: result?.secure_url ?? fallbackDataUri,
              public_id: result?.public_id,
            });
          }
        );
        stream.end(req.file.buffer);
      } catch (err: any) {
        console.warn('[Upload Warning] Cloudinary stream throw (falling back to data URI):', err.message || err);
        return res.status(200).json({
          secure_url: fallbackDataUri,
          fallback: true,
        });
      }
    } else if (req.body.image) {
      console.log(`[Upload] Processing base64 image upload → ${folder}`);
      const fileStr = req.body.image.startsWith('data:')
        ? req.body.image
        : `data:image/jpeg;base64,${req.body.image}`;

      try {
        const result = await cloudinary.uploader.upload(fileStr, {
          folder,
          resource_type: 'image',
        });
        return res.status(200).json({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      } catch (err: any) {
        console.warn('[Upload Warning] Cloudinary base64 upload error (falling back to data URI):', err.message || err);
        // If Cloudinary returns 403 or fails, return the image data string as fallback so profile saving never fails
        return res.status(200).json({
          secure_url: fileStr,
          fallback: true,
        });
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Image upload failed';
    console.error('Upload Error:', error);
    
    // If base64 payload exists, return it as fallback rather than throwing 500
    if (req.body?.image) {
      const fileStr = req.body.image.startsWith('data:')
        ? req.body.image
        : `data:image/jpeg;base64,${req.body.image}`;
      return res.status(200).json({ secure_url: fileStr, fallback: true });
    }

    return res.status(500).json({ error: message });
  }
};
