import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('speed_package_templates')
export class SpeedPackageTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb' })
  packages: Array<{
    name: string;
    downloadSpeed: number;
    uploadSpeed: number;
    dataLimit: number | null;
    timeLimit: number | null;
    durationDays: number;
    simultaneousSessions: number;
    price: number;
    currency: string;
  }>;

  @Column({ nullable: true })
  description: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
