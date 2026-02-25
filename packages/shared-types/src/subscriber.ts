export enum SubscriberCreatedBy {
  ADMIN = 'admin',
  VOUCHER = 'voucher',
  SELF_REGISTER = 'self_register',
  SMS = 'sms',
}

export interface Subscriber {
  id: string;
  tenantId: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  packageId: string;
  macAddress: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdBy: SubscriberCreatedBy;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriberDto {
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  packageId: string;
  macAddress?: string;
  expiresAt?: string;
}
