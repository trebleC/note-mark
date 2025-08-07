import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { My903Service } from './my903.service';
import { CreateMy903Dto } from './dto/create-my903.dto';
import { My903 } from './entities/my903.entity';
import { MinioService } from 'src/minio/minio.service';
import { DefaultErrorFilter } from 'src/filter/default.filter';

@Controller('my903')
@ApiTags('my903') // Swagger文档分组
export class My903Controller {



  @Inject(My903Service)
  private readonly my903Service: My903Service;

  @Inject(MinioService)
  private readonly minioService: MinioService;

  /**
   * 创建新的My903内容（如歌曲、派台歌）
   * @param createMy903Dto 创建数据
   * @returns 新创建的内容
   */
  @Post('create')
  @ApiOperation({ summary: '创建My903内容' })
  async create(@Body() createMy903Dto: CreateMy903Dto): Promise<My903> {
    // 保存封面到minio服务
    createMy903Dto.cover = await this.minioService.uploadByUrl(createMy903Dto.thumbnail.src)
    return this.my903Service.createOrUpdate(createMy903Dto);
  }
  
    /**
   * 批量创建/更新My903内容
   * @param items 内容列表
   * @returns 处理后的内容列表
   */
  @Post('batchCreate')
  @ApiOperation({ summary: '批量创建/更新My903内容' })
  async batchCreate(
    @Body() items: CreateMy903Dto[], // 接收列表类型
  ): Promise<My903[]> {
    // 遍历列表，处理每个元素的封面上传
    const processedItems = await Promise.all(
      items.map(async (item) => {
        // 1. 上传封面到MinIO
        const coverUrl = await this.minioService.uploadByUrl(item.thumbnail.src);
        
        // 2. 更新DTO中的封面字段
        return {
          ...item,
          cover: coverUrl, // 覆盖原封面地址为MinIO地址
        };
      }),
    );

    // 3. 批量创建/更新（如果服务端支持批量操作）
    return this.my903Service.batchCreateOrUpdate(processedItems);

  }

  // /**
  //  * 获取所有My903内容（支持分页和标签筛选）
  //  * @param page 页码（默认1）
  //  * @param limit 每页条数（默认10）
  //  * @param tag 按标签筛选（可选）
  //  * @returns 内容列表和分页信息
  //  */
  // @Get()
  // @ApiOperation({ summary: '查询所有My903内容' })
  // @ApiQuery({ name: 'page', required: false, example: 1, description: '页码' })
  // @ApiQuery({ name: 'limit', required: false, example: 10, description: '每页条数' })
  // @ApiQuery({ name: 'tag', required: false, example: '派台歌', description: '按标签筛选' })
  // findAll(
  //   @Query('page') page = 1,
  //   @Query('limit') limit = 10,
  //   @Query('tag') tag?: string,
  // ) {
  //   return this.my903Service.findAll({
  //     page: Number(page),
  //     limit: Number(limit),
  //     tag,
  //   });
  // }

  // /**
  //  * 根据ID获取单个My903内容详情
  //  * @param id 内容ID（MongoDB的ObjectId）
  //  * @returns 单个内容详情
  //  */
  // @Get(':id')
  // @ApiOperation({ summary: '根据ID查询My903内容' })
  // @ApiParam({ name: 'id', description: '内容ID（MongoDB ObjectId）', example: '60d21b4667d0d8992e610c85' })
  // findOne(@Param('id') id: string): Promise<My903> {
  //   return this.my903Service.findOne(id);
  // }

  // /**
  //  * 根据内容唯一标识（article_id）查询内容
  //  * @param article_id 内容唯一标识（如5382）
  //  * @returns 单个内容详情
  //  */
  // @Get('content-id/:article_id')
  // @ApiOperation({ summary: '根据article_id查询My903内容' })
  // @ApiParam({ name: 'article_id', description: '内容唯一标识', example: 5382 })
  // findByarticle_id(@Param('article_id') article_id: string): Promise<My903> {
  //   return this.my903Service.findByarticle_id(Number(article_id));
  // }

  // /**
  //  * 更新My903内容
  //  * @param id 内容ID（MongoDB的ObjectId）
  //  * @param CreateMy903Dto 更新数据
  //  * @returns 更新后的内容
  //  */
  // @Patch(':id')
  // @ApiOperation({ summary: '更新My903内容' })
  // @ApiParam({ name: 'id', description: '内容ID（MongoDB ObjectId）', example: '60d21b4667d0d8992e610c85' })
  // update(
  //   @Param('id') id: string,
  //   @Body() CreateMy903Dto: CreateMy903Dto,
  // ): Promise<My903> {
  //   return this.my903Service.update(id, CreateMy903Dto);
  // }

  // /**
  //  * 删除My903内容
  //  * @param id 内容ID（MongoDB的ObjectId）
  //  * @returns 删除结果
  //  */
  // @Delete(':id')
  // @ApiOperation({ summary: '删除My903内容' })
  // @ApiParam({ name: 'id', description: '内容ID（MongoDB ObjectId）', example: '60d21b4667d0d8992e610c85' })
  // remove(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
  //   return this.my903Service.remove(id);
  // }
}
