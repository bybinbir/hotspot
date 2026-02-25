export interface PortalTheme {
  id: string;
  tenantId: string;
  logoUrl: string | null;
  backgroundImageUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  backgroundColor: string;
  welcomeTitle: Record<string, string>; // {"tr": "Hoş Geldiniz", "en": "Welcome"}
  welcomeMessage: Record<string, string>;
  termsAndConditions: Record<string, string>;
  footerText: Record<string, string>;
  loginMethods: string[]; // ["username_password", "voucher", "sms"]
  showPackageSelection: boolean;
  customCss: string | null;
  redirectUrl: string | null;
}

export type LoginMethod = 'username_password' | 'voucher' | 'sms' | 'social';
