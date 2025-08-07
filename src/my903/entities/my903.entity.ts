import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// 扩展 Document 类型，显式声明 id 字段
export type My903Document = My903 & Document & { id: string };

// 嵌套类：媒体资源（高亮图、缩略图等）
class HighlightMedia {
  @Prop({ type: Number, required: true })
  media_id: number;

  @Prop({ type: Number, required: true })
  media_type: number;

  @Prop({ type: String, required: true })
  src: string;

  @Prop({ type: String })
  srcset?: string;
}

// 嵌套类：歌曲详情
class SongItem {
  @Prop({ type: Number, required: true })
  id: number;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: [String], required: true })
  singer_list: string[];

  @Prop({ type: [String], required: true })
  composer_list: string[];

  @Prop({ type: [String], required: true })
  arranger_list: string[];

  @Prop({ type: [String], required: true })
  lyricist_list: string[];

  @Prop({ type: [String], required: true })
  producer_list: string[];
}

// 嵌套类：栏目信息
class ArticleColumn {
  @Prop({ type: Number, required: true })
  article_column_id: number;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Number, required: true })
  article_column_status: number;

  @Prop({ 
    type: {
      src: { type: String, required: true },
      srcset: { type: String }
    }, 
    required: true 
  })
  thumbnail: {
    src: string;
    srcset?: string;
  };

  @Prop({ type: Number, required: true })
  parent_article_column_id: number;
}

// 嵌套类：元标签
class MetaTag {
  @Prop({ type: String })
  name?: string;

  @Prop({ type: String })
  property?: string;

  @Prop({ type: String, required: true })
  content: string;
}

// 嵌套类：SEO元数据
class MetaInfo {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: [MetaTag], required: true })
  meta: MetaTag[];
}

// 主实体类
@Schema({
  collection: 'my903_content',
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      // ret.id = ret._id.toString();
      // delete ret._id;
      // delete ret.__v;
    }
  }
})
export class My903 {
  // MongoDB自动生成的ID（序列化时转为id）
  id: string;

  @Prop({ type: Number, required: true, unique: true, index: true })
  article_id: number;

  @Prop({ type: Number, required: true, index: true })
  article_type: number;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: Number, required: true })
  display_title: number;

  @Prop({ type: Number, required: true })
  article_author_id: number;

  @Prop({ type: Number, required: true, index: true })
  song_id: number;

  @Prop({ type: Number, required: true })
  article_highlight_type: number;

  @Prop({ type: Number, required: true })
  article_highlight_media_id: number;

  @Prop({ type: Number, required: true })
  thumbnail_media_id: number;

  @Prop({ type: Number, required: true })
  thumbnail_height: number;

  @Prop({ type: Number, required: true, index: true })
  status: number;

  @Prop({ type: String, required: true, index: true })
  schedule_ts: string;

  @Prop({ type: String, required: true })
  last_update_datetime: string;

  @Prop({ type: String, required: true, index: true })
  create_date: string;

  @Prop({ type: String, required: true })
  create_time: string;

  @Prop({ type: String, required: true })
  mod_ts: string;

  @Prop({ type: String, required: true })
  author: string;

  @Prop({ type: HighlightMedia, required: true })
  highlight_media: HighlightMedia;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: SongItem, required: true })
  song_item: SongItem;

  @Prop({ type: [String], required: true, index: true })
  tags: string[];

  @Prop({ 
    type: {
      src: { type: String, required: true },
      srcset: { type: String }
    }, 
    required: true 
  })
  thumbnail: {
    src: string;
    srcset?: string;
  };

  @Prop({ type: [Object], default: [] })
  related_articles: any[];

  @Prop({ type: ArticleColumn, required: true })
  article_column: ArticleColumn;

  @Prop({ type: MetaInfo, required: true })
  meta: MetaInfo;
}

// 创建Schema
export const My903Schema = SchemaFactory.createForClass(My903);

// 添加复合索引优化查询
My903Schema.index({ create_date: -1, 'article_column.article_column_id': 1 });
My903Schema.index({ tags: 1, status: 1 });
    