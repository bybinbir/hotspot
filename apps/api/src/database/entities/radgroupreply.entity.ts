import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('radgroupreply')
export class Radgroupreply {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
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
