import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { NasDevice, Radacct } from '../../database/entities';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);

/**
 * CoA (Change of Authorization) Service
 *
 * Sends RADIUS CoA and Disconnect-Request packets to NAS devices
 * to manage active user sessions. Unlike normal RADIUS flow (NAS -> RADIUS),
 * CoA works in reverse (RADIUS -> NAS) to dynamically control sessions.
 *
 * Uses the `radclient` CLI tool from FreeRADIUS for packet construction
 * and transmission, avoiding the complexity of implementing the RADIUS
 * protocol from scratch.
 */
@Injectable()
export class CoaService {
  private readonly logger = new Logger(CoaService.name);

  constructor(
    @InjectRepository(Radacct)
    private readonly radacctRepository: Repository<Radacct>,

    @InjectRepository(NasDevice)
    private readonly nasDeviceRepository: Repository<NasDevice>,
  ) {}

  /**
   * Disconnect all active sessions for a given user.
   * Finds every session where acctStopTime is null (still active),
   * resolves the NAS device for each, and sends a Disconnect-Request.
   */
  async disconnectUser(
    username: string,
    tenantId: string,
  ): Promise<{ total: number; disconnected: number; failed: number }> {
    this.logger.log(
      `Kullanicinin tum aktif oturumlari sonlandiriliyor: ${username} (tenant: ${tenantId})`,
    );

    const activeSessions = await this.radacctRepository.find({
      where: {
        username,
        tenantId,
        acctStopTime: IsNull(),
      },
    });

    if (activeSessions.length === 0) {
      this.logger.log(
        `Kullanici icin aktif oturum bulunamadi: ${username}`,
      );
      return { total: 0, disconnected: 0, failed: 0 };
    }

    this.logger.log(
      `${activeSessions.length} aktif oturum bulundu, Disconnect-Request gonderiliyor`,
    );

    let disconnected = 0;
    let failed = 0;

    for (const session of activeSessions) {
      try {
        const nas = await this.findNasForSession(session, tenantId);

        if (!nas) {
          this.logger.warn(
            `NAS cihazi bulunamadi: IP=${session.nasIpAddress}, oturum=${session.acctSessionId} atlaniyor`,
          );
          failed++;
          continue;
        }

        await this.sendCoAPacket(nas.ipAddress, nas.coaPort, nas.secret, {
          'User-Name': session.username,
          'Acct-Session-Id': session.acctSessionId,
          'NAS-IP-Address': session.nasIpAddress,
        });

        disconnected++;
        this.logger.log(
          `Disconnect-Request gonderildi: oturum=${session.acctSessionId}`,
        );
      } catch (error) {
        failed++;
        this.logger.error(
          `Disconnect-Request gonderilemedi: oturum=${session.acctSessionId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    this.logger.log(
      `disconnectUser sonucu: toplam=${activeSessions.length}, basarili=${disconnected}, basarisiz=${failed}`,
    );

    return { total: activeSessions.length, disconnected, failed };
  }

  /**
   * Disconnect a specific session by its accounting session ID.
   */
  async disconnectSession(
    sessionId: string,
    tenantId: string,
  ): Promise<boolean> {
    this.logger.log(
      `Oturum sonlandiriliyor: sessionId=${sessionId} (tenant: ${tenantId})`,
    );

    const session = await this.radacctRepository.findOne({
      where: {
        acctSessionId: sessionId,
        tenantId,
        acctStopTime: IsNull(),
      },
    });

    if (!session) {
      this.logger.warn(
        `Aktif oturum bulunamadi: sessionId=${sessionId}`,
      );
      return false;
    }

    const nas = await this.findNasForSession(session, tenantId);

    if (!nas) {
      this.logger.warn(
        `NAS cihazi bulunamadi: IP=${session.nasIpAddress}, oturum sonlandirilemiyor`,
      );
      return false;
    }

    try {
      await this.sendCoAPacket(nas.ipAddress, nas.coaPort, nas.secret, {
        'User-Name': session.username,
        'Acct-Session-Id': session.acctSessionId,
        'NAS-IP-Address': session.nasIpAddress,
      });

      this.logger.log(
        `Disconnect-Request basariyla gonderildi: sessionId=${sessionId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Disconnect-Request gonderilemedi: sessionId=${sessionId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }

  /**
   * Get all active sessions for a tenant, optionally filtered by username.
   * Active sessions are those where acctStopTime is null.
   */
  async getActiveSessions(
    tenantId: string,
    username?: string,
  ): Promise<Radacct[]> {
    this.logger.debug(
      `Aktif oturumlar sorgulanıyor: tenant=${tenantId}${username ? `, username=${username}` : ''}`,
    );

    const where: Record<string, unknown> = {
      tenantId,
      acctStopTime: IsNull(),
    };

    if (username) {
      where.username = username;
    }

    const sessions = await this.radacctRepository.find({ where });

    this.logger.debug(`${sessions.length} aktif oturum bulundu`);
    return sessions;
  }

  /**
   * Send a RADIUS CoA or Disconnect-Request packet to a NAS device.
   *
   * Uses the `radclient` CLI tool (bundled with FreeRADIUS) instead of
   * implementing the RADIUS protocol manually. This is far more reliable
   * and handles packet construction, authenticator calculation, etc.
   *
   * Usage: echo "attr=value\nattr2=value2" | radclient -x host:port disconnect secret
   *
   * @param nasIpAddress - IP address of the NAS device
   * @param coaPort      - CoA port on the NAS (typically 3799)
   * @param secret       - RADIUS shared secret for this NAS
   * @param attributes   - RADIUS attributes to include in the packet
   * @param packetType   - Type of packet: 'disconnect' or 'coa' (default: 'disconnect')
   */
  async sendCoAPacket(
    nasIpAddress: string,
    coaPort: number,
    secret: string,
    attributes: Record<string, string>,
    packetType: 'disconnect' | 'coa' = 'disconnect',
  ): Promise<{ success: boolean; output: string }> {
    const attrLines = Object.entries(attributes)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const target = `${nasIpAddress}:${coaPort}`;

    this.logger.log(
      `radclient ${packetType} paketi gonderiliyor: hedef=${target}, ozellikler=[${Object.keys(attributes).join(', ')}]`,
    );

    // Escape shell special characters in the secret and attribute values
    const escapedSecret = secret.replace(/'/g, "'\\''");
    const escapedAttrLines = attrLines.replace(/'/g, "'\\''");

    const command = `echo '${escapedAttrLines}' | radclient -x ${target} ${packetType} '${escapedSecret}'`;

    try {
      const { stdout, stderr } = await exec(command, {
        timeout: 10_000, // 10 second timeout for NAS response
      });

      const output = (stdout + stderr).trim();

      // radclient returns exit code 0 on success (received ACK from NAS)
      this.logger.log(
        `radclient basarili: hedef=${target}, cikti=${output.substring(0, 200)}`,
      );

      return { success: true, output };
    } catch (error: unknown) {
      const execError = error as {
        code?: number | string;
        stdout?: string;
        stderr?: string;
        message?: string;
      };

      // radclient not found (not installed or not in PATH)
      if (
        execError.code === 127 ||
        execError.message?.includes('not found') ||
        execError.message?.includes('ENOENT')
      ) {
        this.logger.warn(
          `radclient bulunamadi. FreeRADIUS kurulu ve PATH icerisinde oldugundan emin olun. ` +
            `Gonderilmek istenen paket: hedef=${target}, tip=${packetType}, ozellikler=${JSON.stringify(attributes)}`,
        );
        return {
          success: false,
          output: 'radclient not found - FreeRADIUS client tools not installed',
        };
      }

      // radclient ran but NAS rejected or timed out
      const output = (
        (execError.stdout || '') + (execError.stderr || '')
      ).trim();

      this.logger.error(
        `radclient basarisiz: hedef=${target}, kod=${execError.code}, cikti=${output.substring(0, 200)}`,
      );

      return { success: false, output: output || 'radclient execution failed' };
    }
  }

  /**
   * Find the NAS device entry matching a session's NAS IP address.
   * Only returns active NAS devices belonging to the same tenant.
   */
  async findNasForSession(
    session: Radacct,
    tenantId: string,
  ): Promise<NasDevice | null> {
    const nas = await this.nasDeviceRepository.findOne({
      where: {
        ipAddress: session.nasIpAddress,
        tenantId,
        isActive: true,
      },
    });

    if (!nas) {
      this.logger.warn(
        `NAS cihazi bulunamadi: IP=${session.nasIpAddress}, tenant=${tenantId}`,
      );
    }

    return nas;
  }
}
