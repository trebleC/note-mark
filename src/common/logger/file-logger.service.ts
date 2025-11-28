import { Injectable, LoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileLogger implements LoggerService {
  private logDir = path.join(process.cwd(), 'logs');
  private logFile = path.join(this.logDir, `app-${this.getDateString()}.log`);
  private errorFile = path.join(this.logDir, `error-${this.getDateString()}.log`);

  constructor() {
    // 确保日志目录存在
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private writeToFile(level: string, message: string, trace?: string) {
    const timestamp = this.getTimestamp();
    const logMessage = `[${timestamp}] [${level}] ${message}${trace ? '\n' + trace : ''}\n`;
    
    // 写入主日志文件
    fs.appendFileSync(this.logFile, logMessage);
    
    // 如果是错误，也写入错误日志文件
    if (level === 'ERROR') {
      fs.appendFileSync(this.errorFile, logMessage);
    }
    
    // 同时输出到控制台
    console.log(logMessage.trim());
  }

  log(message: any, context?: string) {
    const msg = context ? `[${context}] ${message}` : message;
    this.writeToFile('LOG', msg);
  }

  error(message: any, trace?: string, context?: string) {
    const msg = context ? `[${context}] ${message}` : message;
    this.writeToFile('ERROR', msg, trace);
  }

  warn(message: any, context?: string) {
    const msg = context ? `[${context}] ${message}` : message;
    this.writeToFile('WARN', msg);
  }

  debug(message: any, context?: string) {
    const msg = context ? `[${context}] ${message}` : message;
    this.writeToFile('DEBUG', msg);
  }

  verbose(message: any, context?: string) {
    const msg = context ? `[${context}] ${message}` : message;
    this.writeToFile('VERBOSE', msg);
  }
}
