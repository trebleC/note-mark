import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from '../config/axios.config'; // 使用配置好的 axios
import * as Minio from 'minio';
import { createHash } from 'crypto';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises'; // 用于安全处理流管道
import {batchHandler} from '../utils/batch.util'
@Injectable()
export class MinioService {
  private minioClient: Minio.Client;
  private bucketName: string; // 存储桶名称（从环境变量读取）
  // 可选：限制并发数，避免过多同时请求导致的问题
   private readonly concurrencyLimit: number = 5

  constructor(private readonly configService: ConfigService) {
    // 初始化 MinIO 客户端（从环境变量读取配置）
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get<string>('MINIO_PORT', '9000'), 10),
      useSSL: this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'admin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', '12345678'),
    });

    // 从环境变量读取桶名称
    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME', 'my903');

    // 确保桶存在（不存在则创建）
    this.initBucket();
  }

  // 初始化桶
  private async initBucket() {
    const exists = await this.minioClient.bucketExists(this.bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
    }
  }

  // 上传文件到 MinIO
  async uploadFile(file: Express.Multer.File, objectName: string): Promise<string> {
    // objectName：MinIO 中存储的文件名（如 user-123-avatar.jpg）
    await this.minioClient.putObject(
      this.bucketName,
      objectName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );
    // 返回文件访问 URL（MinIO 支持预签名 URL 或直接访问）
    return this.getFileUrl(objectName);
  }

  // 获取文件访问 URL（预签名 URL，有效期 7 天）
  getFileUrl(objectName: string) {
    return this.minioClient.presignedUrl('GET', this.bucketName, objectName, 7 * 24 * 60 * 60);
  }

  // 删除文件
  async deleteFile(objectName: string) {
    await this.minioClient.removeObject(this.bucketName, objectName);
  }

  async uploadByUrl(url: string): Promise<string> {
    console.log(`[MinIO] 开始上传: ${url}`);
    
    // 1. 初始化MD5哈希（用于生成唯一文件名）
    const md5Hash = createHash('md5');
    let contentLength = 0; // 记录文件总大小

    try {
      // 测试 MinIO 连接
      try {
        const bucketExists = await this.minioClient.bucketExists(this.bucketName);
        console.log(`[MinIO] Bucket "${this.bucketName}" 存在: ${bucketExists}`);
        if (!bucketExists) {
          console.log(`[MinIO] 创建 Bucket: ${this.bucketName}`);
          await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        }
      } catch (minioError) {
        console.error('[MinIO] 连接错误:', {
          message: minioError.message,
          code: minioError.code,
          endpoint: this.configService.get('MINIO_ENDPOINT'),
          port: this.configService.get('MINIO_PORT')
        });
        throw new Error(`MinIO 连接失败: ${minioError.message}`);
      }

      // 2. 获取源文件流（responseType: 'stream' 确保返回可读流）
      console.log(`[MinIO] 下载源文件: ${url}`);
      const { data: sourceStream } = await axios.get(url, {
        responseType: 'stream',
        headers: { 'User-Agent': 'MinIO Uploader' },
        timeout: 30000 // 30秒超时
      });

      // 3. 创建中转流（用于同时处理MD5计算和上传）
      const transformStream = new Readable({
        read() { }
      });

      // 4. 处理源数据流：分块计算MD5和文件大小
      sourceStream
        .on('data', (chunk: Buffer) => {
          md5Hash.update(chunk);
          contentLength += chunk.length;
          transformStream.push(chunk);
        })
        .on('end', () => {
          transformStream.push(null);
          console.log(`[MinIO] 文件下载完成, 大小: ${contentLength} bytes`);
        })
        .on('error', (error) => {
          console.error('[MinIO] 源流错误:', error);
          transformStream.destroy(error);
        });

      // 5. 等待流处理完成（确保MD5计算完整）
      await new Promise((resolve, reject) => {
        sourceStream.on('end', resolve);
        sourceStream.on('error', reject);
      });

      // 6. 生成唯一文件名（MD5+扩展名，避免重复）
      const fileExt = this.getFileExtension(url);
      const md5Hex = md5Hash.digest('hex');
      const objectName = fileExt ? `${md5Hex}.${fileExt}` : md5Hex;
      console.log(`[MinIO] 生成文件名: ${objectName}`);

      // 7. 上传到MinIO（使用流管道，内存友好）
      console.log(`[MinIO] 开始上传到 MinIO...`);
      await pipeline(
        transformStream, // 从中转流读取数据
        async (source: Readable) => {
          // 调用MinIO客户端上传（不同SDK可能有差异，这里以putObject为例）
          await this.minioClient.putObject(
            this.bucketName,
            objectName,
            source,
            contentLength // 传递文件大小，便于MinIO处理
          );
        }
      );

      console.log(`[MinIO] 上传成功: /${this.bucketName}/${objectName}`);
      
      // 8. 返回MinIO中的文件路径
      return `/${this.bucketName}/${objectName}`;

    } catch (error) {
      // 9. 规范错误处理（区分错误类型）
      console.error('[MinIO] uploadByUrl 错误:', {
        url,
        message: error.message,
        code: error.code,
        response: error.response?.data,
        stack: error.stack
      });
      
      if (error.response?.status === 404) {
        throw new NotFoundException(`源文件不存在: ${url}`);
      } else if (error.code === 'ENOTFOUND') {
        throw new NotFoundException(`无法连接到源服务器: ${url}`);
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        throw new Error(`请求超时: ${url}`);
      } else {
        throw new Error(`上传失败: ${error.message || '未知错误'}`);
      }
    }
  }
    /**
   * 批量上传文件到MinIO
   * @param urls 文件URL列表
   * @returns 每个URL对应的MinIO存储路径列表（与输入顺序一致）
   */
  async batchUploadByUrls(urls: string[]): Promise<string[]> {

    return await batchHandler(urls,this.uploadByUrl)
    // if (!urls || urls.length === 0) {
    //   return [];
    // }

    // // 使用并发控制处理批量上传，避免同时发起过多请求
    // const results: string[] = new Array(urls.length);
    // const chunks: string[][] = [];

    // // 将URL列表分块，每块大小为concurrencyLimit
    // for (let i = 0; i < urls.length; i += this.concurrencyLimit) {
    //   chunks.push(urls.slice(i, i + this.concurrencyLimit));
    // }

    // // 按块处理，每块内部并发执行
    // for (const [chunkIndex, chunk] of chunks.entries()) {
    //   const chunkResults = await Promise.all(
    //     chunk.map(async (url, index) => {
    //       const result = await this.uploadByUrl(url);
    //       // 计算原始索引位置，确保结果顺序与输入一致
    //       const originalIndex = chunkIndex * this.concurrencyLimit + index;
    //       return { originalIndex, result };
    //     })
    //   );

    //   // 将结果按原始顺序存入数组
    //   chunkResults.forEach(({ originalIndex, result }) => {
    //     results[originalIndex] = result;
    //   });
    // }

    // return results;
  }


  /**
   * 从URL提取文件扩展名（处理查询参数等边缘情况）
   */
  private getFileExtension(url: string): string {
    try {
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname;
      const lastDotIndex = path.lastIndexOf('.');
      if (lastDotIndex > -1 && lastDotIndex < path.length - 1) {
        // 提取扩展名并排除可能的查询参数（如 ?v=123）
        return path.slice(lastDotIndex + 1).split('?')[0];
      }
      return '';
    } catch {
      return ''; // URL解析失败时返回空
    }
  }
}
