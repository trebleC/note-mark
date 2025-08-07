import { IsString, IsNumber, IsUrl, IsOptional, IsArray, ArrayMinSize, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 媒体资源信息（封面图等）
 */
class MediaDto {
  @ApiProperty({ description: '媒体ID', example: 16675 })
  @IsNumber()
  media_id: number;

  @ApiProperty({ description: '媒体类型（3表示图片）', example: 3 })
  @IsNumber()
  media_type: number;

  @ApiProperty({ description: '资源URL', example: 'https://stream.881903.com/public/.../cover.jpg' })
  @IsUrl()
  src: string;

  @ApiPropertyOptional({ description: '不同分辨率资源集合', example: 'https://stream.881903.com/.../cover.jpg 3x' })
  @IsOptional()
  @IsString()
  srcset?: string;
}

/**
 * 歌曲详情信息
 */
class SongItemDto {
  @ApiProperty({ description: '歌曲ID', example: 11718 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '歌曲名称', example: '叫吧！大笨蛋（社恐版）' })
  @IsString()
  name: string;

  @ApiProperty({ description: '歌曲描述（带HTML格式）', example: '<p>【歌曲簡介】</p><p>沒有109位陪伴者...</p>' })
  @IsString()
  description: string;

  @ApiProperty({ description: '歌手列表', example: ['黃妍'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  singer_list: string[];

  @ApiProperty({ description: '作曲人列表', example: ['黃妍'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  composer_list: string[];

  @ApiProperty({ description: '编曲人列表', example: ['鄺梓喬@emp'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  arranger_list: string[];

  @ApiProperty({ description: '作词人列表', example: ['王樂儀'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  lyricist_list: string[];

  @ApiProperty({ description: '制作人列表', example: ['鄺梓喬@emp'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  producer_list: string[];
}

/**
 * 栏目信息
 */
class ArticleColumnDto {
  @ApiProperty({ description: '栏目ID', example: 9 })
  @IsNumber()
  article_column_id: number;

  @ApiProperty({ description: '栏目名称', example: '派台歌' })
  @IsString()
  name: string;

  @ApiProperty({ description: '栏目描述（带HTML格式）', example: '<p>即睇商業二台叱咤903最新派台歌曲...</p>' })
  @IsString()
  description: string;

  @ApiProperty({ description: '栏目状态（1表示启用）', example: 1 })
  @IsNumber()
  article_column_status: number;

  @ApiProperty({ description: '栏目缩略图' })
  @IsObject()
  thumbnail: MediaDto;

  @ApiProperty({ description: '父栏目ID', example: 2 })
  @IsNumber()
  parent_article_column_id: number;
}

/**
 * 元数据信息（SEO相关）
 */
class MetaDto {
  @ApiProperty({ description: '页面标题', example: '黃妍 - 叫吧！大笨蛋（社恐版）｜派台歌｜my903.com' })
  @IsString()
  title: string;

  @ApiProperty({ description: '元标签集合', example: [{ name: 'description', content: '黃妍 - 叫吧！大笨蛋...' }] })
  @IsArray()
  @ArrayMinSize(1)
  meta: Array<{
    name?: string;
    property?: string;
    content: string;
  }>;
}

/**
 * 创建My903音乐内容的DTO
 */
export class CreateMy903Dto {
  @ApiProperty({ description: '文章ID', example: 5383 })
  @IsNumber()
  article_id: number;

  @ApiProperty({ description: '文章类型（2表示歌曲详情）', example: 2 })
  @IsNumber()
  article_type: number;

  @ApiProperty({ description: '内容标题', example: '黃妍 - 叫吧！大笨蛋（社恐版）' })
  @IsString()
  title: string;

  @ApiProperty({ description: '封面图片地址', example: '/my903/hexagon.png' })
  @IsOptional()
  @IsString()
  cover: string;

  @ApiProperty({ description: '是否显示标题（1表示显示）', example: 1 })
  @IsNumber()
  display_title: number;

  @ApiProperty({ description: '作者ID', example: 11 })
  @IsNumber()
  article_author_id: number;

  @ApiProperty({ description: '关联歌曲ID', example: 11718 })
  @IsNumber()
  song_id: number;

  @ApiProperty({ description: '高亮类型', example: 1 })
  @IsNumber()
  article_highlight_type: number;

  @ApiProperty({ description: '高亮媒体ID', example: 16675 })
  @IsNumber()
  article_highlight_media_id: number;

  @ApiProperty({ description: '缩略图媒体ID', example: 16675 })
  @IsNumber()
  thumbnail_media_id: number;

  @ApiProperty({ description: '缩略图高度（px）', example: 900 })
  @IsNumber()
  thumbnail_height: number;

  @ApiProperty({ description: '内容状态（1表示发布）', example: 1 })
  @IsNumber()
  status: number;

  @ApiProperty({ description: '排期时间', example: '2025-08-04 18:43:00' })
  @IsString()
  schedule_ts: string;

  @ApiProperty({ description: '最后更新时间', example: '2025-08-04 18:43:00' })
  @IsString()
  last_update_datetime: string;

  @ApiProperty({ description: '创建日期', example: '2025-08-04' })
  @IsString()
  create_date: string;

  @ApiProperty({ description: '创建时间', example: '18:43:52' })
  @IsString()
  create_time: string;

  @ApiProperty({ description: '修改时间戳', example: '2025-08-04 18:43:55' })
  @IsString()
  mod_ts: string;

  @ApiProperty({ description: '作者名称', example: '派台歌' })
  @IsString()
  author: string;

  @ApiProperty({ description: '高亮媒体信息' })
  @IsObject()
  highlight_media: MediaDto;

  @ApiProperty({ description: '内容详情（包含简介和歌词）', example: '黃妍 - 叫吧！大笨蛋（社恐版） 叫吧！大笨蛋（社恐版）...' })
  @IsString()
  content: string;

  @ApiProperty({ description: '歌曲详情信息' })
  @IsObject()
  song_item: SongItemDto;

  @ApiProperty({ description: '标签列表', example: ['my903', '派台歌', '黃妍'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ description: '缩略图信息' })
  @IsObject()
  thumbnail: Omit<MediaDto, 'media_id' | 'media_type'>; // 缩略图无需媒体ID和类型

  @ApiPropertyOptional({ description: '相关文章列表', example: [] })
  @IsOptional()
  @IsArray()
  related_articles?: any[]; // 可根据实际结构细化

  @ApiProperty({ description: '所属栏目信息' })
  @IsObject()
  article_column: ArticleColumnDto;

  @ApiProperty({ description: '元数据（SEO相关）' })
  @IsObject()
  meta: MetaDto;
}
