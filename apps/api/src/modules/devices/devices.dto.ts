import { IsString, IsEnum, IsOptional, IsInt, IsIP, Min, Max, MinLength } from 'class-validator';

enum NasType {
  MIKROTIK = 'mikrotik',
  CISCO = 'cisco',
  JUNIPER = 'juniper',
  GENERIC = 'generic',
}

export class CreateDeviceDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsIP()
  ipAddress: string;

  @IsString()
  @MinLength(6)
  secret: string;

  @IsEnum(NasType)
  type: NasType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  nasPort?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  coaPort?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  secret?: string;

  @IsOptional()
  @IsEnum(NasType)
  type?: NasType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  nasPort?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  coaPort?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  isActive?: boolean;
}
