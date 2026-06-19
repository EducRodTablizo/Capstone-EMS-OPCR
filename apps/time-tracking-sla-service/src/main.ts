import * as fs from 'fs'
import * as path from 'path'

// Load root .env
const rootEnvPath = path.resolve(__dirname, '../../../.env')
if (fs.existsSync(rootEnvPath)) {
  const envConfig = fs.readFileSync(rootEnvPath, 'utf-8')
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const indexOfEqual = trimmed.indexOf('=')
      if (indexOfEqual !== -1) {
        const key = trimmed.slice(0, indexOfEqual).trim()
        let val = trimmed.slice(indexOfEqual + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (process.env[key] === undefined) {
          process.env[key] = val
        }
      }
    }
  }
}

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
// Trigger restart

