import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { My903Service } from './my903.service';
import { CreateMy903DTO } from './dto/create-my903.dto';
import { My903 } from './entities/my903.entity';
import { MinioService } from 'src/minio/minio.service';
import { DefaultErrorFilter } from 'src/filters/default.filter';
import { MiddlewareBuilder } from '@nestjs/core';
import { ResponseDto } from 'src/common/dto/response.dto';


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
  async create(@Body() createMy903Dto: CreateMy903DTO): Promise<My903> {
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
    @Body() items: CreateMy903DTO[], // 接收列表类型
  ): Promise<any[]> {

    return await this.my903Service.batchCreate(items)

  }


  /**
   * 获取最新的My903内容
   * @param id 起始ID（分页用）
   * @param limit 返回数量，默认10
   * @returns 最新内容列表
   */
  @Get('fetchNew')
  @ApiOperation({ summary: '获取最新的My903内容' }) @ApiQuery({ name: 'id', required: false, description: '起始ID（分页用）' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量，默认10' })
  async fetchNew(
    @Query('id', { transform: (value) => value || '9' }) id?: string,
    @Query('limit', { transform: (value) => parseInt(value, 10) || 10 }) limit?: number
  ): Promise<ResponseDto> {
    try {
      const data = await this.my903Service.fetchNew(id, limit);
      return ResponseDto.success(data, '最新内容已成功抓取并保存');
    } catch (error) {
      throw new DefaultErrorFilter('获取最新内容失败', 500);
    }
  }

  /**
   * 获取所有My903内容（支持分页和标签筛选）
   * @param page 页码（默认1）
   * @param limit 每页条数（默认10）
   * @param tag 按标签筛选（可选）
   * @returns 内容列表和分页信息
   */
  @Get('list')
  @ApiOperation({ summary: '查询所有My903内容' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: '每页条数' })
  @ApiQuery({ name: 'tag', required: false, example: '派台歌', description: '按标签筛选' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('tag') tag?: string,
  ) {
    return await this.my903Service.findAll({
      page: Number(page),
      limit: Number(limit),
      tag,
    });
  }
  /**
   * 查找所有singer_list里面的singer并返回列表
   * @returns singer列表
   */
  @Get('singer_list')
  async findAllSinger() {
    return this.my903Service.findAllSinger();
  }

  /**
   * 获取所有栏目的同步信息
   * @returns 同步信息列表
   */
  @Get('sync-info')
  @ApiOperation({ summary: '获取所有栏目的同步信息' })
  async getSyncInfo() {
    return this.my903Service.getSyncInfo();
  }

  /**
   * 根据栏目 ID 获取同步信息
   * @param columnId 栏目 ID（如7, 8, 9）
   * @returns 同步信息
   */
  @Get('sync-info/:columnId')
  @ApiOperation({ summary: '根据栏目 ID 获取同步信息' })
  @ApiParam({ name: 'columnId', description: '栏目 ID（如7, 8, 9）', example: '9' })
  async getSyncInfoByColumn(@Param('columnId') columnId: string) {
    return this.my903Service.getSyncInfoByColumn(columnId);
  }

  /**
   * 根据内容唯一标识（article_id）查询内容详情
   * @param article_id 内容唯一标识（如5382）
   * @returns 单个内容详情
   */
  @Get('detail/:article_id')
  @ApiOperation({ summary: '根据article_id查询My903内容详情' })
  @ApiParam({ name: 'article_id', description: '内容唯一标识', example: 5382 })
  async findByarticle_id(@Param('article_id') article_id: string) {
    return this.my903Service.findByarticle_id(Number(article_id));
  }

}
