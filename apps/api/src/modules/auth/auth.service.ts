import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AdminUser, AdminRole } from '../../database/entities';

interface JwtPayload {
  sub: string;
  email: string;
  role: AdminRole;
  tenantId: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.adminUserRepository.findOne({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Geçersiz e-posta veya şifre');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Geçersiz e-posta veya şifre');
    }

    // Update last login
    await this.adminUserRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.adminUserRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Geçersiz token');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş token');
    }
  }

  async createAdminUser(
    email: string,
    password: string,
    name: string,
    role: AdminRole,
    tenantId: string | null,
  ): Promise<AdminUser> {
    const existing = await this.adminUserRepository.findOne({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('Bu e-posta adresi zaten kullanımda');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = this.adminUserRepository.create({
      email,
      passwordHash,
      name,
      role,
      tenantId,
    });

    return this.adminUserRepository.save(user);
  }

  async getProfile(userId: string) {
    const user = await this.adminUserRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    const { passwordHash: _, ...profile } = user;
    return profile;
  }

  private generateTokens(user: AdminUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    };
  }
}
