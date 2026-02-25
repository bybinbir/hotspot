# Hotspot Yönetim Sistemi - Görev Takibi

## Faz 1: Temel Altyapı ✅

- [x] 1.1 pnpm monorepo + workspace yapısı (root package.json, pnpm-workspace.yaml, tsconfig)
- [x] 1.2 Docker Compose (PostgreSQL + Redis + FreeRADIUS + Nginx)
- [x] 1.3 NestJS API boilerplate (TypeORM, ConfigModule, ValidationPipe, Handlebars)
- [x] 1.4 Veritabanı entities (tenants, admin_users, nas_devices, packages, subscribers, vouchers, portal_themes, RADIUS tabloları, wizard şablonları)
- [x] 1.5 Tenant middleware + tenant scope interceptor + guards
- [x] 1.6 Auth modülü (JWT, bcrypt, login, refresh, guards, roles)
- [x] 1.7 Next.js admin boilerplate + shadcn/ui + next-intl (TR/EN)
- [x] 1.8 Admin login sayfası + dashboard layout (sidebar) + JWT auth flow
- [x] 1.9 FreeRADIUS Docker + SQL module config + tenant-aware queries
- [x] 1.10 Shared-types paketi (TypeScript tipleri)
- [x] 1.11 Seed data (super admin, demo tenant, şablonlar)
- [x] 1.12 Captive portal Handlebars templates (login, status, success, packages)
- [x] 1.13 Nginx wildcard subdomain routing config
- [x] 1.14 Vendor dictionary dosyaları (Mikrotik, Cisco, Juniper)
- [x] Build doğrulama: NestJS API ✅ | Next.js Admin ✅

## Faz 2: Core CRUD ✅

- [x] 2.1 NAS Device CRUD (backend service + controller + DTOs + frontend sayfası)
- [x] 2.2 Package CRUD (backend service + controller + DTOs + frontend sayfası)
- [x] 2.3 Subscriber CRUD (backend service + controller + DTOs + frontend sayfası)
- [x] 2.4 Voucher generation + listing (backend service + controller + DTOs + frontend sayfası)
- [x] 2.5 Frontend API hooks (TanStack Query - tüm CRUD operasyonları)
- [x] Build doğrulama: NestJS API ✅ | Next.js Admin ✅

## Faz 3: RADIUS Entegrasyonu ✅

- [x] 3.1 RadGroupCheck entity (eksik entity tamamlandı)
- [x] 3.2 VendorAttributesService (Mikrotik-Rate-Limit, Cisco-AVPair, ERX-Policy, WISPr)
- [x] 3.3 RadiusSyncService (subscriber/paket → radcheck/radreply/radusergroup/radgroupreply senkronizasyonu)
- [x] 3.4 CoaService (radclient ile disconnect/CoA paketleri, aktif oturum yönetimi)
- [x] 3.5 AccountingService (aktif oturumlar, oturum geçmişi, kullanım istatistikleri, auth logları)
- [x] 3.6 RadiusController (session, stats, auth-log, disconnect API endpoint'leri)
- [x] 3.7 Subscriber + Package servislerine RADIUS sync entegrasyonu
- [x] 3.8 Frontend RADIUS/Session hook'ları (TanStack Query)
- [x] Build doğrulama: NestJS API ✅ | Next.js Admin ✅

## Faz 4: Captive Portal ✅

- [x] 4.1 PortalService (tema yükleme, kullanıcı auth, voucher redeem, aktif oturum, çeviriler TR/EN)
- [x] 4.2 PortalController (SSR routes: login, authenticate, voucher-auth, sms-request, status, logout, packages, select-package)
- [x] 4.3 Portal modülü güncelleme (Radacct + RadiusModule entegrasyonu)
- [x] 4.4 Service-Controller API uyumluluk düzeltmeleri
- [x] Build doğrulama: NestJS API ✅

## Faz 5: Süper Admin
- [ ] 5.1 Tenant CRUD + wizard UI
- [ ] 5.2 Template yönetimi (müşteri sayısı + hız paketleri)
- [ ] 5.3 Tenant provisioning service (atomic)
- [ ] 5.4 Monitoring dashboard

## Faz 6: Dashboard & Raporlar
- [ ] 6.1 Tenant dashboard (aktif kullanıcı, bant genişliği, gelir)
- [ ] 6.2 Oturum raporları + kullanım raporları
- [ ] 6.3 Portal customization UI

## Faz 7: İleri Özellikler
- [ ] 7.1 SMS doğrulama
- [ ] 7.2 Sosyal medya login
- [ ] 7.3 Gelişmiş raporlama + export
