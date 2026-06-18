export default () => ({
  otp: {
    // Development mode settings
    isDevelopment: process.env.NODE_ENV === 'development',
    staticOtp: process.env.OTP_STATIC || '123456', // Static OTP for development
    
    // OTP settings
    otpLength: parseInt(process.env.OTP_LENGTH || '6', 10),
    otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),
    resendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN || '60', 10),
    
    // Twilio SMS settings
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
      whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886', // Twilio WhatsApp sandbox
    },
    
    // Provider preferences
    defaultProvider: process.env.OTP_DEFAULT_PROVIDER || 'sms', // 'sms' or 'whatsapp'
    enableWhatsApp: process.env.ENABLE_WHATSAPP === 'true',
    enableSMS: process.env.ENABLE_SMS === 'true',
  },
});
