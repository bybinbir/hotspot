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

export enum NasType {
  MIKROTIK = 'mikrotik',
  CISCO = 'cisco',
  JUNIPER = 'juniper',
  GENERIC = 'generic',
}

@Entity('nas_devices')
export class NasDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column()
  name: string;

  @Column({ name: 'ip_address' })
  ipAddress: string;

  @Column()
  secret: string;

  @Column({ type: 'enum', enum: NasType, default: NasType.MIKROTIK })
  type: NasType;

  @Column({ name: 'nas_port', default: 1812 })
  nasPort: number;

  @Column({ name: 'coa_port', default: 3799 })
  coaPort: number;

  @Column({ nullable: true })
  description: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.devices)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
