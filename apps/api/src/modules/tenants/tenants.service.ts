import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Tenant,
  TenantStatus,
  AdminUser,
  AdminRole,
  PortalTheme,
  Package,
  SpeedPackageTemplate,
  Subscriber,
  NasDevice,
  Voucher,
  Radacct,
} from '../../database/entities';
import { CreateTenantDto, UpdateTenantDto } from './tenants.dto';
import { RadiusSyncService } from '../radius/radius-sync.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepo: Repository<AdminUser>,
    @InjectRepository(SpeedPackageTemplate)
    private readonly templateRepo: Repository<SpeedPackageTemplate>,
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(NasDevice)
    private readonly nasDeviceRepo: Repository<NasDevice>,
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,
    @InjectRepository(Radacct)
    private readonly radacctRepo: Repository<Radacct>,
    private readonly dataSource: DataSource,
    private readonly radiusSyncService: RadiusSyncService,
  ) {}

  /**
   * List all tenants with pagination, search and status filter.
   */
  async findAll(
    page = 1,
    limit = 20,
    search?: string,
    status?: string,
  ): Promise<{
    data: Tenant[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const qb = this.tenantRepo.createQueryBuilder('tenant');

    if (search) {
      qb.andWhere(
        '(tenant.name ILIKE :search OR tenant.slug ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere('tenant.status = :status', { status });
    }

    qb.orderBy('tenant.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a single tenant by ID.
   */
  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant bulunamadı: ${id}`);
    }
    return tenant;
  }

  /**
   * Provision a new tenant atomically.
   * Creates tenant, admin user, portal theme, and optionally packages from a template.
   */
  async provision(dto: CreateTenantDto): Promise<Tenant> {
    // Pre-check: slug uniqueness
    const existingSlug = await this.tenantRepo.findOne({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Bu slug zaten kullanılıyor: ${dto.slug}`);
    }

    // Pre-check: admin email uniqueness
    const existingEmail = await this.adminUserRepo.findOne({
      where: { email: dto.adminEmail },
    });
    if (existingEmail) {
      throw new ConflictException(
        `Bu e-posta zaten kullanılıyor: ${dto.adminEmail}`,
      );
    }

    // Load template if provided
    let template: SpeedPackageTemplate | null = null;
    if (dto.templateId) {
      template = await this.templateRepo.findOne({
        where: { id: dto.templateId },
      });
      if (!template) {
        throw new NotFoundException(
          `Şablon bulunamadı: ${dto.templateId}`,
        );
      }
    }

    // Hash admin password
    const passwordHash = await bcrypt.hash(dto.adminPassword, 12);

    // Execute everything in a single transaction
    const tenant = await this.dataSource.transaction(async (manager) => {
      // 1. Create Tenant
      const newTenant = manager.create(Tenant, {
        name: dto.name,
        slug: dto.slug,
        domain: `${dto.slug}.onspot.com.tr`,
        status: TenantStatus.TRIAL,
        maxSubscribers: dto.maxSubscribers,
        maxDevices: dto.maxDevices,
      });
      const savedTenant = await manager.save(Tenant, newTenant);

      // 2. Create Admin User
      const adminUser = manager.create(AdminUser, {
        tenantId: savedTenant.id,
        email: dto.adminEmail,
        passwordHash,
        name: dto.adminName,
        role: AdminRole.TENANT_ADMIN,
        isActive: true,
      });
      await manager.save(AdminUser, adminUser);

      // 3. Create default Portal Theme
      const portalTheme = manager.create(PortalTheme, {
        tenantId: savedTenant.id,
        primaryColor: '#2563EB',
        secondaryColor: '#1E40AF',
        textColor: '#1F2937',
        backgroundColor: '#F3F4F6',
        welcomeTitle: { tr: 'Hoş Geldiniz', en: 'Welcome' },
        welcomeMessage: {
          tr: 'İnternete bağlanın',
          en: 'Connect to the internet',
        },
        loginMethods: ['username_password'],
        showPackageSelection: false,
      });
      await manager.save(PortalTheme, portalTheme);

      // 4. Create packages from template if provided
      if (template && template.packages.length > 0) {
        const packageEntities = template.packages.map((tplPkg, index) =>
          manager.create(Package, {
            tenantId: savedTenant.id,
            name: tplPkg.name,
            downloadSpeed: tplPkg.downloadSpeed,
            uploadSpeed: tplPkg.uploadSpeed,
            dataLimit: tplPkg.dataLimit
              ? String(tplPkg.dataLimit)
              : null,
            timeLimit: tplPkg.timeLimit,
            durationDays: tplPkg.durationDays,
            simultaneousSessions: tplPkg.simultaneousSessions,
            price: tplPkg.price,
            currency: tplPkg.currency,
            isActive: true,
            sortOrder: index,
          }),
        );
        await manager.save(Package, packageEntities);

        // 5. Sync packages to RADIUS
        for (const pkg of packageEntities) {
          await this.radiusSyncService.syncPackageGroup(pkg, savedTenant);
        }
      }

      return savedTenant;
    });

    this.logger.log(
      `Tenant provisioned: "${tenant.name}" (${tenant.slug})`,
    );
    return tenant;
  }

  /**
   * Update tenant fields.
   */
  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    Object.assign(tenant, dto);
    return this.tenantRepo.save(tenant);
  }

  /**
   * Suspend a tenant.
   */
  async suspend(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.status = TenantStatus.SUSPENDED;
    const saved = await this.tenantRepo.save(tenant);
    this.logger.log(`Tenant suspended: "${tenant.name}" (${tenant.slug})`);
    return saved;
  }

  /**
   * Activate a tenant.
   */
  async activate(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.status = TenantStatus.ACTIVE;
    const saved = await this.tenantRepo.save(tenant);
    this.logger.log(`Tenant activated: "${tenant.name}" (${tenant.slug})`);
    return saved;
  }

  /**
   * Soft delete a tenant.
   */
  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    await this.tenantRepo.softRemove(tenant);
    this.logger.log(
      `Tenant soft-deleted: "${tenant.name}" (${tenant.slug})`,
    );
  }

  /**
   * Get tenant statistics: subscriber, device, voucher, and active session counts.
   */
  async getStats(
    id: string,
  ): Promise<{
    subscriberCount: number;
    deviceCount: number;
    voucherCount: number;
    activeSessionCount: number;
  }> {
    // Verify tenant exists
    await this.findOne(id);

    const [subscriberCount, deviceCount, voucherCount, activeSessionCount] =
      await Promise.all([
        this.subscriberRepo.count({ where: { tenantId: id } }),
        this.nasDeviceRepo.count({ where: { tenantId: id } }),
        this.voucherRepo.count({ where: { tenantId: id } }),
        this.radacctRepo
          .createQueryBuilder('r')
          .where('r.tenant_id = :id', { id })
          .andWhere('r.acctstoptime IS NULL')
          .getCount(),
      ]);

    return {
      subscriberCount,
      deviceCount,
      voucherCount,
      activeSessionCount,
    };
  }
}
