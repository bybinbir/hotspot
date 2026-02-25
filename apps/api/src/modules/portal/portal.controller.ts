import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PortalService } from './portal.service';
import { SmsService } from '../sms/sms.service';
import { Tenant } from '../../database/entities';

@Controller('portal')
export class PortalController {
  constructor(
    private readonly portalService: PortalService,
    private readonly smsService: SmsService,
  ) {}

  // ─── GET /portal/login ─────────────────────────────────────────────

  @Get('login')
  async login(
    @Query('dst') dst: string,
    @Query('mac') mac: string,
    @Query('nasip') nasip: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const tenant = (req as any).tenant as Tenant | undefined;
    const lang = this.getLang(req);
    const t = this.portalService.getTranslations(lang);

    if (!tenant) {
      return res.render('login', {
        layout: 'layouts/main',
        theme: this.getDefaultTheme(lang),
        t,
        lang,
        error: t.noTenant || 'Invalid portal address',
        dst: '', mac: '', nasip: '',
        hasUsernamePassword: false, hasVoucher: false, hasSms: false,
      });
    }

    try {
      const theme = await this.portalService.getTheme(tenant, lang);
      const loginMethods = await this.portalService.getLoginMethods(tenant);

      // Check if user already has an active session
      if (mac) {
        const activeSession = await this.portalService.getActiveSession(mac, tenant.id);
        if (activeSession) {
          return res.redirect(`/portal/status/${encodeURIComponent(mac)}`);
        }
      }

      return res.render('login', {
        layout: 'layouts/main',
        theme, t, lang,
        dst: dst || '', mac: mac || '', nasip: nasip || '',
        ...loginMethods,
      });
    } catch {
      return res.render('login', {
        layout: 'layouts/main',
        theme: this.getDefaultTheme(lang),
        t, lang,
        error: t.unknownError || 'An error occurred',
        dst: dst || '', mac: mac || '', nasip: nasip || '',
        hasUsernamePassword: true, hasVoucher: false, hasSms: false,
      });
    }
  }

  // ─── POST /portal/authenticate ─────────────────────────────────────

  @Post('authenticate')
  async authenticate(
    @Body() body: { username: string; password: string; dst: string; mac: string; nasip: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const tenant = (req as any).tenant as Tenant | undefined;
    const lang = this.getLang(req);
    const t = this.portalService.getTranslations(lang);

    if (!tenant) {
      return res.render('login', {
        layout: 'layouts/main',
        theme: this.getDefaultTheme(lang), t, lang,
        error: t.noTenant, dst: '', mac: '', nasip: '',
        hasUsernamePassword: false, hasVoucher: false, hasSms: false,
      });
    }

    const theme = await this.portalService.getTheme(tenant, lang);
    const loginMethods = await this.portalService.getLoginMethods(tenant);

    try {
      await this.portalService.authenticateUser(body.username, body.password, tenant);

      return res.render('success', {
        layout: 'layouts/main',
        theme, t, lang,
        redirectUrl: body.dst || (theme as any).redirectUrl || null,
        mac: body.mac || '',
      });
    } catch (error) {
      const errorKey = (error as Error).message;
      return res.render('login', {
        layout: 'layouts/main',
        theme, t, lang,
        error: t[errorKey] || t.invalidCredentials,
        dst: body.dst || '', mac: body.mac || '', nasip: body.nasip || '',
        ...loginMethods,
      });
    }
  }

  // ─── POST /portal/voucher-auth ─────────────────────────────────────

  @Post('voucher-auth')
  async voucherAuth(
    @Body() body: { code: string; dst: string; mac: string; nasip: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const tenant = (req as any).tenant as Tenant | undefined;
    const lang = this.getLang(req);
    const t = this.portalService.getTranslations(lang);

    if (!tenant) {
      return res.render('login', {
        layout: 'layouts/main',
        theme: this.getDefaultTheme(lang), t, lang,
        error: t.noTenant, dst: '', mac: '', nasip: '',
        hasUsernamePassword: false, hasVoucher: false, hasSms: false,
      });
    }

    const theme = await this.portalService.getTheme(tenant, lang);
    const loginMethods = await this.portalService.getLoginMethods(tenant);

    try {
      await this.portalService.redeemVoucher(body.code, body.mac || '', tenant);

      return res.render('success', {
        layout: 'layouts/main',
        theme, t, lang,
        redirectUrl: body.dst || null,
        mac: body.mac || '',
      });
    } catch (error) {
      const errorKey = (error as Error).message;
      return res.render('login', {
        layout: 'layouts/main',
        theme, t, lang,
        error: t[errorKey] || t.voucherNotFound,
        dst: body.dst || '', mac: body.mac || '', nasip: body.nasip || '',
        ...loginMethods,
      });
    }
  }

  // ─── POST /portal/sms-request ──────────────────────────────────────

  @Post('sms-request')
  async smsRequest(
    @Body() body: { phone: string; dst: string; mac: string; nasip: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const tenant = (req as any).tenant as Tenant | undefined;
    const lang = this.getLang(req);
    const t = this.portalService.getTranslations(lang);

    if (!tenant) {
      return res.render('login', {
        layout: 'layouts/main',
        theme: this.getDefaultTheme(lang), t, lang,
        error: t.noTenant, dst: '', mac: '', nasip: '',
        hasUsernamePassword: false, hasVoucher: false, hasSms: false,
      });
    }

    const theme = await this.portalService.getTheme(tenant, lang);
    const loginMethods = await this.portalService.getLoginMethods(tenant);

    if (!body.phone) {
      return res.render('login', {
        layout: 'layouts/main',
        theme, t, lang,
        error: t.phonePlaceholder || 'Phone number is required',
        dst: body.dst || '', mac: body.mac || '', nasip: body.nasip || '',
        ...loginMethods,
      });
    }

    try {
      const result = await this.smsService.sendOtp(body.phone, tenant.id);

      if (!result.success) {
        return res.render('login', {
          layout: 'layouts/main',
          theme, t, lang,
          error: t[result.message] || t.unknownError,
          dst: body.dst || '', mac: body.mac || '', nasip: body.nasip || '',
          ...loginMethods,
        });
      }

      return res.render('login', {
        layout: 'layouts/main',
        theme, t, lang,
        smsCodeSent: true,
        phone: body.phone,
        info: t.smsCodeSent || 'Verification code sent',
        dst: body.dst || '', mac: body.mac || '', nasip: body.nasip || '',
        ...loginMethods,
      });
    } catch {
      return res.render('login', {
        layout: 'layouts/main',
        theme, t, lang,
        error: t.unknownError,
        dst: body.dst || '', mac: body.mac || '', nasip: body.nasip || '',
        ...loginMethods,
      });
    }
  }

  // ─── POST /portal/sms-verify ──────────────────────────────────────

  @Post('sms-verify')
  async smsVerify(
    @Body() body: { phone: string; code: string; dst: string; mac: string; nasip: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const tenant = (req as any).tenant as Tenant | undefined;
    const lang = this.getLang(req);
    const t = this.portalService.getTranslations(lang);

    if (!tenant) {
      return res.render('login', {
        layout: 'layouts/main',
        theme: this.getDefaultTheme(lang), t, lang,
        error: t.noTenant, dst: '', mac: '', nasip: '',
        hasUsernamePassword: false, hasVoucher: false, hasSms: false,
      });
    }

    const theme = await this.portalService.getTheme(tenant, lang);
    const loginMethods = await this.portalService.getLoginMethods(tenant);

    try {
      const result = this.smsService.verifyOtp(body.phone, tenant.id, body.code);

      if (!result.valid) {
        return res.render('login', {
          layout: 'layouts/main',
          theme, t, lang,
          error: t[result.message] || t.otpInvalid,
          smsCodeSent: true,
          phone: body.phone,
          dst: body.dst || '', mac: body.mac || '', nasip: body.nasip || '',
          ...loginMethods,
        });
      }

      // OTP valid — create or reuse SMS subscriber
      await this.portalService.createSmsSubscriber(body.phone, body.mac || '', tenant);

      return res.render('success', {
        layout: 'layouts/main',
        theme, t, lang,
        redirectUrl: body.dst || (theme as any).redirectUrl || null,
        mac: body.mac || '',
      });
    } catch (error) {
      const errorKey = (error as Error).message;
      return res.render('login', {
        layout: 'layouts/main',
        theme, t, lang,
        error: t[errorKey] || t.unknownError,
        dst: body.dst || '', mac: body.mac || '', nasip: body.nasip || '',
        ...loginMethods,
      });
    }
  }

  // ─── GET /portal/status/:mac ───────────────────────────────────────

  @Get('status/:mac')
  async status(
    @Param('mac') mac: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const tenant = (req as any).tenant as Tenant | undefined;
    const lang = this.getLang(req);
    const t = this.portalService.getTranslations(lang);

    if (!tenant) {
      return res.redirect('/portal/login');
    }

    try {
      const theme = await this.portalService.getTheme(tenant, lang);
      const session = await this.portalService.getActiveSession(mac, tenant.id);

      if (!session) {
        return res.redirect(`/portal/login?mac=${encodeURIComponent(mac)}`);
      }

      // Calculate data used
      const dataIn = Number(session.dataIn || 0);
      const dataOut = Number(session.dataOut || 0);
      const dataUsedDisplay = this.portalService.formatDataUsed(dataIn + dataOut);

      // Get package info for time remaining
      const subscriber = await this.portalService.getSubscriberByUsername(
        session.username as string,
        tenant.id,
      );
      const timeLimit = subscriber?.package?.timeLimit || null;
      const timeRemaining = this.portalService.formatTimeRemaining(
        session.startTime as Date,
        timeLimit,
      );

      return res.render('status', {
        layout: 'layouts/main',
        theme, t, lang, mac,
        timeRemainingDisplay: timeRemaining.display,
        timeRemainingSeconds: timeRemaining.seconds,
        dataUsedDisplay,
        packageName: subscriber?.package?.name || '-',
        ipAddress: (session.ipAddress as string) || '-',
      });
    } catch {
      return res.redirect(`/portal/login?mac=${encodeURIComponent(mac)}`);
    }
  }

  // ─── POST /portal/logout ───────────────────────────────────────────

  @Post('logout')
  async logout(
    @Body() body: { mac: string },
    @Res() res: Response,
  ) {
    const mac = body.mac || '';
    return res.redirect(`/portal/login?mac=${encodeURIComponent(mac)}`);
  }

  // ─── GET /portal/packages ──────────────────────────────────────────

  @Get('packages')
  async packages(
    @Query('mac') mac: string,
    @Query('dst') dst: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const tenant = (req as any).tenant as Tenant | undefined;
    const lang = this.getLang(req);
    const t = this.portalService.getTranslations(lang);

    if (!tenant) {
      return res.redirect('/portal/login');
    }

    try {
      const theme = await this.portalService.getTheme(tenant, lang);
      const packages = await this.portalService.getPackagesForPortal(tenant);

      return res.render('packages', {
        layout: 'layouts/main',
        theme, t, lang,
        mac: mac || '', dst: dst || '',
        packages,
      });
    } catch {
      return res.redirect('/portal/login');
    }
  }

  // ─── POST /portal/select-package ───────────────────────────────────

  @Post('select-package')
  async selectPackage(
    @Body() body: { packageId: string; mac: string; dst: string },
    @Res() res: Response,
  ) {
    const params = new URLSearchParams();
    if (body.mac) params.set('mac', body.mac);
    if (body.dst) params.set('dst', body.dst);
    if (body.packageId) params.set('packageId', body.packageId);
    return res.redirect(`/portal/login?${params.toString()}`);
  }

  // ─── Private Helpers ───────────────────────────────────────────────

  private getLang(req: Request): string {
    const queryLang = req.query['lang'] as string;
    if (queryLang === 'en') return 'en';
    const acceptLang = req.headers['accept-language'] || '';
    if (typeof acceptLang === 'string' && acceptLang.startsWith('en')) return 'en';
    return 'tr';
  }

  private getDefaultTheme(lang: string): Record<string, unknown> {
    return {
      logoUrl: null,
      backgroundImageUrl: null,
      primaryColor: '#2563EB',
      secondaryColor: '#1E40AF',
      textColor: '#1F2937',
      backgroundColor: '#F3F4F6',
      welcomeTitle: lang === 'en' ? 'Welcome' : 'Hoş Geldiniz',
      welcomeMessage: lang === 'en' ? 'Connect to the internet' : 'İnternete bağlanın',
      termsAndConditions: null,
      footerText: null,
      customCss: null,
    };
  }

}
