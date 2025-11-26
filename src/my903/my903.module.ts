import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { My903Service } from './my903.service';
import { My903Controller } from './my903.controller';
import { My903, My903Schema } from './entities/my903.entity';
import { My903SyncInfo, My903SyncInfoSchema } from './entities/my903-sync-info.entity';
import { MinioModule } from '../minio/minio.module';

@Module({
  imports: [
    // 关键：注册My903模型到当前模块
    MongooseModule.forFeature([
      { name: My903.name, schema: My903Schema },
      { name: My903SyncInfo.name, schema: My903SyncInfoSchema }
    ]),
    MinioModule,
  ],
  controllers: [My903Controller],
  providers: [My903Service],
  // 若其他模块需要使用，可导出
  exports: [My903Service, MongooseModule]
})
export class My903Module {}
