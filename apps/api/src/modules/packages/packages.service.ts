import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package, Tenant } from '../../database/entities';
import { CreatePackageDto, UpdatePackageDto } from './packages.dto';
import { RadiusSyncService } from '../radius/radius-sync.service';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private readonly packageRepository: Repository<Package>,
    private readonly radiusSyncService: RadiusSyncService,
  ) {}

  async findAll(tenant: Tenant) {
    return this.packageRepository.find({
      where: { tenantId: tenant.id },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenant: Tenant) {
    const pkg = await this.packageRepository.findOne({
      where: { id, tenantId: tenant.id },
    });
    if (!pkg) throw new NotFoundException('Paket bulunamadı');
    return pkg;
  }

  async create(dto: CreatePackageDto, tenant: Tenant) {
    const pkg = this.packageRepository.create({
      ...dto,
      dataLimit: dto.dataLimit != null ? String(dto.dataLimit) : null,
      tenantId: tenant.id,
    });
    const saved = await this.packageRepository.save(pkg);
    await this.radiusSyncService.syncPackageGroup(saved, tenant);
    return saved;
  }

  async update(id: string, dto: UpdatePackageDto, tenant: Tenant) {
    const pkg = await this.findOne(id, tenant);
    Object.assign(pkg, dto);
    const updated = await this.packageRepository.save(pkg);
    await this.radiusSyncService.syncPackageGroup(updated, tenant);
    return updated;
  }

  async remove(id: string, tenant: Tenant) {
    const pkg = await this.findOne(id, tenant);
    const packageId = pkg.id;
    await this.packageRepository.remove(pkg);
    await this.radiusSyncService.removePackageGroup(packageId, tenant.id, tenant.slug);
    return { deleted: true };
  }
}
