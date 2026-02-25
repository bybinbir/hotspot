import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('radgroupcheck')
export class RadGroupCheck {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'groupname' })
  groupname: string;

  @Column()
  attribute: string;

  @Column({ length: 2 })
  op: string;

  @Column()
  value: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;
}
