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

// Load local .env
const localEnvPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(localEnvPath)) {
  const envConfig = fs.readFileSync(localEnvPath, 'utf-8')
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

  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  app.enableCors({
    origin: [
      'http://localhost:5173', 'http://localhost:5175', 'http://localhost:3000',
      'http://127.0.0.1:5173', 'http://127.0.0.1:5175', 'http://127.0.0.1:3000'
    ],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })

  const port = process.env.PORT ?? 3001
  await app.listen(port)
  console.log(`[API Gateway] running on http://localhost:${port}/api`)
}
bootstrap()
// Trigger restart

