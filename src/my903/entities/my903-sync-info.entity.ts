import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type My903SyncInfoDocument = My903SyncInfo & Document;

@Schema({
  timestamps: true, // 自动添加 createdAt 和 updatedAt
  collection: 'my903_sync_info',
})
export class My903SyncInfo {
  /** 栏目ID（如 7-专业推介, 8-豁达推介, 9-派台歌） */
  @Prop({ type: String, required: true, unique: true, index: true })
  column_id: string;

  /** 栏目名称 */
  @Prop({ type: String, required: true })
  column_name: string;

  /** 最后一次获取数据的时间 */
  @Prop({ type: Date, required: true })
  last_fetch_time: Date;

  /** 最新一条数据的 create_date */
  @Prop({ type: String, required: true })
  latest_create_date: string;

  /** 最新一条数据的 article_id */
  @Prop({ type: Number, required: true })
  latest_article_id: number;

  /** 本次获取的数据条数 */
  @Prop({ type: Number, default: 0 })
  fetch_count: number;
}

export const My903SyncInfoSchema = SchemaFactory.createForClass(My903SyncInfo);
