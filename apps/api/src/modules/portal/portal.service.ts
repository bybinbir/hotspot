import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import {
  PortalTheme,
  Subscriber,
  SubscriberCreatedBy,
  Voucher,
  VoucherStatus,
  Package,
  Tenant,
  Radacct,
} from '../../database/entities';
import { RadiusSyncService } from '../radius/radius-sync.service';

const PASSWORD_CHARS =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

@Injectable()
export class PortalService {
  private readonly logger = new Logger(PortalService.name);

  constructor(
    @InjectRepository(PortalTheme)
    private readonly portalThemeRepo: Repository<PortalTheme>,
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,
    @InjectRepository(Package)
    private readonly packageRepo: Repository<Package>,
    @InjectRepository(Radacct)
    private readonly radacctRepo: Repository<Radacct>,
    private readonly radiusSyncService: RadiusSyncService,
  ) {}

  // ---------------------------------------------------------------------------
  // 1. getTheme
  // ---------------------------------------------------------------------------
  async getTheme(
    tenant: Tenant,
    lang: string,
  ): Promise<Record<string, unknown>> {
    const theme = await this.portalThemeRepo.findOne({
      where: { tenantId: tenant.id },
    });

    const defaults: Record<string, unknown> = {
      logoUrl: null,
      backgroundImageUrl: null,
      primaryColor: '#2563EB',
      secondaryColor: '#1E40AF',
      textColor: '#1F2937',
      backgroundColor: '#F3F4F6',
      welcomeTitle: lang === 'tr' ? 'Hoş Geldiniz' : 'Welcome',
      welcomeMessage:
        lang === 'tr' ? 'İnternete bağlanın' : 'Connect to the internet',
      termsAndConditions: '',
      footerText: '',
      customCss: null,
    };

    if (!theme) {
      return defaults;
    }

    return {
      logoUrl: theme.logoUrl,
      backgroundImageUrl: theme.backgroundImageUrl,
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      textColor: theme.textColor,
      backgroundColor: theme.backgroundColor,
      welcomeTitle: this.localize(theme.welcomeTitle, lang) || defaults.welcomeTitle,
      welcomeMessage:
        this.localize(theme.welcomeMessage, lang) || defaults.welcomeMessage,
      termsAndConditions: this.localize(theme.termsAndConditions, lang) || '',
      footerText: this.localize(theme.footerText, lang) || '',
      customCss: theme.customCss,
    };
  }

  // ---------------------------------------------------------------------------
  // 2. getTranslations
  // ---------------------------------------------------------------------------
  getTranslations(lang: string): Record<string, string> {
    const translations: Record<string, Record<string, string>> = {
      tr: {
        username: 'Kullanıcı Adı',
        password: 'Şifre',
        usernamePlaceholder: 'Kullanıcı adınızı girin',
        passwordPlaceholder: 'Şifrenizi girin',
        connect: 'Bağlan',
        voucherCode: 'Voucher Kodu',
        voucherPlaceholder: 'Voucher kodunuzu girin',
        redeem: 'Kullan',
        phone: 'Telefon',
        phonePlaceholder: 'Telefon numaranızı girin',
        sendCode: 'Kod Gönder',
        or: 'veya',
        termsTitle: 'Kullanım Koşulları',
        authSuccess: 'Kimlik Doğrulama Başarılı',
        connected: 'Bağlandı',
        connectedMessage: 'İnternete başarıyla bağlandınız.',
        continueToSite: 'Siteye Devam Et',
        viewStatus: 'Durum Görüntüle',
        sessionActive: 'Oturum Aktif',
        timeRemaining: 'Kalan Süre',
        dataUsed: 'Kullanılan Veri',
        package: 'Paket',
        ipAddress: 'IP Adresi',
        disconnect: 'Bağlantıyı Kes',
        selectPackage: 'Paket Seçin',
        selectPackageMessage: 'Size uygun paketi seçin',
        free: 'Ücretsiz',
        continue: 'Devam Et',
        invalidCredentials: 'Geçersiz kullanıcı adı veya şifre',
        voucherNotFound: 'Voucher bulunamadı',
        voucherExpired: 'Voucher süresi dolmuş',
        voucherAlreadyUsed: 'Voucher zaten kullanılmış',
        accountExpired: 'Hesap süresi dolmuş',
        accountDisabled: 'Hesap devre dışı bırakılmış',
        smsNotAvailable: 'SMS ile giriş henüz kullanılamıyor',
        smsCodeSent: 'Doğrulama kodu gönderildi',
        otpInvalid: 'Geçersiz doğrulama kodu',
        otpExpired: 'Doğrulama kodu süresi dolmuş',
        otpNotFound: 'Doğrulama kodu bulunamadı',
        tooManyAttempts: 'Çok fazla deneme, lütfen bekleyin',
        noPackageAvailable: 'Uygun paket bulunamadı',
        codePlaceholder: 'Doğrulama kodunu girin',
        verifyCode: 'Kodu Doğrula',
        noTenant: 'Geçersiz portal adresi',
        unknownError: 'Bir hata oluştu. Lütfen tekrar deneyin.',
      },
      en: {
        username: 'Username',
        password: 'Password',
        usernamePlaceholder: 'Enter your username',
        passwordPlaceholder: 'Enter your password',
        connect: 'Connect',
        voucherCode: 'Voucher Code',
        voucherPlaceholder: 'Enter your voucher code',
        redeem: 'Redeem',
        phone: 'Phone',
        phonePlaceholder: 'Enter your phone number',
        sendCode: 'Send Code',
        or: 'or',
        termsTitle: 'Terms and Conditions',
        authSuccess: 'Authentication Successful',
        connected: 'Connected',
        connectedMessage: 'You have been successfully connected to the internet.',
        continueToSite: 'Continue to Site',
        viewStatus: 'View Status',
        sessionActive: 'Session Active',
        timeRemaining: 'Time Remaining',
        dataUsed: 'Data Used',
        package: 'Package',
        ipAddress: 'IP Address',
        disconnect: 'Disconnect',
        selectPackage: 'Select Package',
        selectPackageMessage: 'Choose the package that suits you',
        free: 'Free',
        continue: 'Continue',
        invalidCredentials: 'Invalid username or password',
        voucherNotFound: 'Voucher not found',
        voucherExpired: 'Voucher has expired',
        voucherAlreadyUsed: 'Voucher has already been used',
        accountExpired: 'Account has expired',
        accountDisabled: 'Account has been disabled',
        smsNotAvailable: 'SMS login is not yet available',
        smsCodeSent: 'Verification code sent',
        otpInvalid: 'Invalid verification code',
        otpExpired: 'Verification code has expired',
        otpNotFound: 'Verification code not found',
        tooManyAttempts: 'Too many attempts, please wait',
        noPackageAvailable: 'No package available',
        codePlaceholder: 'Enter verification code',
        verifyCode: 'Verify Code',
        noTenant: 'Invalid portal address',
        unknownError: 'An error occurred. Please try again.',
      },
    };

    return translations[lang] || translations['en'];
  }

  // ---------------------------------------------------------------------------
  // 3. authenticateUser
  // ---------------------------------------------------------------------------
  async authenticateUser(
    username: string,
    password: string,
    tenant: Tenant,
  ): Promise<Subscriber> {
    const subscriber = await this.subscriberRepo.findOne({
      where: { username, tenantId: tenant.id },
      relations: ['package'],
    });

    if (!subscriber) {
      throw new Error('invalidCredentials');
    }

    if (subscriber.passwordCleartext !== password) {
      throw new Error('invalidCredentials');
    }

    if (!subscriber.isActive) {
      throw new Error('accountDisabled');
    }

    if (subscriber.expiresAt && subscriber.expiresAt < new Date()) {
      throw new Error('accountExpired');
    }

    return subscriber;
  }

  // ---------------------------------------------------------------------------
  // 4. redeemVoucher
  // ---------------------------------------------------------------------------
  async redeemVoucher(
    code: string,
    mac: string,
    tenant: Tenant,
  ): Promise<Subscriber> {
    // Case-insensitive code lookup via query builder
    const voucherEntity = await this.voucherRepo
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.package', 'p')
      .where('v.tenant_id = :tenantId', { tenantId: tenant.id })
      .andWhere('UPPER(v.code) = UPPER(:code)', { code })
      .getOne();

    if (!voucherEntity) {
      throw new Error('voucherNotFound');
    }

    if (voucherEntity.status !== VoucherStatus.UNUSED) {
      throw new Error('voucherAlreadyUsed');
    }

    if (voucherEntity.expiresAt && voucherEntity.expiresAt < new Date()) {
      throw new Error('voucherExpired');
    }

    const pkg = voucherEntity.package;
    const randomPassword = this.generateRandomPassword(8);

    // Calculate expiration from package duration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pkg.durationDays);

    // Create subscriber from voucher
    const subscriber = this.subscriberRepo.create({
      username: `v_${voucherEntity.code}`,
      passwordCleartext: randomPassword,
      packageId: voucherEntity.packageId,
      macAddress: mac,
      tenantId: tenant.id,
      isActive: true,
      expiresAt,
      createdBy: SubscriberCreatedBy.VOUCHER,
    });

    const saved = await this.subscriberRepo.save(subscriber);

    this.logger.debug(
      `Voucher "${voucherEntity.code}" redeemed, subscriber "${saved.username}" created`,
    );

    // Sync to RADIUS
    await this.radiusSyncService.syncSubscriber(saved, tenant);

    // Update voucher status
    voucherEntity.status = VoucherStatus.ACTIVE;
    voucherEntity.subscriberId = saved.id;
    voucherEntity.usedAt = new Date();
    await this.voucherRepo.save(voucherEntity);

    // Reload with package relation for return
    const result = await this.subscriberRepo.findOne({
      where: { id: saved.id },
      relations: ['package'],
    });

    return result!;
  }

  // ---------------------------------------------------------------------------
  // 5. getActiveSession
  // ---------------------------------------------------------------------------
  async getActiveSession(
    mac: string,
    tenantId: string,
  ): Promise<Record<string, unknown> | null> {
    const session = await this.radacctRepo.findOne({
      where: {
        callingStationId: mac,
        tenantId,
        acctStopTime: IsNull(),
      },
    });

    if (!session) {
      return null;
    }

    return {
      username: session.username,
      ipAddress: session.framedIpAddress,
      startTime: session.acctStartTime,
      dataIn: session.acctInputOctets,
      dataOut: session.acctOutputOctets,
      sessionId: session.acctSessionId,
    };
  }

  // ---------------------------------------------------------------------------
  // 6. getPackagesForPortal
  // ---------------------------------------------------------------------------
  async getPackagesForPortal(
    tenant: Tenant,
  ): Promise<Record<string, unknown>[]> {
    const packages = await this.packageRepo.find({
      where: { tenantId: tenant.id, isActive: true },
      order: { sortOrder: 'ASC' },
    });

    return packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      downloadSpeedDisplay: `${pkg.downloadSpeed} Mbps`,
      uploadSpeedDisplay: `${pkg.uploadSpeed} Mbps`,
      timeLimitDisplay: pkg.timeLimit
        ? `${Math.floor(pkg.timeLimit / 60)} saat`
        : null,
      price: pkg.price,
      currency: pkg.currency,
      isFree: Number(pkg.price) === 0,
    }));
  }

  // ---------------------------------------------------------------------------
  // 7. getLoginMethods
  // ---------------------------------------------------------------------------
  async getLoginMethods(
    tenant: Tenant,
  ): Promise<{
    hasUsernamePassword: boolean;
    hasVoucher: boolean;
    hasSms: boolean;
  }> {
    const theme = await this.portalThemeRepo.findOne({
      where: { tenantId: tenant.id },
    });

    const methods = theme?.loginMethods ?? ['username_password'];

    return {
      hasUsernamePassword: methods.includes('username_password'),
      hasVoucher: methods.includes('voucher'),
      hasSms: methods.includes('sms'),
    };
  }

  // ---------------------------------------------------------------------------
  // 8. getSubscriberByUsername
  // ---------------------------------------------------------------------------
  async getSubscriberByUsername(
    username: string,
    tenantId: string,
  ): Promise<Subscriber | null> {
    return this.subscriberRepo.findOne({
      where: { username, tenantId },
      relations: ['package'],
    });
  }

  // ---------------------------------------------------------------------------
  // 9. formatDataUsed
  // ---------------------------------------------------------------------------
  formatDataUsed(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  // ---------------------------------------------------------------------------
  // 9. formatTimeRemaining
  // ---------------------------------------------------------------------------
  formatTimeRemaining(
    startTime: Date,
    timeLimitMinutes: number | null,
  ): { display: string; seconds: number } {
    if (!timeLimitMinutes) {
      // No time limit — return a large value
      return { display: 'Sınırsız', seconds: 999999 };
    }

    const elapsedMs = Date.now() - startTime.getTime();
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const totalSeconds = timeLimitMinutes * 60;
    const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const secs = remainingSeconds % 60;

    let display: string;
    if (hours > 0) {
      display = `${hours}s ${minutes}dk`;
    } else if (minutes > 0) {
      display = `${minutes}dk ${secs}sn`;
    } else {
      display = `${secs}sn`;
    }

    return { display, seconds: remainingSeconds };
  }

  // ---------------------------------------------------------------------------
  // 10. createSmsSubscriber
  // ---------------------------------------------------------------------------
  async createSmsSubscriber(
    phone: string,
    mac: string,
    tenant: Tenant,
  ): Promise<Subscriber> {
    // Check if subscriber with this phone already exists for this tenant
    let subscriber = await this.subscriberRepo.findOne({
      where: { phone, tenantId: tenant.id },
      relations: ['package'],
    });

    if (subscriber && subscriber.isActive) {
      // Existing active subscriber - reuse
      return subscriber;
    }

    // Get default (first active) package for the tenant
    const defaultPkg = await this.packageRepo.findOne({
      where: { tenantId: tenant.id, isActive: true },
      order: { sortOrder: 'ASC' },
    });

    if (!defaultPkg) {
      throw new Error('noPackageAvailable');
    }

    const randomPassword = this.generateRandomPassword(8);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + defaultPkg.durationDays);

    subscriber = this.subscriberRepo.create({
      username: `sms_${phone.replace(/[^0-9]/g, '')}`,
      passwordCleartext: randomPassword,
      phone,
      packageId: defaultPkg.id,
      macAddress: mac || null,
      tenantId: tenant.id,
      isActive: true,
      expiresAt,
      createdBy: SubscriberCreatedBy.SMS,
    });

    const saved = await this.subscriberRepo.save(subscriber);

    this.logger.debug(
      `SMS subscriber "${saved.username}" created for phone "${phone}"`,
    );

    // Sync to RADIUS
    await this.radiusSyncService.syncSubscriber(saved, tenant);

    const result = await this.subscriberRepo.findOne({
      where: { id: saved.id },
      relations: ['package'],
    });

    return result!;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------
  private localize(
    jsonb: Record<string, string> | null | undefined,
    lang: string,
  ): string {
    if (!jsonb) return '';
    return jsonb[lang] || jsonb['en'] || jsonb['tr'] || '';
  }

  private generateRandomPassword(length: number): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += PASSWORD_CHARS.charAt(
        Math.floor(Math.random() * PASSWORD_CHARS.length),
      );
    }
    return result;
  }
}
