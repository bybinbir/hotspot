import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { Package } from './package.entity';

export enum SubscriberCreatedBy {
  ADMIN = 'admin',
  VOUCHER = 'voucher',
  SELF_REGISTER = 'self_register',
  SMS = 'sms',
}

@Entity('subscribers')
export class Subscriber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  username: string;

  @Column({ name: 'password_cleartext' })
  passwordCleartext: string; // Encrypted, needed for RADIUS auth

  @Column({ name: 'first_name', nullable: true })
  firstName: string | null;

  @Column({ name: 'last_name', nullable: true })
  lastName: string | null;

  @Column({ nullable: true })
  email: string | null;

  @Column({ nullable: true })
  phone: string | null;

  @Column({ name: 'package_id' })
  packageId: string;

  @Column({ name: 'mac_address', nullable: true })
  macAddress: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date | null;

  @Column({
    name: 'created_by',
    type: 'enum',
    enum: SubscriberCreatedBy,
    default: SubscriberCreatedBy.ADMIN,
  })
  createdBy: SubscriberCreatedBy;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.subscribers)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Package, (pkg) => pkg.subscribers)
  @JoinColumn({ name: 'package_id' })
  package: Package;
}
