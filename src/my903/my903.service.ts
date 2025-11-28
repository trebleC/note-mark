import { ConfigService } from '@nestjs/config';
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo } from 'mongoose';
import { My903, My903Document } from './entities/my903.entity';
import { My903SyncInfo, My903SyncInfoDocument } from './entities/my903-sync-info.entity';
import { CreateMy903DTO } from './dto/create-my903.dto';
import { DefaultErrorFilter } from 'src/filters/default.filter';
import axios from 'axios';
import { batchHandler } from '../utils/batch.util';
import { MinioService } from 'src/minio/minio.service';
import dayjs from 'dayjs';
import { getTimeDiffWithToday } from 'src/utils/date.util';

@Injectable()
export class My903Service {
  constructor(
    @InjectModel(My903.name) private my903Model: Model<My903Document>,
    @InjectModel(My903SyncInfo.name) private syncInfoModel: Model<My903SyncInfoDocument>,
  ) { }

  @Inject(MinioService)
  private readonly minioService: MinioService;

  @Inject(ConfigService)
  private readonly ConfigService: ConfigService;

  /**
   * 创建新的My903内容
   * @param createMy903DTO 创建数据
   */
  async createOrUpdate(createMy903DTO: CreateMy903DTO): Promise<My903> {
    // 使用findOneAndUpdate实现原子操作（避免先查询后更新的竞态问题）
    const result = await this.my903Model.findOneAndUpdate(
      // 查询条件：根据article_id匹配
      { article_id: createMy903DTO.article_id },
      // 更新内容：使用$set只更新提供的字段，或直接传入DTO覆盖（根据需求选择）
      { $set: createMy903DTO },
      {
        // 选项：
        new: true, // 返回更新后的文档（默认返回更新前的）
        upsert: true, // 若不存在则创建新文档
        // runValidators: true, // 执行Schema验证（确保更新符合数据约束）
      },
    ).exec();

    if (!result) {
      throw new DefaultErrorFilter('数据创建/更新失败', 500);
    }

    return result;
  }

  /**
 * 批量创建或更新My903数据
 * @param items 要处理的数据列表
 * @returns 处理后的完整数据列表
 */
  async batchCreateOrUpdate(items: CreateMy903DTO[]): Promise<My903[]> {
    if (!items || items.length === 0) {
      return [];
    }

    // 构建批量操作数组
    const bulkOperations = items.map(item => ({
      // 对每个item执行"更新或插入"操作
      updateOne: {
        filter: { article_id: item.article_id }, // 匹配条件：根据article_id
        update: { $set: item }, // 更新内容：只更新提供的字段
        upsert: true, // 不存在则自动创建
      },
    }));

    try {
      // 执行批量操作
      const bulkResult: mongo.BulkWriteResult = await this.my903Model.bulkWrite(
        bulkOperations,
        {
          // runValidators: true, // 启用Schema验证
          ordered: false, // 非有序执行（提高性能，允许并行处理）
        },
      );

      // 检查操作结果
      if (bulkResult.modifiedCount + bulkResult.upsertedCount === 0) {
        throw new InternalServerErrorException('批量操作未影响任何数据');
      }

      // 提取所有article_id用于查询结果
      const articleIds = items.map(item => item.article_id);

      // 查询并返回所有处理后的完整数据（保持与输入相同的顺序）
      const results = await this.my903Model
        .find({ article_id: { $in: articleIds } })
        .exec();

      // 确保返回结果与输入顺序一致
      return items.map(item =>
        results.find(result => result.article_id === item.article_id)
      );

    } catch (error) {
      throw new InternalServerErrorException(`批量创建/更新失败: ${error.message}`);
    }
  }


  //查询稿件详情
  async findDetail(articleId: number): Promise<any> {
    try {
      // console.log('>>>>>>',`https://www.my903.com/api/article/${articleId}`);
      const { data } = await axios.get(`https://www.my903.com/api/article/${articleId}`);
      return data.response
    } catch (error) {
      throw new InternalServerErrorException(`查询稿件详情失败: ${error.message}`);
    }
  }



  //抓去最新的My903内容
  async fetchNew(id: string, limit?: number): Promise<any[]> {
    try {
      //7-专业推介 8-豁达推介 9-派台歌
      const { data } = await axios.get(`https://www.my903.com/api/article/list?article_column_id=${id}&limit=${limit || 10}`);
      const res = data?.response?.content;

      if (res && res.length > 0) {
        // 获取最新一条数据的信息
        const latestItem = res[0];
        const columnNameMap = {
          '7': '专业推介',
          '8': '豁达推介',
          '9': '派台歌',
        };

        // 更新或创建同步信息记录
        await this.syncInfoModel.findOneAndUpdate(
          { column_id: id },
          {
            column_id: id,
            column_name: columnNameMap[id] || `栏目${id}`,
            last_fetch_time: new Date(),
            latest_create_date: latestItem.create_date,
            latest_article_id: latestItem.article_id,
            fetch_count: res.length,
          },
          { upsert: true, new: true }
        );
      }

      await this.batchCreate(res)
      return res || [];

    } catch (error) {
      console.error('[My903Service] fetchNew 错误:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      throw new Error(`获取最新内容失败: ${error.message || '未知错误'}`);
    }
  }


  async batchCreate(items: CreateMy903DTO[]) {
    try {
      //请求获取稿件的详情
      const urlResult = await batchHandler(items, async (obj) => {
        return await this.findDetail(obj.item_id)
      })


      // 遍历列表，处理每个元素的封面上传
      const processedItems = await Promise.all(
        urlResult.map(async (item) => {
          // 1. 上传封面到MinIO
          const coverUrl = await this.minioService.uploadByUrl(item.thumbnail.src);

          // 2. 提取【歌曲簡介】到【歌詞】之间的内容
          let extractedContent = item.content;
          if (item.content) {
            const startMarker = '【歌曲簡介】';
            const endMarker = '【歌詞】';
            const startIndex = item.content.indexOf(startMarker);
            const endIndex = item.content.indexOf(endMarker);

            if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
              // 提取两个标记之间的内容（包含起始标记，不包含结束标记）
              extractedContent = item.content.substring(startIndex + startMarker.length, endIndex);
            }
          }

          // 3. 更新DTO中的字段
          return {
            ...item,
            cover: coverUrl, // 覆盖原封面地址为MinIO地址
            content: extractedContent, // 使用提取后的内容
          };
        }),
      );

      // 3. 批量创建/更新（如果服务端支持批量操作）
      return this.batchCreateOrUpdate(processedItems);
    } catch (error) {
      console.error('[My903Service] batchCreate 错误:', {
        message: error.message,
        itemCount: items?.length,
        stack: error.stack
      });
      throw new Error(`批量创建失败: ${error.message}`);
    }
  }

  /**
   * 分页查询My903内容列表
   * @param options 分页和筛选参数
   * @returns 分页数据和统计信息
   */
  async findAll(options: {
    page: number;
    limit: number;
    tag?: string;
  }): Promise<{
    data: {
      desc: string;
      title: string;
      cover: string;
      article_id: number;
      create_date: string;
    }[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const { page, limit, tag } = options;
    const skip = (page - 1) * limit;

    // 构建查询条件（支持按标签筛选）
    const query = tag ? { tags: tag } : {};

    // 执行分页查询
    const [data, total] = await Promise.all([
      this.my903Model
        .find(query)
        .select('article_id title content cover create_date') // 只查询需要的字段
        .skip(skip)
        .limit(limit)
        .sort({ last_update_datetime: -1 }) // 按展示时间倒序（最新的在前）
        .exec(),
      this.my903Model.countDocuments(query).exec(), // 总条数
    ]);

    return {
      data: data.map(item => {
        const coverUrl = this.ConfigService.get('MINIO_URL') + item.cover;

        // 提取【歌曲簡介】到【歌詞】之间的内容
        let extractedContent = item.content;
        if (item.content) {
          const startMarker = '【歌曲簡介】';
          const endMarker = '【歌詞】';
          const startIndex = item.content.indexOf(startMarker);
          const endIndex = item.content.indexOf(endMarker);
          if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            // 提取两个标记之间的内容（不包含【歌曲簡介】和【歌詞】标记）
            extractedContent = item.content.substring(startIndex + startMarker.length, endIndex);
          }
        }

        const desc = extractedContent.replace('【歌曲簡介】', '');

        // 只返回指定的字段
        return {
          desc,
          title: item.title,
          cover: coverUrl,
          article_id: item.article_id,
          create_date: item.create_date,
        };
      }),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit), // 总页数
    };
  }

  async findAllSinger() {

  }

  /**
   * 获取所有栏目的同步信息
   * @returns 同步信息列表
   */
  async getSyncInfo(): Promise<any> {
    const data = await this.syncInfoModel
      .findOne()
      .select('-_id -__v -createdAt -updatedAt')
      .sort({ last_fetch_time: -1 })
      .lean()
      .exec();

    if (!data) {
      return null;
    }
    let last_fetch_time: string = ''
    if (data.last_fetch_time) {
      //如果当天
      if (dayjs(data.last_fetch_time).isSame(dayjs(), 'day')) {
        last_fetch_time = dayjs(data.last_fetch_time).format('HH:mm');
      }
      //如果超过一天少于两天
      else if (dayjs(data.last_fetch_time).isSame(dayjs().subtract(1, 'day'), 'day')) {
        last_fetch_time = dayjs(data.last_fetch_time).format('MM-DD HH:mm');
      }
      //如果超过两天则显示与今天的天数差
      else {
        last_fetch_time = getTimeDiffWithToday(data.last_fetch_time);
      }
    }

    // 使用 dayjs 格式化时间
    return {
      ...data,
      last_fetch_time
    };
  }

  /**
   * 根据栏目 ID 获取同步信息
   * @param columnId 栏目 ID
   * @returns 同步信息
   */
  async getSyncInfoByColumn(columnId: string): Promise<any> {
    const data = await this.syncInfoModel
      .findOne({ column_id: columnId })
      .select('-_id -__v -createdAt -updatedAt')
      .lean()
      .exec();

    if (!data) {
      return null;
    }
    let last_fetch_time: string = ''
    if (data.last_fetch_time) {
      //如果当天
      if (dayjs(data.last_fetch_time).isSame(dayjs(), 'day')) {
        last_fetch_time = dayjs(data.last_fetch_time).format('HH:mm');
      }
      //如果超过一天少于两天
      else if (dayjs(data.last_fetch_time).isSame(dayjs().subtract(1, 'day'), 'day')) {
        last_fetch_time = dayjs(data.last_fetch_time).format('MM-DD HH:mm');
      }
      //如果超过两天则显示与今天的天数差
      else {
        last_fetch_time = getTimeDiffWithToday(data.last_fetch_time);
      }
    }

    return {
      ...data,
      last_fetch_time
    };
  }

  // /**
  //  * 通过MongoDB ID查询单条内容
  //  * @param id MongoDB的ObjectId
  //  * @throws NotFoundException 当内容不存在时
  //  */
  // async findOne(id: string): Promise<My903> {
  //   const content = await this.my903Model.findById(id).exec();

  //   if (!content) {
  //     throw new NotFoundException(`My903 content with id ${id} not found`);
  //   }

  //   return content;
  // }

  /**
   * 通过业务唯一标识article_id查询内容
   * @param article_id 内容唯一标识
   * @throws NotFoundException 当内容不存在时
   */
  async findByarticle_id(article_id: number): Promise<{
    cover: string;
    tags: string[];
    id: number;
    title: string;
    name: string;
    description: string;
    singer_list: string[];
    composer_list: string[];
    arranger_list: string[];
    lyricist_list: string[];
    producer_list: string[];
    create_date: string;
  }> {
    const content = await this.my903Model
      .findOne({ article_id })
      .select('cover tags song_item create_date title')
      .lean()
      .exec();

    if (!content) {
      throw new NotFoundException(`My903 content with article_id ${article_id} not found`);
    }

    // 拼接完整的 cover URL
    const coverUrl = this.ConfigService.get('MINIO_URL') + content.cover;

    return {
      title: content.title,
      ...content.song_item,
      cover: coverUrl,
      tags: content.tags,


      create_date: content.create_date,
    };
  }

  // /**
  //  * 更新My903内容
  //  * @param id MongoDB的ObjectId
  //  * @param CreateMy903DTO 更新数据
  //  * @throws NotFoundException 当内容不存在时
  //  */
  // async update(id: string, CreateMy903DTO: CreateMy903DTO): Promise<My903> {
  //   // 检查内容是否存在
  //   const existing = await this.my903Model.findById(id).exec();
  //   if (!existing) {
  //     throw new NotFoundException(`My903 content with id ${id} not found`);
  //   }

  //   // 特殊处理：如果更新article_id，需要检查唯一性
  //   if (CreateMy903DTO.article_id) {
  //     const conflict = await this.my903Model
  //       .findOne({
  //         article_id: CreateMy903DTO.article_id,
  //         _id: { $ne: id }, // 排除当前记录
  //       })
  //       .exec();

  //     if (conflict) {
  //       throw new ConflictException(`article_id ${CreateMy903DTO.article_id} 已被使用`);
  //     }
  //   }

  //   // 执行更新并返回更新后的文档
  //   return this.my903Model
  //     .findByIdAndUpdate(id, CreateMy903DTO, { new: true }) // new: true 表示返回更新后的数据
  //     .exec();
  // }

  // /**
  //  * 删除My903内容
  //  * @param id MongoDB的ObjectId
  //  * @throws NotFoundException 当内容不存在时
  //  */
  // async remove(id: string): Promise<{ success: boolean; message: string }> {
  //   const result = await this.my903Model.deleteOne({ _id: id }).exec();

  //   if (result.deletedCount === 0) {
  //     throw new NotFoundException(`My903 content with id ${id} not found`);
  //   }

  //   return {
  //     success: true,
  //     message: `My903 content with id ${id} has been deleted`,
  //   };
  // }
}
