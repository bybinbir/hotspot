import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('radpostauth')
export class Radpostauth {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column({ nullable: true })
  pass: string | null;

  @Column()
  reply: string;

  @Column({ name: 'authdate' })
  authDate: Date;

  @Column({ name: 'nasipaddress', nullable: true })
  nasIpAddress: string | null;

  @Column({ name: 'tenant_id' })
  tenantId: string;
}
