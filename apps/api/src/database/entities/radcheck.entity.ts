import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('radcheck')
export class Radcheck {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  attribute: string;

  @Column({ length: 2 })
  op: string;

  @Column()
  value: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;
}
