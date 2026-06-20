import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

/**
 * Twilio Service
 * PURPOSE: Handle SMS and WhatsApp message sending via Twilio
 * PROVIDERS: SMS, WhatsApp
 */
@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private readonly twilioClient: ReturnType<typeof Twilio>;
  private readonly phoneNumber: string;
  private readonly whatsappNumber: string;
  private readonly isDevelopment: boolean;

constructor(private readonly configService: ConfigService) {
  this.isDevelopment = this.configService.get<boolean>(
    'otp.isDevelopment',
    true,
  );

  const accountSid =
    this.configService.get<string>('otp.twilio.accountSid') || '';
  const authToken =
    this.configService.get<string>('otp.twilio.authToken') || '';

  // Cleanly disable (no-op) when not properly configured — don't crash the app.
  // Real credentials: Account SID starts with "AC". Placeholders/dev → disabled.
  if (this.isDevelopment || !accountSid.startsWith('AC') || !authToken) {
    this.logger.warn(
      '⚪ Twilio disabled (not configured) — SMS/WhatsApp sending is a no-op.',
    );
    return;
  }

  this.phoneNumber =
    this.configService.get<string>('otp.twilio.phoneNumber') || '';
  this.whatsappNumber =
    this.configService.get<string>('otp.twilio.whatsappNumber') || '';

  this.twilioClient = Twilio(accountSid, authToken);

  this.logger.log('✅ Twilio client initialized');
}


  /**
   * Send OTP via SMS
   * @param phoneNumber - Recipient phone number (E.164 format: +911234567890)
   * @param otp - OTP code to send
   */
  async sendSMS(phoneNumber: string, otp: string): Promise<void> {
    const message = `Your OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`;

    if (this.isDevelopment || !this.twilioClient) {
      this.logger.debug(`[Twilio off] SMS to ${phoneNumber}: ${message}`);
      return;
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.phoneNumber,
        to: phoneNumber,
      });

      this.logger.log(`SMS sent to ${phoneNumber}. SID: ${result.sid}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
      throw new Error('Failed to send SMS. Please try again.');
    }
  }

  /**
   * Send OTP via WhatsApp
   * @param phoneNumber - Recipient phone number (E.164 format)
   * @param otp - OTP code to send
   */
  async sendWhatsApp(phoneNumber: string, otp: string): Promise<void> {
    const message = `🔐 Your OTP is: *${otp}*\n\nValid for 10 minutes.\nDo not share with anyone.`;

    if (this.isDevelopment || !this.twilioClient) {
      this.logger.debug(`[Twilio off] WhatsApp to ${phoneNumber}: ${message}`);
      return;
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.whatsappNumber,
        to: `whatsapp:${phoneNumber}`,
      });

      this.logger.log(`WhatsApp sent to ${phoneNumber}. SID: ${result.sid}`);
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp to ${phoneNumber}:`, error);
      throw new Error('Failed to send WhatsApp message. Please try again.');
    }
  }

  /**
   * Verify phone number format (E.164)
   * @param phoneNumber - Phone number to verify
   */
  isValidPhoneNumber(phoneNumber: string): boolean {
    // E.164 format: +[country code][number] (e.g., +911234567890)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164
   * @param phoneNumber - Phone number to format
   * @param countryCode - Default country code (e.g., '91' for India)
   */
  formatPhoneNumber(phoneNumber: string, countryCode = '91'): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Add country code if not present
    if (!cleaned.startsWith(countryCode)) {
      cleaned = countryCode + cleaned;
    }

    return `+${cleaned}`;
  }
}
