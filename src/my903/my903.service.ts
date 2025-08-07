import { Injectable, NotFoundException, ConflictException,InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, mongo } from 'mongoose';
import { My903, My903Document } from './entities/my903.entity';
import { CreateMy903Dto } from './dto/create-my903.dto';
import { DefaultErrorFilter } from 'src/filter/default.filter';

@Injectable()
export class My903Service {
  constructor(
    @InjectModel(My903.name) private my903Model: Model<My903Document>,
  ) { }

  /**
   * 创建新的My903内容
   * @param createMy903Dto 创建数据
   */
  async createOrUpdate(createMy903Dto: CreateMy903Dto): Promise<My903> {
    // 使用findOneAndUpdate实现原子操作（避免先查询后更新的竞态问题）
    const result = await this.my903Model.findOneAndUpdate(
      // 查询条件：根据article_id匹配
      { article_id: createMy903Dto.article_id },
      // 更新内容：使用$set只更新提供的字段，或直接传入DTO覆盖（根据需求选择）
      { $set: createMy903Dto },
      {
        // 选项：
        new: true, // 返回更新后的文档（默认返回更新前的）
        upsert: true, // 若不存在则创建新文档
        // runValidators: true, // 执行Schema验证（确保更新符合数据约束）
      },
    ).exec();

    if (!result) {
      throw new DefaultErrorFilter('数据创建/更新失败',500);
    }

    return result;
  }

    /**
   * 批量创建或更新My903数据
   * @param items 要处理的数据列表
   * @returns 处理后的完整数据列表
   */
  async batchCreateOrUpdate(items: CreateMy903Dto[]): Promise<My903[]> {
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

  // /**
  //  * 分页查询My903内容列表
  //  * @param options 分页和筛选参数
  //  * @returns 分页数据和统计信息
  //  */
  // async findAll(options: {
  //   page: number;
  //   limit: number;
  //   tag?: string;
  // }): Promise<{
  //   data: My903[];
  //   total: number;
  //   page: number;
  //   limit: number;
  //   pages: number;
  // }> {
  //   const { page, limit, tag } = options;
  //   const skip = (page - 1) * limit;

  //   // 构建查询条件（支持按标签筛选）
  //   const query = tag ? { tags: tag } : {};

  //   // 执行分页查询
  //   const [data, total] = await Promise.all([
  //     this.my903Model
  //       .find(query)
  //       .skip(skip)
  //       .limit(limit)
  //       .sort({ displayTs: -1 }) // 按展示时间倒序（最新的在前）
  //       .exec(),
  //     this.my903Model.countDocuments(query).exec(), // 总条数
  //   ]);

  //   return {
  //     data,
  //     total,
  //     page,
  //     limit,
  //     pages: Math.ceil(total / limit), // 总页数
  //   };
  // }

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

  // /**
  //  * 通过业务唯一标识article_id查询内容
  //  * @param article_id 内容唯一标识
  //  * @throws NotFoundException 当内容不存在时
  //  */
  // async findByarticle_id(article_id: number): Promise<My903> {
  //   const content = await this.my903Model
  //     .findOne({ article_id })
  //     .exec();

  //   if (!content) {
  //     throw new NotFoundException(`My903 content with article_id ${article_id} not found`);
  //   }

  //   return content;
  // }

  // /**
  //  * 更新My903内容
  //  * @param id MongoDB的ObjectId
  //  * @param CreateMy903Dto 更新数据
  //  * @throws NotFoundException 当内容不存在时
  //  */
  // async update(id: string, CreateMy903Dto: CreateMy903Dto): Promise<My903> {
  //   // 检查内容是否存在
  //   const existing = await this.my903Model.findById(id).exec();
  //   if (!existing) {
  //     throw new NotFoundException(`My903 content with id ${id} not found`);
  //   }

  //   // 特殊处理：如果更新article_id，需要检查唯一性
  //   if (CreateMy903Dto.article_id) {
  //     const conflict = await this.my903Model
  //       .findOne({
  //         article_id: CreateMy903Dto.article_id,
  //         _id: { $ne: id }, // 排除当前记录
  //       })
  //       .exec();

  //     if (conflict) {
  //       throw new ConflictException(`article_id ${CreateMy903Dto.article_id} 已被使用`);
  //     }
  //   }

  //   // 执行更新并返回更新后的文档
  //   return this.my903Model
  //     .findByIdAndUpdate(id, CreateMy903Dto, { new: true }) // new: true 表示返回更新后的数据
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
