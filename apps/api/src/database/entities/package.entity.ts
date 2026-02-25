import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { Subscriber } from './subscriber.entity';

@Entity('packages')
export class Package {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ name: 'download_speed' })
  downloadSpeed: number; // Kbps

  @Column({ name: 'upload_speed' })
  uploadSpeed: number; // Kbps

  @Column({ name: 'data_limit', type: 'bigint', nullable: true })
  dataLimit: string | null; // Bytes, stored as string due to bigint

  @Column({ name: 'time_limit', nullable: true })
  timeLimit: number | null; // Minutes

  @Column({ name: 'duration_days' })
  durationDays: number;

  @Column({ name: 'simultaneous_sessions', default: 1 })
  simultaneousSessions: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ default: 'TRY' })
  currency: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.packages)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => Subscriber, (sub) => sub.package)
  subscribers: Subscriber[];
}
