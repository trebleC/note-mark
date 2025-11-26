import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DefaultErrorFilter } from './filters/default.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    logger: ['error', 'warn', 'log', 'debug'], // 设置日志级别
  });
  
  // 应用全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor());
  
  // 应用全局异常过滤器
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
  
  // 从环境变量读取端口，默认 6090
  const port = process.env.PORT || 6090;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api-docs`);
}
bootstrap();
