import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Radcheck,
  Radreply,
  RadGroupCheck,
  Radgroupreply,
  Radusergroup,
  Subscriber,
  Package,
  NasDevice,
  NasType,
  Tenant,
} from '../../database/entities';
import { VendorAttributesService } from './vendor-attributes.service';

@Injectable()
export class RadiusSyncService {
  private readonly logger = new Logger(RadiusSyncService.name);

  constructor(
    @InjectRepository(Radcheck)
    private readonly radcheckRepo: Repository<Radcheck>,
    @InjectRepository(Radreply)
    private readonly radreplyRepo: Repository<Radreply>,
    @InjectRepository(RadGroupCheck)
    private readonly radgroupcheckRepo: Repository<RadGroupCheck>,
    @InjectRepository(Radgroupreply)
    private readonly radgroupreplyRepo: Repository<Radgroupreply>,
    @InjectRepository(Radusergroup)
    private readonly radusergroupRepo: Repository<Radusergroup>,
    @InjectRepository(NasDevice)
    private readonly nasDeviceRepo: Repository<NasDevice>,
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(Package)
    private readonly packageRepo: Repository<Package>,
    private readonly vendorAttributesService: VendorAttributesService,
  ) {}

  /**
   * Synchronize a subscriber's authentication and authorization data
   * to FreeRADIUS tables (radcheck + radusergroup).
   */
  async syncSubscriber(subscriber: Subscriber, tenant: Tenant): Promise<void> {
    const { username, tenantId } = subscriber;
    this.logger.debug(
      `Syncing subscriber "${username}" for tenant "${tenant.slug}"`,
    );

    try {
      // Clean existing entries
      await this.radcheckRepo.delete({ username, tenantId });
      await this.radusergroupRepo.delete({ username, tenantId });

      // Build radcheck entries
      const radcheckEntries: Partial<Radcheck>[] = [
        {
          username,
          attribute: 'Cleartext-Password',
          op: ':=',
          value: subscriber.passwordCleartext,
          tenantId,
        },
      ];

      if (subscriber.expiresAt) {
        radcheckEntries.push({
          username,
          attribute: 'Expiration',
          op: ':=',
          value: this.formatExpirationDate(subscriber.expiresAt),
          tenantId,
        });
      }

      if (!subscriber.isActive) {
        radcheckEntries.push({
          username,
          attribute: 'Auth-Type',
          op: ':=',
          value: 'Reject',
          tenantId,
        });
      }

      await this.radcheckRepo.save(radcheckEntries);

      // Link subscriber to their package group
      const groupname = `${tenant.slug}_${subscriber.packageId}`;
      await this.radusergroupRepo.save({
        username,
        groupname,
        priority: 0,
        tenantId: tenant.id,
      });

      this.logger.debug(
        `Subscriber "${username}" synced with group "${groupname}"`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync subscriber "${username}": ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Remove all RADIUS entries for a subscriber (radcheck, radreply, radusergroup).
   */
  async removeSubscriber(username: string, tenantId: string): Promise<void> {
    this.logger.debug(
      `Removing subscriber "${username}" from RADIUS tables`,
    );

    try {
      await this.radcheckRepo.delete({ username, tenantId });
      await this.radreplyRepo.delete({ username, tenantId });
      await this.radusergroupRepo.delete({ username, tenantId });

      this.logger.debug(`Subscriber "${username}" removed from RADIUS tables`);
    } catch (error) {
      this.logger.error(
        `Failed to remove subscriber "${username}": ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Synchronize a package's group reply attributes to FreeRADIUS (radgroupreply).
   * Generates vendor-specific attributes for each NAS device type in the tenant.
   */
  async syncPackageGroup(pkg: Package, tenant: Tenant): Promise<void> {
    const groupname = `${tenant.slug}_${pkg.id}`;
    this.logger.debug(
      `Syncing package group "${groupname}" for tenant "${tenant.slug}"`,
    );

    try {
      // Get all NAS devices for this tenant
      const nasDevices = await this.nasDeviceRepo.find({
        where: { tenantId: tenant.id },
      });

      // Collect unique NAS types
      const uniqueNasTypes = [
        ...new Set(nasDevices.map((device) => device.type)),
      ];

      if (uniqueNasTypes.length === 0) {
        this.logger.debug(
          `No NAS devices found for tenant "${tenant.slug}", using GENERIC type`,
        );
        uniqueNasTypes.push(NasType.GENERIC);
      }

      // Delete existing group reply entries
      await this.radgroupreplyRepo.delete({ groupname, tenantId: tenant.id });

      // Generate and insert attributes for each NAS type
      for (const nasType of uniqueNasTypes) {
        const attributes =
          this.vendorAttributesService.generatePackageAttributes(nasType, {
            downloadSpeed: pkg.downloadSpeed,
            uploadSpeed: pkg.uploadSpeed,
            simultaneousSessions: pkg.simultaneousSessions,
            timeLimit: pkg.timeLimit,
            dataLimit: pkg.dataLimit,
          });

        const groupReplyEntries: Partial<Radgroupreply>[] = attributes.map(
          (attr) => ({
            groupname,
            attribute: attr.attribute,
            op: attr.op,
            value: attr.value,
            tenantId: tenant.id,
          }),
        );

        if (groupReplyEntries.length > 0) {
          await this.radgroupreplyRepo.save(groupReplyEntries);
        }
      }

      this.logger.debug(
        `Package group "${groupname}" synced with ${uniqueNasTypes.length} NAS type(s)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync package group "${groupname}": ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Remove all RADIUS group entries for a package (radgroupreply, radgroupcheck).
   */
  async removePackageGroup(
    packageId: string,
    tenantId: string,
    tenantSlug: string,
  ): Promise<void> {
    const groupname = `${tenantSlug}_${packageId}`;
    this.logger.debug(`Removing package group "${groupname}" from RADIUS tables`);

    try {
      await this.radgroupreplyRepo.delete({ groupname, tenantId });
      await this.radgroupcheckRepo.delete({ groupname, tenantId });

      this.logger.debug(
        `Package group "${groupname}" removed from RADIUS tables`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to remove package group "${groupname}": ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Full resync of all packages and subscribers for a tenant.
   * Useful for initial provisioning or recovery scenarios.
   */
  async syncAllForTenant(tenant: Tenant): Promise<void> {
    this.logger.debug(
      `Starting full RADIUS sync for tenant "${tenant.slug}"`,
    );

    try {
      const packages = await this.packageRepo.find({
        where: { tenantId: tenant.id },
      });
      const subscribers = await this.subscriberRepo.find({
        where: { tenantId: tenant.id },
      });

      this.logger.debug(
        `Found ${packages.length} packages and ${subscribers.length} subscribers for tenant "${tenant.slug}"`,
      );

      // Sync all packages first (groups must exist before subscriber linkage)
      for (const pkg of packages) {
        await this.syncPackageGroup(pkg, tenant);
      }

      // Sync all subscribers
      for (const subscriber of subscribers) {
        await this.syncSubscriber(subscriber, tenant);
      }

      this.logger.debug(
        `Full RADIUS sync completed for tenant "${tenant.slug}"`,
      );
    } catch (error) {
      this.logger.error(
        `Failed full sync for tenant "${tenant.slug}": ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Format a Date to the FreeRADIUS Expiration attribute format.
   * Expected format: "Month Day Year HH:MM:SS"
   * Example: "January 01 2026 00:00:00"
   */
  private formatExpirationDate(date: Date): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${month} ${day} ${year} ${hours}:${minutes}:${seconds}`;
  }
}
