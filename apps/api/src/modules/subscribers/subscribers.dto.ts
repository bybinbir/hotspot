import { IsString, IsOptional, IsEmail, IsUUID, IsBoolean, MinLength, IsDateString } from 'class-validator';

export class CreateSubscriberDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(4)
  password: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsUUID()
  packageId: string;

  @IsOptional()
  @IsString()
  macAddress?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateSubscriberDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUUID()
  packageId?: string;

  @IsOptional()
  @IsString()
  macAddress?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(4)
  password: string;
}
