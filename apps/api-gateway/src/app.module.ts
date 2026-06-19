import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import { HttpModule } from '@nestjs/axios'
import { APP_FILTER } from '@nestjs/core'
import { AuthModule } from './auth/auth.module'
import { ProxyModule } from './proxy/proxy.module'
import { HttpExceptionFilter } from './common/http-exception.filter'

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),
    HttpModule.register({ timeout: 10_000 }),
    AuthModule,
    ProxyModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
