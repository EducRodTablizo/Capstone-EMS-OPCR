import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  const port = process.env.PORT ?? 3007
  await app.listen(port)
  console.log(`[Dashboard & Reporting Service] running on http://localhost:${port}`)
}
bootstrap()
