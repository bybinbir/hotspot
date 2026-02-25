import { IsString, IsNumber, IsOptional, IsUUID, IsDateString, Min, Max } from 'class-validator';

export class GenerateVouchersDto {
  @IsUUID()
  packageId: string;

  @IsNumber()
  @Min(1)
  @Max(1000)
  quantity: number;

  @IsOptional()
  @IsString()
  prefix?: string;

  @IsOptional()
  @IsNumber()
  @Min(6)
  @Max(16)
  codeLength?: number;

  @IsDateString()
  expiresAt: string;
}
