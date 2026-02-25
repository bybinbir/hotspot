import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalledGardenDevice, Radcheck, Tenant } from '../../database/entities';
import { CreateWalledGardenDeviceDto, UpdateWalledGardenDeviceDto } from './walled-garden.dto';

@Injectable()
export class WalledGardenService {
  constructor(
    @InjectRepository(WalledGardenDevice)
    private readonly wgDeviceRepo: Repository<WalledGardenDevice>,
    @InjectRepository(Radcheck)
    private readonly radcheckRepo: Repository<Radcheck>,
  ) {}

  /**
   * MAC adresini MikroTik formatina normalize eder.
   * AA:BB:CC:DD:EE:FF -> AA-BB-CC-DD-EE-FF
   */
  private normalizeMac(mac: string): string {
    return mac.toUpperCase().replace(/:/g, '-');
  }

  async findAll(tenant: Tenant, page = 1, limit = 20) {
    const [data, total] = await this.wgDeviceRepo.findAndCount({
      where: { tenantId: tenant.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenant: Tenant) {
    const device = await this.wgDeviceRepo.findOne({
      where: { id, tenantId: tenant.id },
    });
    if (!device) throw new NotFoundException('Bypass cihaz bulunamadi');
    return device;
  }

  async create(dto: CreateWalledGardenDeviceDto, tenant: Tenant) {
    if (dto.macAddress) {
      const normalizedMac = this.normalizeMac(dto.macAddress);
      const existing = await this.wgDeviceRepo.findOne({
        where: { macAddress: normalizedMac, tenantId: tenant.id },
      });
      if (existing) {
        throw new ConflictException('Bu MAC adresi zaten kayitli');
      }
    }

    const device = this.wgDeviceRepo.create({
      ...dto,
      macAddress: dto.macAddress ? this.normalizeMac(dto.macAddress) : null,
      tenantId: tenant.id,
    });

    const saved = await this.wgDeviceRepo.save(device);

    if (saved.isActive && saved.macAddress) {
      await this.syncToRadius(saved);
    }

    return saved;
  }

  async update(id: string, dto: UpdateWalledGardenDeviceDto, tenant: Tenant) {
    const device = await this.findOne(id, tenant);
    const oldMac = device.macAddress;

    if (dto.macAddress) {
      dto.macAddress = this.normalizeMac(dto.macAddress);
    }

    Object.assign(device, dto);
    const updated = await this.wgDeviceRepo.save(device);

    // Eski MAC degistiyse RADIUS'tan sil
    if (oldMac && oldMac !== updated.macAddress) {
      await this.removeFromRadius(oldMac, tenant.id);
    }

    // Yeni duruma gore sync
    if (updated.isActive && updated.macAddress) {
      await this.syncToRadius(updated);
    } else if (oldMac) {
      await this.removeFromRadius(oldMac, tenant.id);
    }

    return updated;
  }

  async remove(id: string, tenant: Tenant) {
    const device = await this.findOne(id, tenant);
    if (device.macAddress) {
      await this.removeFromRadius(device.macAddress, tenant.id);
    }
    await this.wgDeviceRepo.remove(device);
    return { deleted: true };
  }

  /**
   * MAC bypass cihazini radcheck tablosuna yaz.
   * MikroTik, dogrulanmamis cihazlar icin MAC'i hem username hem password olarak gonderir.
   * radcheck'e Cleartext-Password := MAC yazmak PAP modulunun bunu otomatik eslestirir.
   */
  private async syncToRadius(device: WalledGardenDevice): Promise<void> {
    const mac = device.macAddress!;
    const tenantId = device.tenantId;

    await this.radcheckRepo.delete({ username: mac, tenantId });

    await this.radcheckRepo.save({
      username: mac,
      attribute: 'Cleartext-Password',
      op: ':=',
      value: mac,
      tenantId,
    });
  }

  private async removeFromRadius(mac: string, tenantId: string): Promise<void> {
    await this.radcheckRepo.delete({ username: mac, tenantId });
  }
}
