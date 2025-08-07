import { Module } from '@nestjs/common';
import { MinioService } from './minio.service';
import { MinioController } from './minio.controller';

@Module({
  providers: [MinioService],
  controllers:[MinioController],
  exports: [MinioService], // 导出服务，供其他模块使用
})
export class MinioModule {}