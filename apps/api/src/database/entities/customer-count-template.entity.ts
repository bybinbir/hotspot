import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('customer_count_templates')
export class CustomerCountTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'max_subscribers' })
  maxSubscribers: number;

  @Column({ name: 'max_devices' })
  maxDevices: number;

  @Column({ nullable: true })
  description: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
