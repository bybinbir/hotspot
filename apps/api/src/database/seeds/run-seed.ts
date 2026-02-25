import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Tenant, TenantStatus } from '../entities/tenant.entity';
import { AdminUser, AdminRole } from '../entities/admin-user.entity';
import { CustomerCountTemplate } from '../entities/customer-count-template.entity';
import { SpeedPackageTemplate } from '../entities/speed-package-template.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'hotspot',
  password: process.env.DB_PASSWORD || 'hotspot_secret',
  database: process.env.DB_DATABASE || 'hotspot',
  entities: [__dirname + '/../entities/**/*.entity{.ts,.js}'],
  synchronize: true,
});

async function seed() {
  await dataSource.initialize();
  console.log('Veritabanı bağlantısı kuruldu');

  // 1. Super Admin oluştur
  const adminRepo = dataSource.getRepository(AdminUser);
  const existingAdmin = await adminRepo.findOne({
    where: { email: 'admin@onspot.com.tr' },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 12);
    await adminRepo.save({
      email: 'admin@onspot.com.tr',
      passwordHash,
      name: 'Super Admin',
      role: AdminRole.SUPER_ADMIN,
      tenantId: null,
    });
    console.log('Super admin oluşturuldu: admin@onspot.com.tr / admin123');
  }

  // 2. Müşteri sayısı şablonları
  const cctRepo = dataSource.getRepository(CustomerCountTemplate);
  const templates = [
    { name: 'Küçük İşletme', maxSubscribers: 100, maxDevices: 3, description: 'Küçük kafe, dükkan' },
    { name: 'Orta İşletme', maxSubscribers: 200, maxDevices: 5, description: 'Orta ölçekli işletme' },
    { name: 'Büyük İşletme', maxSubscribers: 500, maxDevices: 10, description: 'Otel, AVM' },
    { name: 'Kurumsal', maxSubscribers: 1000, maxDevices: 25, description: 'Büyük otel, kampüs' },
    { name: 'Kurumsal Plus', maxSubscribers: 5000, maxDevices: 50, description: 'Büyük kampüs, zincir' },
    { name: 'Enterprise', maxSubscribers: 10000, maxDevices: 100, description: 'ISP seviyesi' },
  ];

  for (const t of templates) {
    const exists = await cctRepo.findOne({ where: { name: t.name } });
    if (!exists) {
      await cctRepo.save(t);
    }
  }
  console.log('Müşteri sayısı şablonları oluşturuldu');

  // 3. Hız paketi şablonları
  const sptRepo = dataSource.getRepository(SpeedPackageTemplate);
  const speedTemplates = [
    {
      name: 'Temel Paketler',
      description: 'Küçük işletmeler için temel paketler',
      packages: [
        { name: '5 Mbps Günlük', downloadSpeed: 5120, uploadSpeed: 2560, dataLimit: null, timeLimit: 1440, durationDays: 1, simultaneousSessions: 1, price: 10, currency: 'TRY' },
        { name: '10 Mbps Günlük', downloadSpeed: 10240, uploadSpeed: 5120, dataLimit: null, timeLimit: 1440, durationDays: 1, simultaneousSessions: 1, price: 20, currency: 'TRY' },
        { name: '25 Mbps Günlük', downloadSpeed: 25600, uploadSpeed: 12800, dataLimit: null, timeLimit: 1440, durationDays: 1, simultaneousSessions: 1, price: 35, currency: 'TRY' },
      ],
    },
    {
      name: 'Otel Paketleri',
      description: 'Oteller için süreli paketler',
      packages: [
        { name: '10 Mbps - 1 Gün', downloadSpeed: 10240, uploadSpeed: 5120, dataLimit: null, timeLimit: null, durationDays: 1, simultaneousSessions: 2, price: 0, currency: 'TRY' },
        { name: '25 Mbps - 1 Gün', downloadSpeed: 25600, uploadSpeed: 12800, dataLimit: null, timeLimit: null, durationDays: 1, simultaneousSessions: 2, price: 0, currency: 'TRY' },
        { name: '50 Mbps - 1 Gün', downloadSpeed: 51200, uploadSpeed: 25600, dataLimit: null, timeLimit: null, durationDays: 1, simultaneousSessions: 3, price: 50, currency: 'TRY' },
        { name: '100 Mbps - 1 Gün', downloadSpeed: 102400, uploadSpeed: 51200, dataLimit: null, timeLimit: null, durationDays: 1, simultaneousSessions: 3, price: 100, currency: 'TRY' },
      ],
    },
    {
      name: 'Kafe Paketleri',
      description: 'Kafeler için saat bazlı paketler',
      packages: [
        { name: '5 Mbps - 1 Saat', downloadSpeed: 5120, uploadSpeed: 2560, dataLimit: null, timeLimit: 60, durationDays: 1, simultaneousSessions: 1, price: 0, currency: 'TRY' },
        { name: '10 Mbps - 2 Saat', downloadSpeed: 10240, uploadSpeed: 5120, dataLimit: null, timeLimit: 120, durationDays: 1, simultaneousSessions: 1, price: 0, currency: 'TRY' },
        { name: '10 Mbps - Tüm Gün', downloadSpeed: 10240, uploadSpeed: 5120, dataLimit: null, timeLimit: 720, durationDays: 1, simultaneousSessions: 1, price: 15, currency: 'TRY' },
      ],
    },
  ];

  for (const st of speedTemplates) {
    const exists = await sptRepo.findOne({ where: { name: st.name } });
    if (!exists) {
      await sptRepo.save(st);
    }
  }
  console.log('Hız paketi şablonları oluşturuldu');

  // 4. Demo tenant oluştur
  const tenantRepo = dataSource.getRepository(Tenant);
  const existingTenant = await tenantRepo.findOne({
    where: { slug: 'demo' },
  });

  if (!existingTenant) {
    const tenant = await tenantRepo.save({
      name: 'Demo Hotel',
      slug: 'demo',
      domain: 'demo.onspot.com.tr',
      status: TenantStatus.ACTIVE,
      maxSubscribers: 500,
      maxDevices: 10,
      settings: {},
    });

    // Demo tenant admin
    const passwordHash = await bcrypt.hash('demo123', 12);
    await adminRepo.save({
      email: 'admin@demo.onspot.com.tr',
      passwordHash,
      name: 'Demo Admin',
      role: AdminRole.TENANT_ADMIN,
      tenantId: tenant.id,
    });
    console.log('Demo tenant oluşturuldu: admin@demo.onspot.com.tr / demo123');
  }

  await dataSource.destroy();
  console.log('Seed tamamlandı');
}

seed().catch((err) => {
  console.error('Seed hatası:', err);
  process.exit(1);
});
