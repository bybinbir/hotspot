import { IsString, IsOptional, IsInt, Min, IsEmail } from 'class-validator';

export class CreateTenantDto {
  @IsString() name: string;        // "Bahar Hotel"
  @IsString() slug: string;        // "baharhotel"
  @IsEmail() adminEmail: string;   // Admin user email
  @IsString() adminPassword: string;
  @IsString() adminName: string;
  @IsInt() @Min(1) maxSubscribers: number;
  @IsInt() @Min(1) maxDevices: number;
  @IsOptional() @IsString() templateId?: string;  // Speed package template ID
}

export class UpdateTenantDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsInt() @Min(1) maxSubscribers?: number;
  @IsOptional() @IsInt() @Min(1) maxDevices?: number;
}
