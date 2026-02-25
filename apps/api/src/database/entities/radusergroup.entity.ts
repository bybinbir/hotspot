import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('radusergroup')
export class Radusergroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  groupname: string;

  @Column({ default: 0 })
  priority: number;

  @Column({ name: 'tenant_id' })
  tenantId: string;
}
