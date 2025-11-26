import { ApiProperty } from '@nestjs/swagger';

/**
 * 标准响应体封装
 */
export class ResponseDto<T = any> {
  @ApiProperty({ description: '状态码', example: 200 })
  code: number;

  @ApiProperty({ description: '响应消息', example: '操作成功' })
  message: string;

  @ApiProperty({ description: '响应数据' })
  data?: T;

  @ApiProperty({ description: '时间戳', example: 1700000000000 })
  timestamp: number;

  constructor(code: number, message: string, data?: T) {
    this.code = code;
    this.message = message;
    this.data = data;
    // this.timestamp = Date.now();
  }

  /**
   * 成功响应
   */
  static success<T>(data?: T, message: string = '操作成功'): ResponseDto<T> {
    return new ResponseDto(200, message, data);
  }

  /**
   * 失败响应
   */
  static error(message: string = '操作失败', code: number = 500): ResponseDto {
    return new ResponseDto(code, message);
  }
}
