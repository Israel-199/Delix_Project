const { v2: cloudinary } = require('cloudinary');
require('dotenv').config({ path: 'C:/Users/Delix_Project/backend/.env' });

console.log('CLOUD_NAME:', process.env.CLOUD_NAME);
console.log('API_KEY:', process.env.API_KEY);
console.log('API_SECRET length:', process.env.API_SECRET ? process.env.API_SECRET.length : 0);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Try pinging account or uploading a tiny dummy 1x1 png base64
const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testUpload() {
  try {
    const res = await cloudinary.uploader.upload(dummyBase64, {
      folder: 'test_folder',
    });
    console.log('SUCCESS:', res);
  } catch (err) {
    console.error('CLOUDINARY ERROR:', err);
  }
}

testUpload();
