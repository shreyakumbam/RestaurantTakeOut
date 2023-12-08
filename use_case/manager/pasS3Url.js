const dotenv = require('dotenv');
const aws = require('aws-sdk');

dotenv.config(); // Load environment variables from .env file if it exists

const region = process.env.DB_REGION;
const bucketName = process.env.S3_BUCKET_NAME;
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

const s3 = new aws.S3({
  region,
  accessKeyId,
  secretAccessKey,
  signatureVersion: 'v4'
});

async function generateUploadURL(imageName) {
    const params = {
    Bucket: bucketName,
    Key: imageName,
    Expires: 60
    };
    
    const uploadURL = await s3.getSignedUrlPromise('putObject', params);
    return uploadURL;
}

module.exports = { generateUploadURL };
