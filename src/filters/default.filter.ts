import { ExceptionFilter, Catch, ArgumentsHost, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

// 假设的错误码和消息常量（可根据实际项目定义）
export const CODES = {
  ERROR: 500, // 默认错误码
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
};

export const MESSAGES = {
  ERROR: '服务器内部错误',
  BAD_REQUEST: '请求参数错误',
  NOT_FOUND: '资源不存在',
};

// 定义错误接口（统一错误格式）
interface ErrorCode {
  code?: number;
  message?: string;
  stack?: string; // 错误堆栈（可选）
}

@Catch() // @Catch() 不指定参数，表示捕获所有异常
export class DefaultErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DefaultErrorFilter.name); // 日志实例

  // 实现 ExceptionFilter 接口的 catch 方法
  catch(exception: any, host: ArgumentsHost) {
    // 获取请求上下文（以 Express 为例）
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 判断异常类型并提取信息
    let status: number;
    let message: string;
    let error: string;
    let details: any;

    if (exception instanceof HttpException) {
      // NestJS 标准异常
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.name;
        details = responseObj.details;
      }
    } else if (exception instanceof Error) {
      // 普通 Error 对象
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || '服务器内部错误';
      error = exception.name || 'Error';
    } else {
      // 其他类型异常
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = String(exception) || '未知错误';
      error = 'UnknownError';
    }

    // 记录详细错误日志
    this.logger.error(
      `[${request.method}] ${request.url} -> ${error}: ${message}`,
      exception?.stack || '无堆栈信息',
    );

    // 构建响应体
    const errorResponse: any = {
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // 如果有额外详情，添加到响应中
    if (details) {
      errorResponse.details = details;
    }

    // 开发环境下返回完整堆栈信息
    if (process.env.NODE_ENV !== 'production' && exception?.stack) {
      errorResponse.stack = exception.stack;
    }

    // 统一返回格式
    response.status(status).json(errorResponse);
  }
}