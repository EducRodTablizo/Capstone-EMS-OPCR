import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import { HttpModule } from '@nestjs/axios'
import { AuthModule } from './auth/auth.module'
import { ProxyModule } from './proxy/proxy.module'

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),
    HttpModule.register({ timeout: 10_000 }),
    AuthModule,
    ProxyModule,
  ],
})
export class AppModule {}
