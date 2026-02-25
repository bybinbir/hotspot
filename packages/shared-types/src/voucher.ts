export enum VoucherStatus {
  UNUSED = 'unused',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DEPLETED = 'depleted',
}

export interface Voucher {
  id: string;
  tenantId: string;
  code: string;
  packageId: string;
  status: VoucherStatus;
  subscriberId: string | null;
  batchId: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface GenerateVouchersDto {
  packageId: string;
  quantity: number;
  prefix?: string;
  codeLength?: number;
  expiresAt: string;
}
