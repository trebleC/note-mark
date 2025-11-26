import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
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

  // 错误码和消息的默认值
  private defaultCode: number;
  private defaultMessage: string;

  constructor(
    defaultMessage: string = MESSAGES.ERROR,
    defaultCode: number = CODES.ERROR,
  ) {
    this.defaultCode = defaultCode;
    this.defaultMessage = defaultMessage;
  }

  // 实现 ExceptionFilter 接口的 catch 方法
  catch(err: ErrorCode, host: ArgumentsHost) {
    // 获取请求上下文（以 Express 为例）
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 记录错误日志（包含请求信息和错误详情）
    this.logger.error(
      `[${request.method}] ${request.url} -> 错误: ${err.message || '未知错误'}`,
      err.stack || '无堆栈信息', // 打印错误堆栈，便于调试
    );

    // 提取错误码和消息（优先使用 err 自身的属性，否则用默认值）
    const code = err.code || this.defaultCode;
    const message = err.message || this.defaultMessage;

    // 统一返回格式
    response.status(code).json({
      code,
      message,
      // path: request.url, // 请求路径
      // timestamp: new Date().toISOString(), // 时间戳
    });
  }
}