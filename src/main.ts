import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DefaultErrorFilter } from './filter/default.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new DefaultErrorFilter());
  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('API 文档')
    .setDescription('API 接口文档')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // 此处的 '/api-docs' 是 Swagger 文档的访问路径
  SwaggerModule.setup('api-docs', app, document);
  await app.listen(6090);
}
bootstrap();
