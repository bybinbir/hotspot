import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { Package } from './package.entity';
import { Subscriber } from './subscriber.entity';

export enum VoucherStatus {
  UNUSED = 'unused',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DEPLETED = 'depleted',
}

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  code: string;

  @Column({ name: 'package_id' })
  packageId: string;

  @Column({
    type: 'enum',
    enum: VoucherStatus,
    default: VoucherStatus.UNUSED,
  })
  status: VoucherStatus;

  @Column({ name: 'subscriber_id', nullable: true })
  subscriberId: string | null;

  @Column({ name: 'batch_id' })
  batchId: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'used_at', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Package)
  @JoinColumn({ name: 'package_id' })
  package: Package;

  @ManyToOne(() => Subscriber, { nullable: true })
  @JoinColumn({ name: 'subscriber_id' })
  subscriber: Subscriber | null;
}
