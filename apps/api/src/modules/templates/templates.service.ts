import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerCountTemplate, SpeedPackageTemplate } from '../../database/entities';
import {
  CreateCustomerCountTemplateDto,
  UpdateCustomerCountTemplateDto,
  CreateSpeedPackageTemplateDto,
  UpdateSpeedPackageTemplateDto,
} from './templates.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(CustomerCountTemplate)
    private readonly customerCountRepo: Repository<CustomerCountTemplate>,
    @InjectRepository(SpeedPackageTemplate)
    private readonly speedPackageRepo: Repository<SpeedPackageTemplate>,
  ) {}

  // ── Customer Count Templates ──────────────────────────────────────

  async findAllCustomerCount() {
    return this.customerCountRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOneCustomerCount(id: string) {
    const template = await this.customerCountRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Müşteri sayısı şablonu bulunamadı');
    return template;
  }

  async createCustomerCount(dto: CreateCustomerCountTemplateDto) {
    const template = this.customerCountRepo.create(dto);
    return this.customerCountRepo.save(template);
  }

  async updateCustomerCount(id: string, dto: UpdateCustomerCountTemplateDto) {
    const template = await this.findOneCustomerCount(id);
    Object.assign(template, dto);
    return this.customerCountRepo.save(template);
  }

  async removeCustomerCount(id: string) {
    const template = await this.findOneCustomerCount(id);
    await this.customerCountRepo.remove(template);
    return { deleted: true };
  }

  // ── Speed Package Templates ───────────────────────────────────────

  async findAllSpeedPackage() {
    return this.speedPackageRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOneSpeedPackage(id: string) {
    const template = await this.speedPackageRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Hız paketi şablonu bulunamadı');
    return template;
  }

  async createSpeedPackage(dto: CreateSpeedPackageTemplateDto) {
    const template = this.speedPackageRepo.create(dto);
    return this.speedPackageRepo.save(template);
  }

  async updateSpeedPackage(id: string, dto: UpdateSpeedPackageTemplateDto) {
    const template = await this.findOneSpeedPackage(id);
    Object.assign(template, dto);
    return this.speedPackageRepo.save(template);
  }

  async removeSpeedPackage(id: string) {
    const template = await this.findOneSpeedPackage(id);
    await this.speedPackageRepo.remove(template);
    return { deleted: true };
  }
}
