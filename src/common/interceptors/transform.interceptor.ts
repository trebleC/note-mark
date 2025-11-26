import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../dto/response.dto';

/**
 * 全局响应转换拦截器
 * 自动将所有响应包装成标准格式
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T>> {
    return next.handle().pipe(
      map(data => {
        // 如果已经是 ResponseDto 格式，直接返回
        if (data instanceof ResponseDto) {
          return data;
        }
        
        // 否则包装成标准格式
        return ResponseDto.success(data);
      }),
    );
  }
}
