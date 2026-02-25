import { IsString, IsOptional, IsInt, Min, IsBoolean, IsArray } from 'class-validator';

export class CreateCustomerCountTemplateDto {
  @IsString() name: string;
  @IsInt() @Min(1) maxSubscribers: number;
  @IsInt() @Min(1) maxDevices: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateCustomerCountTemplateDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsInt() @Min(1) maxSubscribers?: number;
  @IsOptional() @IsInt() @Min(1) maxDevices?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateSpeedPackageTemplateDto {
  @IsString() name: string;
  @IsArray() packages: any[];
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateSpeedPackageTemplateDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsArray() packages?: any[];
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
