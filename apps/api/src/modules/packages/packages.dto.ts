import { IsString, IsNumber, IsOptional, IsBoolean, Min, MinLength } from 'class-validator';

export class CreatePackageDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsNumber()
  @Min(1)
  downloadSpeed: number; // Kbps

  @IsNumber()
  @Min(1)
  uploadSpeed: number; // Kbps

  @IsOptional()
  @IsNumber()
  dataLimit?: number | null; // Bytes

  @IsOptional()
  @IsNumber()
  timeLimit?: number | null; // Minutes

  @IsNumber()
  @Min(1)
  durationDays: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  simultaneousSessions?: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdatePackageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  downloadSpeed?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  uploadSpeed?: number;

  @IsOptional()
  @IsNumber()
  dataLimit?: number | null;

  @IsOptional()
  @IsNumber()
  timeLimit?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  simultaneousSessions?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
