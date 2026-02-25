export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  status: TenantStatus;
  maxSubscribers: number;
  maxDevices: number;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
  customerCountTemplateId?: string;
  speedPackageTemplateId?: string;
}
