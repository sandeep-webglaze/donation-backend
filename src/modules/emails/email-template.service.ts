import { Injectable } from '@nestjs/common';

/**
 * Email Template Service
 * PURPOSE: Generate HTML email templates
 * FEATURES: Welcome, Reset Password, OTP, Order Confirmation
 */
@Injectable()
export class EmailTemplateService {
  /**
   * Base HTML template wrapper
   */
  private getBaseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 30px 40px;
      color: #333333;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #6c757d;
      font-size: 12px;
    }
    .otp-box {
      background-color: #f8f9fa;
      border: 2px dashed #667eea;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .otp-code {
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      letter-spacing: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Donation Platform. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Welcome Email Template
   */
  getWelcomeEmail(userName: string): string {
    const content = `
      <div class="header">
        <h1>Welcome! 🎉</h1>
      </div>
      <div class="content">
        <h2>Hi ${userName}!</h2>
        <p>Thank you for your support. We're excited to have you on board!</p>
        <p>Here's what you can do next:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Browse our products</li>
          <li>Add items to your wishlist</li>
          <li>Start shopping!</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <a href="https://yourapp.com/dashboard" class="button">Go to Dashboard</a>
      </div>
    `;
    return this.getBaseTemplate(content);
  }

  /**
   * Email Verification Template
   */
  getVerificationEmail(userName: string, verificationLink: string): string {
    const content = `
      <div class="header">
        <h1>Verify Your Email 📧</h1>
      </div>
      <div class="content">
        <h2>Hi ${userName}!</h2>
        <p>Please verify your email address to complete your registration.</p>
        <p>Click the button below to verify your email:</p>
        <a href="${verificationLink}" class="button">Verify Email</a>
        <p style="margin-top: 20px; font-size: 12px; color: #6c757d;">
          If you didn't create an account, please ignore this email.
        </p>
        <p style="font-size: 12px; color: #6c757d;">
          Link expires in 24 hours.
        </p>
      </div>
    `;
    return this.getBaseTemplate(content);
  }

  /**
   * Password Reset Template
   */
  getPasswordResetEmail(userName: string, resetLink: string): string {
    const content = `
      <div class="header">
        <h1>Reset Your Password 🔒</h1>
      </div>
      <div class="content">
        <h2>Hi ${userName}!</h2>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <a href="${resetLink}" class="button">Reset Password</a>
        <p style="margin-top: 20px; font-size: 12px; color: #6c757d;">
          If you didn't request a password reset, please ignore this email or contact support if you have concerns.
        </p>
        <p style="font-size: 12px; color: #6c757d;">
          Link expires in 1 hour.
        </p>
      </div>
    `;
    return this.getBaseTemplate(content);
  }

  /**
   * OTP Email Template
   */
  getOtpEmail(userName: string, otp: string): string {
    const content = `
      <div class="header">
        <h1>Your OTP Code 🔐</h1>
      </div>
      <div class="content">
        <h2>Hi ${userName}!</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        <p style="text-align: center; color: #6c757d;">
          Valid for 10 minutes
        </p>
        <p style="margin-top: 20px; font-size: 12px; color: #6c757d;">
          If you didn't request this OTP, please ignore this email.
        </p>
      </div>
    `;
    return this.getBaseTemplate(content);
  }

  /**
   * Order Confirmation Template
   */
  getOrderConfirmationEmail(
    userName: string,
    orderId: string,
    orderTotal: string,
    orderItems: Array<{ name: string; quantity: number; price: string }>,
  ): string {
    const itemsHtml = orderItems
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">${item.price}</td>
      </tr>
    `,
      )
      .join('');

    const content = `
      <div class="header">
        <h1>Order Confirmed! 🎊</h1>
      </div>
      <div class="content">
        <h2>Hi ${userName}!</h2>
        <p>Thank you for your order! Your order has been confirmed and will be processed soon.</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        
        <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Quantity</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8f9fa; font-weight: bold;">
              <td colspan="2" style="padding: 10px; text-align: right;">Total:</td>
              <td style="padding: 10px; text-align: right;">${orderTotal}</td>
            </tr>
          </tfoot>
        </table>
        
        <a href="https://yourapp.com/orders/${orderId}" class="button">Track Order</a>
      </div>
    `;
    return this.getBaseTemplate(content);
  }

  /**
   * Password Changed Notification
   */
  getPasswordChangedEmail(userName: string): string {
    const content = `
      <div class="header">
        <h1>Password Changed ✅</h1>
      </div>
      <div class="content">
        <h2>Hi ${userName}!</h2>
        <p>Your password has been successfully changed.</p>
        <p>If you didn't make this change, please contact our support team immediately.</p>
        <a href="https://yourapp.com/support" class="button">Contact Support</a>
      </div>
    `;
    return this.getBaseTemplate(content);
  }
}
