import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('portal_themes')
export class PortalTheme {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', unique: true })
  tenantId: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string | null;

  @Column({ name: 'background_image_url', nullable: true })
  backgroundImageUrl: string | null;

  @Column({ name: 'primary_color', default: '#2563EB' })
  primaryColor: string;

  @Column({ name: 'secondary_color', default: '#1E40AF' })
  secondaryColor: string;

  @Column({ name: 'text_color', default: '#1F2937' })
  textColor: string;

  @Column({ name: 'background_color', default: '#F3F4F6' })
  backgroundColor: string;

  @Column({ name: 'welcome_title', type: 'jsonb', default: { tr: 'Hoş Geldiniz', en: 'Welcome' } })
  welcomeTitle: Record<string, string>;

  @Column({ name: 'welcome_message', type: 'jsonb', default: { tr: 'İnternete bağlanın', en: 'Connect to the internet' } })
  welcomeMessage: Record<string, string>;

  @Column({ name: 'terms_and_conditions', type: 'jsonb', default: {} })
  termsAndConditions: Record<string, string>;

  @Column({ name: 'footer_text', type: 'jsonb', default: {} })
  footerText: Record<string, string>;

  @Column({ name: 'login_methods', type: 'jsonb', default: ['username_password', 'voucher'] })
  loginMethods: string[];

  @Column({ name: 'show_package_selection', default: false })
  showPackageSelection: boolean;

  @Column({ name: 'custom_css', type: 'text', nullable: true })
  customCss: string | null;

  @Column({ name: 'redirect_url', nullable: true })
  redirectUrl: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
