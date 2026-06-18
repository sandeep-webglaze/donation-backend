import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { EmailTemplateService } from './email-template.service';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
  }>;
}

/**
 * Email Service
 * PURPOSE: Send emails using Nodemailer
 * FEATURES: SMTP, Gmail, templates, attachments
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private readonly isDevelopment: boolean;
  private readonly fromName: string;
  private readonly fromAddress: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {
    this.isDevelopment = this.configService.get<boolean>(
      'email.isDevelopment',
      true,
    );
    this.fromName = this.configService.get<string>(
      'email.from.name',
      'Donation Platform',
    );
    this.fromAddress =
      this.configService.get<string>('email.from.address')?.toString() || '';

    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
 private initializeTransporter() {
  if (this.isDevelopment) {
    this.logger.warn('📧 Email disabled (DEV MODE)');
    return; // 🔥 VERY IMPORTANT
  }

  const host = this.configService.get<string>('email.host');
  const port = this.configService.get<number>('email.port');
  const secure = this.configService.get<boolean>('email.secure');
  const user = this.configService.get<string>('email.user');
  const password = this.configService.get<string>('email.password');

  if (!user || !password) {
    this.logger.warn('Email credentials not configured');
    return;
  }

  this.transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass: password,
    },
  });

  this.transporter.verify((error) => {
    if (error) {
      this.logger.error('Email transporter verification failed:', error);
    } else {
      this.logger.log('📧 Email server ready');
    }
  });
}

  /**
   * Send email
   */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    const { to, subject, html, text, attachments } = options;

    const mailOptions = {
      from: `"${this.fromName}" <${this.fromAddress}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text,
      attachments,
    };

    if (this.isDevelopment || !this.transporter) {
      this.logger.debug(`[DEV MODE] Email would be sent to: ${mailOptions.to}`);
      this.logger.debug(`Subject: ${subject}`);
      this.logger.debug(`HTML: ${html?.substring(0, 100)}...`);
      return;
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${mailOptions.to}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${mailOptions.to}:`, error);
      throw new Error('Failed to send email. Please try again later.');
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    const html = this.emailTemplateService.getWelcomeEmail(userName);
    await this.sendEmail({
      to,
      subject: 'Welcome! 🎉',
      html,
    });
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(
    to: string,
    userName: string,
    verificationLink: string,
  ): Promise<void> {
    const html = this.emailTemplateService.getVerificationEmail(
      userName,
      verificationLink,
    );
    await this.sendEmail({
      to,
      subject: 'Verify Your Email Address',
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    userName: string,
    resetLink: string,
  ): Promise<void> {
    const html = this.emailTemplateService.getPasswordResetEmail(
      userName,
      resetLink,
    );
    await this.sendEmail({
      to,
      subject: 'Reset Your Password',
      html,
    });
  }

  /**
   * Send OTP email
   */
  async sendOtpEmail(to: string, userName: string, otp: string): Promise<void> {
    const html = this.emailTemplateService.getOtpEmail(userName, otp);
    await this.sendEmail({
      to,
      subject: 'Your OTP Code',
      html,
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(
    to: string,
    userName: string,
    orderId: string,
    orderTotal: string,
    orderItems: Array<{ name: string; quantity: number; price: string }>,
  ): Promise<void> {
    const html = this.emailTemplateService.getOrderConfirmationEmail(
      userName,
      orderId,
      orderTotal,
      orderItems,
    );
    await this.sendEmail({
      to,
      subject: `Order Confirmation - #${orderId}`,
      html,
    });
  }

  /**
   * Send password changed notification
   */
  async sendPasswordChangedEmail(to: string, userName: string): Promise<void> {
    const html = this.emailTemplateService.getPasswordChangedEmail(userName);
    await this.sendEmail({
      to,
      subject: 'Password Changed Successfully',
      html,
    });
  }

  /**
   * Send custom email
   */
  async sendCustomEmail(
    to: string | string[],
    subject: string,
    html: string,
    attachments?: Array<{
      filename: string;
      path?: string;
      content?: Buffer | string;
    }>,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject,
      html,
      attachments,
    });
  }
}
