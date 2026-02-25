import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Tenant } from '../../database/entities';
import { AccountingService } from './accounting.service';
import { CoaService } from './coa.service';

@Controller('v1/radius')
@UseGuards(JwtAuthGuard, TenantGuard)
export class RadiusController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly coaService: CoaService,
  ) {}

  @Get('sessions/active')
  getActiveSessions(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.accountingService.getActiveSessions(
      tenant,
      page ? +page : 1,
      limit ? +limit : 20,
    );
  }

  @Get('sessions/history')
  getSessionHistory(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('username') username?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.accountingService.getSessionHistory(
      tenant,
      page ? +page : 1,
      limit ? +limit : 20,
      username,
      startDate,
      endDate,
    );
  }

  @Get('stats')
  getUsageStats(@CurrentTenant() tenant: Tenant) {
    return this.accountingService.getUsageStats(tenant);
  }

  @Get('usage/:username')
  getSubscriberUsage(
    @CurrentTenant() tenant: Tenant,
    @Param('username') username: string,
  ) {
    return this.accountingService.getSubscriberUsage(tenant, username);
  }

  @Get('auth-logs')
  getAuthLogs(
    @CurrentTenant() tenant: Tenant,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('username') username?: string,
  ) {
    return this.accountingService.getAuthLogs(
      tenant,
      page ? +page : 1,
      limit ? +limit : 20,
      username,
    );
  }

  @Post('disconnect/:username')
  disconnectUser(
    @CurrentTenant() tenant: Tenant,
    @Param('username') username: string,
  ) {
    return this.coaService.disconnectUser(username, tenant.id);
  }

  @Post('disconnect-session/:sessionId')
  disconnectSession(
    @CurrentTenant() tenant: Tenant,
    @Param('sessionId') sessionId: string,
  ) {
    return this.coaService.disconnectSession(sessionId, tenant.id);
  }

  // ─── CSV Export Endpoints ──────────────────────────────────────────

  @Get('sessions/active/export')
  async exportActiveSessions(
    @CurrentTenant() tenant: Tenant,
    @Res() res: Response,
  ) {
    const { data } = await this.accountingService.getActiveSessions(tenant, 1, 10000);
    const csv = this.buildSessionCsv(data, true);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=active-sessions.csv');
    res.send(csv);
  }

  @Get('sessions/history/export')
  async exportSessionHistory(
    @CurrentTenant() tenant: Tenant,
    @Res() res: Response,
    @Query('username') username?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { data } = await this.accountingService.getSessionHistory(tenant, 1, 10000, username, startDate, endDate);
    const csv = this.buildSessionCsv(data, false);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=session-history.csv');
    res.send(csv);
  }

  @Get('auth-logs/export')
  async exportAuthLogs(
    @CurrentTenant() tenant: Tenant,
    @Res() res: Response,
    @Query('username') username?: string,
  ) {
    const { data } = await this.accountingService.getAuthLogs(tenant, 1, 10000, username);
    const csv = this.buildAuthLogsCsv(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=auth-logs.csv');
    res.send(csv);
  }

  // ─── Private CSV Helpers ───────────────────────────────────────────

  private buildSessionCsv(data: any[], isActive: boolean): string {
    const headers = [
      'Username',
      'IP Address',
      'MAC',
      'NAS IP',
      'Start Time',
      ...(isActive ? [] : ['End Time', 'Terminate Cause']),
      'Data In (bytes)',
      'Data Out (bytes)',
    ];
    const rows = data.map((s: any) =>
      [
        s.username,
        s.framedIpAddress || '',
        s.callingStationId || '',
        s.nasIpAddress || '',
        s.acctStartTime ? new Date(s.acctStartTime).toISOString() : '',
        ...(isActive
          ? []
          : [
              s.acctStopTime ? new Date(s.acctStopTime).toISOString() : '',
              s.acctTerminateCause || '',
            ]),
        s.acctInputOctets || 0,
        s.acctOutputOctets || 0,
      ].join(','),
    );
    return headers.join(',') + '\n' + rows.join('\n');
  }

  private buildAuthLogsCsv(data: any[]): string {
    const headers = ['Username', 'Result', 'Date', 'NAS IP'];
    const rows = data.map((l: any) =>
      [
        l.username,
        l.reply || '',
        l.authdate ? new Date(l.authdate).toISOString() : '',
        l.nasIpAddress || '',
      ].join(','),
    );
    return headers.join(',') + '\n' + rows.join('\n');
  }
}
