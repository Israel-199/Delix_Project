"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const uploadImage = async (req, res) => {
    try {
        if (!req.file && !req.body.image) {
            return res.status(400).json({ error: 'No image provided' });
        }
        if (req.file) {
            // Handle Multer file upload stream
            const stream = cloudinary_1.default.uploader.upload_stream({ folder: 'delix_users' }, (error, result) => {
                if (error) {
                    console.error('Cloudinary upload stream error:', error);
                    return res.status(500).json({ error: 'Image upload failed' });
                }
                return res.status(200).json({ secure_url: result?.secure_url });
            });
            stream.end(req.file.buffer);
        }
        else if (req.body.image) {
            // Handle direct base64 upload
            const result = await cloudinary_1.default.uploader.upload(req.body.image, {
                folder: 'delix_users',
            });
            return res.status(200).json({ secure_url: result.secure_url });
        }
    }
    catch (error) {
        console.error('Upload Error:', error);
        return res.status(500).json({ error: error.message || 'Image upload failed' });
    }
};
exports.uploadImage = uploadImage;
