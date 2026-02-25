import {
  IsString, IsOptional, IsBoolean, IsArray, IsObject,
} from 'class-validator';

export class UpdatePortalThemeDto {
  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  backgroundImageUrl?: string | null;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  textColor?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsObject()
  welcomeTitle?: Record<string, string>;

  @IsOptional()
  @IsObject()
  welcomeMessage?: Record<string, string>;

  @IsOptional()
  @IsObject()
  termsAndConditions?: Record<string, string>;

  @IsOptional()
  @IsObject()
  footerText?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  loginMethods?: string[];

  @IsOptional()
  @IsBoolean()
  showPackageSelection?: boolean;

  @IsOptional()
  @IsString()
  customCss?: string | null;

  @IsOptional()
  @IsString()
  redirectUrl?: string | null;
}
