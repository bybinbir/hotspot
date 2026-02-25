import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { AdminUser } from './admin-user.entity';
import { NasDevice } from './nas-device.entity';
import { Package } from './package.entity';
import { Subscriber } from './subscriber.entity';

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ unique: true })
  domain: string;

  @Column({ type: 'enum', enum: TenantStatus, default: TenantStatus.TRIAL })
  status: TenantStatus;

  @Column({ name: 'max_subscribers', default: 100 })
  maxSubscribers: number;

  @Column({ name: 'max_devices', default: 3 })
  maxDevices: number;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  @OneToMany(() => AdminUser, (user) => user.tenant)
  adminUsers: AdminUser[];

  @OneToMany(() => NasDevice, (device) => device.tenant)
  devices: NasDevice[];

  @OneToMany(() => Package, (pkg) => pkg.tenant)
  packages: Package[];

  @OneToMany(() => Subscriber, (sub) => sub.tenant)
  subscribers: Subscriber[];
}
