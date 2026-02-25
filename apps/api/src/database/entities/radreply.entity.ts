import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('radreply')
export class Radreply {
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
