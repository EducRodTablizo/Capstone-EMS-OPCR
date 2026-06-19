import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ScheduleModule } from '@nestjs/schedule'
import { DatabaseModule } from './database/database.module'
import { DashboardModule } from './dashboard/dashboard.module'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
 
import { User } from './api-gateway/src/entities/user.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule,
    DatabaseModule,
    DashboardModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DB_HOST'),
        port: cfg.get<number>('DB_PORT', 5432),
        username: cfg.get('DB_USER'),
        password: cfg.get('DB_PASS'),
        database: cfg.get('DB_NAME', 'ems'),
        entities: [User],
        synchronize: false,
        migrationsRun: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      useFactory: (cfg: ConfigService) => ({
        // Public key from Central Auth Service; used for verify-only (no local signing)
        publicKey: cfg.getOrThrow('AUTH_JWT_PUBLIC_KEY'),
        signOptions: { algorithm: 'RS256' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtAuthGuard, OfficeScopeGuard, AuthAndScopeGuard],
  exports: [JwtAuthGuard, OfficeScopeGuard, AuthAndScopeGuard, JwtModule],
})
export class ApiGatewayAppModule {}
