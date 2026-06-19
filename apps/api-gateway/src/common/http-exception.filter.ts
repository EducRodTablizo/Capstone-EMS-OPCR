import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message: unknown = 'Internal server error'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      message = exception.getResponse()
    } else if (
      exception &&
      typeof exception === 'object' &&
      'isAxiosError' in exception &&
      (exception as { isAxiosError?: boolean }).isAxiosError &&
      'response' in exception &&
      (exception as { response?: unknown }).response &&
      typeof (exception as { response?: unknown }).response === 'object'
    ) {
      const axiosResponse = (exception as { response?: { status?: number; data?: unknown } }).response
      status = axiosResponse?.status ?? HttpStatus.INTERNAL_SERVER_ERROR
      message = axiosResponse?.data ?? 'Downstream service error'
    } else if (exception instanceof Error) {
      message = exception.message
    }

    // Keep response format clean and direct
    if (typeof message === 'object' && message !== null) {
      response.status(status).json(message)
    } else {
      response.status(status).json({
        statusCode: status,
        message,
      })
    }
  }
}
