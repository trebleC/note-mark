import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MinioModule } from './minio/minio.module';
import { My903Module } from './my903/my903.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://admin:buwanla@localhost:27091/notemark?authSource=admin'),
    MinioModule,
    My903Module,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
