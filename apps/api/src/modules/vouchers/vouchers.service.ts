import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher, VoucherStatus, Tenant } from '../../database/entities';
import { GenerateVouchersDto } from './vouchers.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
  ) {}

  async findAll(
    tenant: Tenant,
    page = 1,
    limit = 20,
    status?: string,
    packageId?: string,
  ) {
    const qb = this.voucherRepository
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.package', 'p')
      .leftJoinAndSelect('v.subscriber', 's')
      .where('v.tenant_id = :tenantId', { tenantId: tenant.id });

    if (status) {
      qb.andWhere('v.status = :status', { status });
    }

    if (packageId) {
      qb.andWhere('v.package_id = :packageId', { packageId });
    }

    qb.orderBy('v.created_at', 'DESC');
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

  async generate(dto: GenerateVouchersDto, tenant: Tenant) {
    const batchId = uuidv4();
    const codeLength = dto.codeLength || 8;
    const prefix = dto.prefix || '';
    const vouchers: Voucher[] = [];

    const existingCodes = new Set(
      (await this.voucherRepository.find({
        where: { tenantId: tenant.id },
        select: ['code'],
      })).map(v => v.code),
    );

    for (let i = 0; i < dto.quantity; i++) {
      let code: string;
      do {
        code = prefix + this.generateCode(codeLength);
      } while (existingCodes.has(code));

      existingCodes.add(code);

      vouchers.push(
        this.voucherRepository.create({
          code,
          packageId: dto.packageId,
          tenantId: tenant.id,
          batchId,
          expiresAt: new Date(dto.expiresAt),
          status: VoucherStatus.UNUSED,
        }),
      );
    }

    await this.voucherRepository.save(vouchers);

    return {
      batchId,
      count: vouchers.length,
      codes: vouchers.map(v => v.code),
    };
  }

  async findOne(id: string, tenant: Tenant) {
    const voucher = await this.voucherRepository.findOne({
      where: { id, tenantId: tenant.id },
      relations: ['package', 'subscriber'],
    });
    if (!voucher) throw new NotFoundException('Kupon bulunamadı');
    return voucher;
  }

  async remove(id: string, tenant: Tenant) {
    const voucher = await this.findOne(id, tenant);
    if (voucher.status !== VoucherStatus.UNUSED) {
      throw new NotFoundException('Sadece kullanılmamış kuponlar silinebilir');
    }
    await this.voucherRepository.remove(voucher);
    return { deleted: true };
  }

  async exportCsv(tenant: Tenant, batchId?: string) {
    const qb = this.voucherRepository
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.package', 'p')
      .where('v.tenant_id = :tenantId', { tenantId: tenant.id });

    if (batchId) {
      qb.andWhere('v.batch_id = :batchId', { batchId });
    }

    qb.orderBy('v.created_at', 'DESC');

    const vouchers = await qb.getMany();

    const header = 'Kod,Paket,Durum,Son Kullanma,Kullanım Tarihi\n';
    const rows = vouchers.map(v =>
      `${v.code},${v.package?.name || ''},${v.status},${v.expiresAt.toISOString()},${v.usedAt?.toISOString() || ''}`
    ).join('\n');

    return header + rows;
  }

  private generateCode(length: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
