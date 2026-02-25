export enum NasType {
  MIKROTIK = 'mikrotik',
  CISCO = 'cisco',
  JUNIPER = 'juniper',
  GENERIC = 'generic',
}

export interface NasDevice {
  id: string;
  tenantId: string;
  name: string;
  ipAddress: string;
  secret: string;
  type: NasType;
  nasPort: number;
  coaPort: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNasDeviceDto {
  name: string;
  ipAddress: string;
  secret: string;
  type: NasType;
  nasPort?: number;
  coaPort?: number;
  description?: string;
}
