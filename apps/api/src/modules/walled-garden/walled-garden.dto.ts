import { IsString, IsEnum, IsOptional, IsIP, IsBoolean, MinLength, Matches } from 'class-validator';
import { WalledGardenDeviceType } from '../../database/entities';

export class CreateWalledGardenDeviceDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, {
    message: 'Gecerli bir MAC adresi girin (AA:BB:CC:DD:EE:FF)',
  })
  macAddress?: string;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsEnum(WalledGardenDeviceType)
  type: WalledGardenDeviceType;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateWalledGardenDeviceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, {
    message: 'Gecerli bir MAC adresi girin (AA:BB:CC:DD:EE:FF)',
  })
  macAddress?: string;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsEnum(WalledGardenDeviceType)
  type?: WalledGardenDeviceType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
