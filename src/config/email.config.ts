export default () => ({
  email: {

    isDevelopment: process.env.NODE_ENV === 'development',


    // SMTP Settings
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    
    // Authentication
    user: process.env.EMAIL_USER, // Your email
    password: process.env.EMAIL_PASSWORD, // App password (not your regular password)
    
    // Sender Info
    from: {
      name: process.env.EMAIL_FROM_NAME || 'Donation Platform',
      address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER,
    },
    
    // Features
    enableEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
    verificationTokenExpiry: parseInt(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY || '86400', 10), // 24 hours
    
    // Templates
    templatesPath: process.env.EMAIL_TEMPLATES_PATH || './templates/email',
  },
});
