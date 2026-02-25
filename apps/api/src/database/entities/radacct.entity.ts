import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('radacct')
export class Radacct {
  @PrimaryGeneratedColumn({ name: 'radacctid' })
  radacctId: number;

  @Column({ name: 'acctsessionid' })
  acctSessionId: string;

  @Column()
  username: string;

  @Column({ name: 'nasipaddress' })
  nasIpAddress: string;

  @Column({ name: 'nasportid', nullable: true })
  nasPortId: string | null;

  @Column({ name: 'acctstarttime', nullable: true })
  acctStartTime: Date | null;

  @Column({ name: 'acctupdatetime', nullable: true })
  acctUpdateTime: Date | null;

  @Column({ name: 'acctstoptime', nullable: true })
  acctStopTime: Date | null;

  @Column({ name: 'acctinputoctets', type: 'bigint', default: 0 })
  acctInputOctets: string;

  @Column({ name: 'acctoutputoctets', type: 'bigint', default: 0 })
  acctOutputOctets: string;

  @Column({ name: 'acctterminatecause', nullable: true })
  acctTerminateCause: string | null;

  @Column({ name: 'framedipaddress', nullable: true })
  framedIpAddress: string | null;

  @Column({ name: 'callingstationid', nullable: true })
  callingStationId: string | null;

  @Column({ name: 'calledstationid', nullable: true })
  calledStationId: string | null;

  @Column({ name: 'tenant_id' })
  tenantId: string;
}
