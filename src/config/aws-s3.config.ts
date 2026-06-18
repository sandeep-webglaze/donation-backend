export default () => ({
  aws: {
    s3: {
      region: process.env.AWS_REGION || 'ap-south-1',
      bucket: process.env.AWS_S3_BUCKET,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      
      // File upload settings
      maxFileSize: parseInt(process.env.AWS_MAX_FILE_SIZE || '10485760', 10), // 10MB default
      maxVideoSize: parseInt(process.env.AWS_MAX_VIDEO_SIZE || '104857600', 10), // 100MB default
      
      // Allowed file types
      allowedImageTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ],
      allowedVideoTypes: [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm',
      ],
      
      // Upload paths
      imagePath: process.env.AWS_IMAGE_PATH || 'images',
      videoPath: process.env.AWS_VIDEO_PATH || 'videos',
      userImagePath: process.env.AWS_USER_IMAGE_PATH || 'users/images',
      
      // ACL settings
      acl: process.env.AWS_S3_ACL || 'public-read',
      
      // CloudFront (optional)
      cloudFrontUrl: process.env.AWS_CLOUDFRONT_URL,
    },
  },
});
