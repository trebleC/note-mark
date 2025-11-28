import { Controller, Post, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MinioService } from './minio.service';
import { DefaultErrorFilter } from 'src/filters/default.filter';

@Controller('files')
export class MinioController {
  constructor(private readonly minioService: MinioService) { }


  @Post('uploadByUrl')
  async uploadByUrl(@Body() body: { url: string; filename?: string }) {
    try {
      const fileUrl = await this.minioService.uploadByUrl(body.url);
      return {
        success: true,
        message: '文件上传成功',
        data: fileUrl
      };
    } catch (error) {
      console.error('获取最新内容失败:', error);
      throw new DefaultErrorFilter('上传封面图片失败', 500); 
    }
  }



  @Post('upload')
  // 使用 FileInterceptor 拦截名为 "file" 的表单字段
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    // 获取上传的文件
    @UploadedFile() file: Express.Multer.File,
    // 可选：获取其他表单数据
    @Body() body: { filename?: string }
  ) {
    try {
      // 生成唯一文件名（避免重复）
      const fileName = body.filename || `${Date.now()}-${file.originalname}`;

      // 调用 MinIO 服务上传文件（注意使用 await 处理异步操作）
      const fileUrl = await this.minioService.uploadFile(file, fileName);

      return {
        success: true,
        message: '文件上传成功',
        data: {
          fileUrl,
          fileName,
          fileSize: file.size,
          mimetype: file.mimetype
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '文件上传失败',
        error: error.message
      };
    }
  }


  // @Post('uploadMultiple')
  // @UseInterceptors(FileInterceptor('files'))
  // async uploadMultipleFiles(
  //   @UploadedFile() files: Express.Multer.File[],
  //   @Body() body: { filenames?: string[] }
  // ) {
  //   try {
  //     const fileNames = body.filenames || files.map((file, index) => `${Date.now()}-${index}-${file.originalname}`);

  //     const fileUrls = await Promise.all(files.map((file, index) =>))
  //   }
  // }
}
