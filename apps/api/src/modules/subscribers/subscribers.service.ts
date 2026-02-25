import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber, SubscriberCreatedBy, Tenant } from '../../database/entities';
import { CreateSubscriberDto, UpdateSubscriberDto } from './subscribers.dto';
import { RadiusSyncService } from '../radius/radius-sync.service';

@Injectable()
export class SubscribersService {
  constructor(
    @InjectRepository(Subscriber)
    private readonly subscriberRepository: Repository<Subscriber>,
    private readonly radiusSyncService: RadiusSyncService,
  ) {}

  async findAll(
    tenant: Tenant,
    page = 1,
    limit = 20,
    search?: string,
    status?: string,
  ) {
    const qb = this.subscriberRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.package', 'p')
      .where('s.tenant_id = :tenantId', { tenantId: tenant.id });

    if (search) {
      qb.andWhere(
        '(s.username ILIKE :search OR s.first_name ILIKE :search OR s.last_name ILIKE :search OR s.email ILIKE :search OR s.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status === 'active') {
      qb.andWhere('s.is_active = true');
    } else if (status === 'inactive') {
      qb.andWhere('s.is_active = false');
    }

    qb.orderBy('s.created_at', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, tenant: Tenant) {
    const subscriber = await this.subscriberRepository.findOne({
      where: { id, tenantId: tenant.id },
      relations: ['package'],
    });
    if (!subscriber) throw new NotFoundException('Kullanıcı bulunamadı');
    return subscriber;
  }

  async create(dto: CreateSubscriberDto, tenant: Tenant) {
    // Check subscriber limit
    const count = await this.subscriberRepository.count({
      where: { tenantId: tenant.id },
    });
    if (count >= tenant.maxSubscribers) {
      throw new ForbiddenException(
        `Maksimum kullanıcı limitine ulaşıldı (${tenant.maxSubscribers})`,
      );
    }

    // Check username uniqueness within tenant
    const existing = await this.subscriberRepository.findOne({
      where: { username: dto.username, tenantId: tenant.id },
    });
    if (existing) {
      throw new ConflictException('Bu kullanıcı adı zaten kullanımda');
    }

    const subscriber = this.subscriberRepository.create({
      username: dto.username,
      passwordCleartext: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      packageId: dto.packageId,
      macAddress: dto.macAddress,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      tenantId: tenant.id,
      createdBy: SubscriberCreatedBy.ADMIN,
    });

    const saved = await this.subscriberRepository.save(subscriber);
    await this.radiusSyncService.syncSubscriber(saved, tenant);
    return saved;
  }

  async update(id: string, dto: UpdateSubscriberDto, tenant: Tenant) {
    const subscriber = await this.findOne(id, tenant);
    Object.assign(subscriber, {
      ...dto,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : subscriber.expiresAt,
    });
    const updated = await this.subscriberRepository.save(subscriber);
    await this.radiusSyncService.syncSubscriber(updated, tenant);
    return updated;
  }

  async toggleStatus(id: string, tenant: Tenant) {
    const subscriber = await this.findOne(id, tenant);
    subscriber.isActive = !subscriber.isActive;
    const toggled = await this.subscriberRepository.save(subscriber);
    await this.radiusSyncService.syncSubscriber(toggled, tenant);
    return toggled;
  }

  async resetPassword(id: string, password: string, tenant: Tenant) {
    const subscriber = await this.findOne(id, tenant);
    subscriber.passwordCleartext = password;
    await this.subscriberRepository.save(subscriber);
    await this.radiusSyncService.syncSubscriber(subscriber, tenant);
    return { success: true };
  }

  async remove(id: string, tenant: Tenant) {
    const subscriber = await this.findOne(id, tenant);
    const username = subscriber.username;
    await this.subscriberRepository.remove(subscriber);
    await this.radiusSyncService.removeSubscriber(username, tenant.id);
    return { deleted: true };
  }
}
