import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OtpEntry {
  code: string;
  phone: string;
  tenantId: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly otpStore = new Map<string, OtpEntry>();

  constructor(private readonly configService: ConfigService) {}

  // Generate a 6-digit OTP, store it, and "send" via provider
  async sendOtp(
    phone: string,
    tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Rate limit: max 3 OTPs per phone per 10 minutes
    const key = `${tenantId}:${phone}`;
    const existing = this.otpStore.get(key);
    if (existing && existing.attempts >= 3 && existing.expiresAt > new Date()) {
      return { success: false, message: 'tooManyAttempts' };
    }

    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    this.otpStore.set(key, {
      code,
      phone,
      tenantId,
      expiresAt,
      attempts: (existing?.attempts ?? 0) + 1,
    });

    // Send SMS via provider
    await this.sendSmsViaProvider(phone, code);

    return { success: true, message: 'otpSent' };
  }

  // Verify OTP
  verifyOtp(
    phone: string,
    tenantId: string,
    code: string,
  ): { valid: boolean; message: string } {
    const key = `${tenantId}:${phone}`;
    const entry = this.otpStore.get(key);

    if (!entry) {
      return { valid: false, message: 'otpNotFound' };
    }

    if (entry.expiresAt < new Date()) {
      this.otpStore.delete(key);
      return { valid: false, message: 'otpExpired' };
    }

    if (entry.code !== code) {
      return { valid: false, message: 'otpInvalid' };
    }

    // OTP is valid - clean up
    this.otpStore.delete(key);
    return { valid: true, message: 'otpVerified' };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // SMS provider abstraction - logs in dev, calls provider in production
  private async sendSmsViaProvider(
    phone: string,
    code: string,
  ): Promise<void> {
    const provider = this.configService.get('SMS_PROVIDER', 'log');

    if (provider === 'log') {
      this.logger.log(`[SMS-DEV] OTP for ${phone}: ${code}`);
      return;
    }

    // Twilio integration placeholder
    if (provider === 'twilio') {
      const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
      const fromNumber = this.configService.get('TWILIO_FROM_NUMBER');

      if (!accountSid || !authToken || !fromNumber) {
        this.logger.warn(
          'Twilio credentials not configured, falling back to log',
        );
        this.logger.log(`[SMS-FALLBACK] OTP for ${phone}: ${code}`);
        return;
      }

      try {
        // Dynamic import to avoid requiring twilio package in dev
        const twilio = require('twilio');
        const client = twilio(accountSid, authToken);
        await client.messages.create({
          body: `Hotspot dogrulama kodunuz: ${code}`,
          from: fromNumber,
          to: phone,
        });
        this.logger.log(`SMS sent to ${phone} via Twilio`);
      } catch (error) {
        this.logger.error(
          `Failed to send SMS via Twilio: ${(error as Error).message}`,
        );
        throw new Error('smsSendFailed');
      }
      return;
    }

    // Generic HTTP API provider placeholder
    this.logger.log(`[SMS-LOG] OTP for ${phone}: ${code}`);
  }

  // Periodic cleanup of expired OTPs (call from a cron or module init)
  cleanupExpired(): void {
    const now = new Date();
    for (const [key, entry] of this.otpStore.entries()) {
      if (entry.expiresAt < now) {
        this.otpStore.delete(key);
      }
    }
  }
}
