import {
    IsString,
    IsBoolean,
    IsNumber,
    IsOptional,
    IsArray,
    ValidateNested,
    IsUrl,
    IsNotEmpty,
    IsPositive,
    IsObject,
    Matches
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 图片场景信息子DTO（区分预览图/默认图）
 */
class ImageSceneInfoDTO {
    /** 图片场景类型（如 WB_PRV：预览图，WB_DFT：默认图） */
    @IsString()
    @Matches(/^WB_(PRV|DFT)$/, {
        message: 'imageScene 必须是 "WB_PRV" 或 "WB_DFT"',
    })
    imageScene: 'WB_PRV' | 'WB_DFT';

    /** 场景对应的图片URL */
    @IsUrl({}, { message: 'url 必须是合法的URL地址' })
    url: string;
}

/**
 * 视频流（H264格式）子DTO
 */
class VideoStreamH264DTO {
    /** 视频主地址 */
    @IsUrl({}, { message: 'masterUrl 必须是合法的URL地址' })
    masterUrl: string;

    /** 视频备份地址列表 */
    @IsArray()
    @IsUrl({}, { each: true, message: 'backupUrls 每项必须是合法的URL地址' })
    backupUrls: string[];
}

/**
 * 视频流信息子DTO（包含多种编码格式）
 */
class ImageStreamDTO {
    /** H264编码视频（主流格式，必填） */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VideoStreamH264DTO)
    h264: VideoStreamH264DTO[];

    /** H265编码视频（可选，高效压缩格式） */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VideoStreamH264DTO)
    @IsOptional()
    h265?: VideoStreamH264DTO[];

    /** H266编码视频（可选，新一代格式） */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VideoStreamH264DTO)
    @IsOptional()
    h266?: VideoStreamH264DTO[];

    /** AV1编码视频（可选，开源格式） */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VideoStreamH264DTO)
    @IsOptional()
    av1?: VideoStreamH264DTO[];
}

/**
 * 图片/视频资源子DTO（小红书支持"实况照片"，含图片+视频）
 */
class ImageItemDTO {
    /** 文件ID（可选，后端存储标识） */
    @IsString()
    @IsOptional()
    fileId?: string;

    /** 图片高度（像素） */
    @IsNumber()
    @IsPositive({ message: 'height 必须是正整数' })
    height: number;

    /** 图片场景列表（预览+默认） */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImageSceneInfoDTO)
    @IsNotEmpty({ message: 'infoList 不能为空数组' })
    infoList: ImageSceneInfoDTO[];

    /** 预览图URL（快捷访问字段） */
    @IsUrl({}, { message: 'urlPre 必须是合法的URL地址' })
    urlPre: string;

    /** 视频流信息（实况照片专属） */
    @IsObject()
    @ValidateNested()
    @Type(() => ImageStreamDTO)
    stream: ImageStreamDTO;

    /** 图片宽度（像素） */
    @IsNumber()
    @IsPositive({ message: 'width 必须是正整数' })
    width: number;

    /** 备用URL（可选） */
    @IsString()
    @IsOptional()
    url?: string;

    /** 追踪ID（可选，日志/埋点用） */
    @IsString()
    @IsOptional()
    traceId?: string;

    /** 默认图URL */
    @IsUrl({}, { message: 'urlDefault 必须是合法的URL地址' })
    urlDefault: string;

    /** 是否为实况照片（true：含视频，false：纯图片） */
    @IsBoolean()
    livePhoto: boolean;
}

/**
 * 用户信息子DTO
 */
class UserInfoDTO {
    /** 用户ID（小红书唯一标识） */
    @IsString()
    @IsNotEmpty({ message: 'userId 不能为空' })
    userId: string;

    /** 用户昵称 */
    @IsString()
    @IsNotEmpty({ message: 'nickname 不能为空' })
    nickname: string;

    /** 用户头像URL */
    @IsUrl({}, { message: 'avatar 必须是合法的URL地址' })
    avatar: string;

    /** 用户XSEC令牌（身份验证用） */
    @IsString()
    @IsNotEmpty({ message: 'xsecToken 不能为空' })
    xsecToken: string;
}

/**
 * 互动信息子DTO（点赞/收藏/评论等）
 */
class InteractInfoDTO {
    /** 当前用户是否已收藏（创建时默认false） */
    @IsBoolean()
    @IsOptional()
    collected?: boolean = false;

    /** 总收藏数（创建时默认0，后端维护） */
    @IsString()
    @IsOptional()
    collectedCount?: string = '0';

    /** 总评论数（创建时默认0，后端维护） */
    @IsString()
    @IsOptional()
    commentCount?: string = '0';

    /** 总分享数（创建时默认0，后端维护） */
    @IsString()
    @IsOptional()
    shareCount?: string = '0';

    /** 当前用户是否已关注作者（创建时默认false） */
    @IsBoolean()
    @IsOptional()
    followed?: boolean = false;

    /** 用户与作者的关系（none：无关系，创建时默认none） */
    @IsString()
    @Matches(/^(none|follower|following|mutual)$/, {
        message: 'relation 必须是 "none"、"follower"、"following" 或 "mutual"',
    })
    @IsOptional()
    relation?: 'none' | 'follower' | 'following' | 'mutual' = 'none';

    /** 当前用户是否已点赞（创建时默认false） */
    @IsBoolean()
    @IsOptional()
    liked?: boolean = false;

    /** 总点赞数（创建时默认0，后端维护） */
    @IsString()
    @IsOptional()
    likedCount?: string = '0';
}

/**
 * 分享设置子DTO
 */
class ShareInfoDTO {
    /** 是否禁止分享（false：允许分享，true：禁止分享） */
    @IsBoolean()
    unShare: boolean;
}

/**
 * 小红书笔记创建DTO（核心请求体）
 */
export class CreateRedNoteDTO {
    /** 笔记XSEC令牌（身份验证用，与用户token可能不同） */
    @IsString()
    @IsNotEmpty({ message: 'xsecToken 不能为空' })
    xsecToken: string;

    /** 分享设置 */
    @IsObject()
    @ValidateNested()
    @Type(() => ShareInfoDTO)
    shareInfo: ShareInfoDTO;

    /** 笔记标题（必填，吸引用户点击） */
    @IsString()
    @IsNotEmpty({ message: 'title 不能为空' })
    title: string;

    /** 作者信息（创建者） */
    @IsObject()
    @ValidateNested()
    @Type(() => UserInfoDTO)
    user: UserInfoDTO;

    /** 图片/视频资源列表（至少1项，小红书笔记核心内容） */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ImageItemDTO)
    @IsNotEmpty({ message: 'imageList 不能为空数组' })
    imageList: ImageItemDTO[];

    /** 笔记标签列表（可选，用于分类和推荐） */
    @IsArray()
    @IsString({ each: true, message: 'tagList 每项必须是字符串' })
    @IsOptional()
    tagList?: string[] = [];

    /** @用户列表（可选，提及其他用户） */
    @IsArray()
    @IsString({ each: true, message: 'atUserList 每项必须是字符串（用户ID）' })
    @IsOptional()
    atUserList?: string[] = [];

    /** 笔记发布时间（时间戳，毫秒级，可选，后端可自动填充） */
    @IsNumber()
    @IsOptional()
    time?: number = Date.now();

    /** 笔记最后更新时间（可选，后端维护） */
    @IsNumber()
    @IsOptional()
    lastUpdateTime?: number = Date.now();

    /** 笔记ID（可选，后端生成唯一标识，创建时无需传） */
    @IsString()
    @IsOptional()
    noteId?: string;

    /** 笔记类型（normal：普通笔记，可选，默认normal） */
    @IsString()
    @Matches(/^(normal|repost|live|product)$/, {
        message: 'type 必须是 "normal"、"repost"、"live" 或 "product"',
    })
    @IsOptional()
    type?: 'normal' | 'repost' | 'live' | 'product' = 'normal';

    /** 笔记描述（正文内容，必填） */
    @IsString()
    @IsNotEmpty({ message: 'desc 不能为空' })
    desc: string;

    /** 互动信息（可选，创建时无需传，后端初始化默认值） */
    @IsObject()
    @ValidateNested()
    @Type(() => InteractInfoDTO)
    @IsOptional()
    interactInfo?: InteractInfoDTO = new InteractInfoDTO();
}