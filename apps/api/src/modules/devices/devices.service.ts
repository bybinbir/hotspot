import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NasDevice } from '../../database/entities';
import { CreateDeviceDto, UpdateDeviceDto } from './devices.dto';
import { Tenant } from '../../database/entities';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(NasDevice)
    private readonly deviceRepository: Repository<NasDevice>,
  ) {}

  async findAll(tenant: Tenant, page = 1, limit = 20) {
    const [data, total] = await this.deviceRepository.findAndCount({
      where: { tenantId: tenant.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, tenant: Tenant) {
    const device = await this.deviceRepository.findOne({
      where: { id, tenantId: tenant.id },
    });

    if (!device) {
      throw new NotFoundException('Cihaz bulunamadı');
    }

    return device;
  }

  async create(dto: CreateDeviceDto, tenant: Tenant) {
    // Check device limit
    const count = await this.deviceRepository.count({
      where: { tenantId: tenant.id },
    });

    if (count >= tenant.maxDevices) {
      throw new ForbiddenException(
        `Maksimum cihaz limitine ulaşıldı (${tenant.maxDevices})`,
      );
    }

    const device = this.deviceRepository.create({
      ...dto,
      tenantId: tenant.id,
    });

    return this.deviceRepository.save(device);
  }

  async update(id: string, dto: UpdateDeviceDto, tenant: Tenant) {
    const device = await this.findOne(id, tenant);
    Object.assign(device, dto);
    return this.deviceRepository.save(device);
  }

  async remove(id: string, tenant: Tenant) {
    const device = await this.findOne(id, tenant);
    await this.deviceRepository.remove(device);
    return { deleted: true };
  }
}
