import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Radacct, Radpostauth, Tenant } from '../../database/entities';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(Radacct)
    private readonly radacctRepository: Repository<Radacct>,
    @InjectRepository(Radpostauth)
    private readonly radpostauthRepository: Repository<Radpostauth>,
  ) {}

  /**
   * Aktif oturumları getirir (acctStopTime IS NULL).
   */
  async getActiveSessions(tenant: Tenant, page = 1, limit = 20) {
    const qb = this.radacctRepository
      .createQueryBuilder('r')
      .select([
        'r.radacctId',
        'r.username',
        'r.nasIpAddress',
        'r.acctStartTime',
        'r.acctInputOctets',
        'r.acctOutputOctets',
        'r.framedIpAddress',
        'r.callingStationId',
        'r.acctSessionId',
      ])
      .where('r.tenant_id = :tenantId', { tenantId: tenant.id })
      .andWhere('r.acctStopTime IS NULL')
      .orderBy('r.acctStartTime', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Tamamlanmis oturum gecmisini getirir (acctStopTime IS NOT NULL).
   * Username, tarih araligi ile filtreleme destekler.
   */
  async getSessionHistory(
    tenant: Tenant,
    page = 1,
    limit = 20,
    username?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const qb = this.radacctRepository
      .createQueryBuilder('r')
      .where('r.tenant_id = :tenantId', { tenantId: tenant.id })
      .andWhere('r.acctStopTime IS NOT NULL');

    if (username) {
      qb.andWhere('r.username = :username', { username });
    }

    if (startDate) {
      qb.andWhere('r.acctStopTime >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('r.acctStopTime <= :endDate', { endDate });
    }

    qb.orderBy('r.acctStopTime', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Toplu kullanim istatistiklerini getirir.
   */
  async getUsageStats(tenant: Tenant) {
    const tenantId = tenant.id;

    const [activeResult, allTimeResult, todayResult, todaySessionsResult] =
      await Promise.all([
        // Aktif oturum sayisi
        this.radacctRepository
          .createQueryBuilder('r')
          .select('COUNT(*)', 'count')
          .where('r.tenant_id = :tenantId', { tenantId })
          .andWhere('r.acctStopTime IS NULL')
          .getRawOne(),

        // Tum zamanlarin toplam veri kullanimi
        this.radacctRepository
          .createQueryBuilder('r')
          .select('COALESCE(SUM(r.acctinputoctets), 0)', 'totalIn')
          .addSelect('COALESCE(SUM(r.acctoutputoctets), 0)', 'totalOut')
          .where('r.tenant_id = :tenantId', { tenantId })
          .getRawOne(),

        // Bugunun veri kullanimi
        this.radacctRepository
          .createQueryBuilder('r')
          .select('COALESCE(SUM(r.acctinputoctets), 0)', 'todayIn')
          .addSelect('COALESCE(SUM(r.acctoutputoctets), 0)', 'todayOut')
          .where('r.tenant_id = :tenantId', { tenantId })
          .andWhere('r.acctstarttime >= CURRENT_DATE')
          .getRawOne(),

        // Bugun baslayan oturum sayisi
        this.radacctRepository
          .createQueryBuilder('r')
          .select('COUNT(*)', 'count')
          .where('r.tenant_id = :tenantId', { tenantId })
          .andWhere('r.acctstarttime >= CURRENT_DATE')
          .getRawOne(),
      ]);

    return {
      totalActiveSessions: parseInt(activeResult?.count ?? '0', 10),
      totalDataIn: allTimeResult?.totalIn ?? '0',
      totalDataOut: allTimeResult?.totalOut ?? '0',
      todayDataIn: todayResult?.todayIn ?? '0',
      todayDataOut: todayResult?.todayOut ?? '0',
      todayNewSessions: parseInt(todaySessionsResult?.count ?? '0', 10),
    };
  }

  /**
   * Belirli bir abone icin kullanim ozetini getirir.
   */
  async getSubscriberUsage(tenant: Tenant, username: string) {
    const tenantId = tenant.id;

    const [summaryResult, lastSession, activeSessions] = await Promise.all([
      // Toplam oturum sayisi ve veri kullanimi
      this.radacctRepository
        .createQueryBuilder('r')
        .select('COUNT(*)', 'totalSessions')
        .addSelect('COALESCE(SUM(r.acctinputoctets), 0)', 'totalDataIn')
        .addSelect('COALESCE(SUM(r.acctoutputoctets), 0)', 'totalDataOut')
        .where('r.tenant_id = :tenantId', { tenantId })
        .andWhere('r.username = :username', { username })
        .getRawOne(),

      // En son oturum
      this.radacctRepository
        .createQueryBuilder('r')
        .where('r.tenant_id = :tenantId', { tenantId })
        .andWhere('r.username = :username', { username })
        .orderBy('r.acctStartTime', 'DESC')
        .getOne(),

      // Aktif oturumlar
      this.radacctRepository
        .createQueryBuilder('r')
        .where('r.tenant_id = :tenantId', { tenantId })
        .andWhere('r.username = :username', { username })
        .andWhere('r.acctStopTime IS NULL')
        .orderBy('r.acctStartTime', 'DESC')
        .getMany(),
    ]);

    return {
      totalSessions: parseInt(summaryResult?.totalSessions ?? '0', 10),
      totalDataIn: summaryResult?.totalDataIn ?? '0',
      totalDataOut: summaryResult?.totalDataOut ?? '0',
      lastSession,
      activeSessions,
    };
  }

  /**
   * Kimlik dogrulama loglarini getirir (radpostauth tablosu).
   * Sifre alanini maskeler.
   */
  async getAuthLogs(
    tenant: Tenant,
    page = 1,
    limit = 20,
    username?: string,
  ) {
    const qb = this.radpostauthRepository
      .createQueryBuilder('rp')
      .where('rp.tenant_id = :tenantId', { tenantId: tenant.id });

    if (username) {
      qb.andWhere('rp.username = :username', { username });
    }

    qb.orderBy('rp.authdate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [rawData, total] = await qb.getManyAndCount();

    const data = rawData.map((entry) => ({
      ...entry,
      pass: this.maskPassword(entry.pass),
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Sifrenin ilk 2 karakterini gosterip gerisini maskeler.
   */
  private maskPassword(pass: string | null): string {
    if (!pass || pass.length <= 2) return '***';
    return pass.substring(0, 2) + '***';
  }
}
