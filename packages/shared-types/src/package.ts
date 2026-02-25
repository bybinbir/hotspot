export interface HotspotPackage {
  id: string;
  tenantId: string;
  name: string;
  downloadSpeed: number; // Kbps
  uploadSpeed: number; // Kbps
  dataLimit: number | null; // Bytes, null = unlimited
  timeLimit: number | null; // Minutes, null = unlimited
  durationDays: number;
  simultaneousSessions: number;
  price: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePackageDto {
  name: string;
  downloadSpeed: number;
  uploadSpeed: number;
  dataLimit?: number | null;
  timeLimit?: number | null;
  durationDays: number;
  simultaneousSessions?: number;
  price: number;
  currency?: string;
}
