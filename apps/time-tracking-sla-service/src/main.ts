import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  const port = process.env.PORT ?? 3004
  await app.listen(port)
  console.log(`[Time Tracking & SLA Service] running on http://localhost:${port}`)
}
bootstrap()
