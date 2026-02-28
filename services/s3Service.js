const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Configure AWS SDK v3 S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a file buffer to AWS S3
 * @param {Buffer} fileBuffer - The file buffer from Multer memory storage
 * @param {String} originalname - The original name of the file
 * @param {String} mimetype - The mime type of the file
 * @returns {Promise<String>} - The public URL of the uploaded image
 */
const uploadToS3 = async (fileBuffer, originalname, mimetype) => {
  const fileExt = path.extname(originalname);
  const fileName = `members/${uuidv4()}${fileExt}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimetype,
    // Note: Do not use ACL: 'public-read' directly if bucket policies enforce blocking public ACLs.
    // Ensure the bucket has a read-only bucket policy allowing public GET requests if URLs are used directly.
  });

  try {
    await s3Client.send(command);
    // Construct and return the S3 URL
    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    return publicUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload image to S3');
  }
};

module.exports = {
  uploadToS3,
};
