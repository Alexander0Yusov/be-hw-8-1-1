import { LikeStatus } from '../../domain/like/like.entity';
import { ApiProperty } from '@nestjs/swagger';

export class NewestLikeDto {
  @ApiProperty({
    description: 'Date when like was added',
    example: '2026-02-17T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  addedAt: string;

  @ApiProperty({ description: 'User id who liked', example: '42' })
  userId: string;

  @ApiProperty({ description: 'User login', example: 'john_doe' })
  login: string;
}

export class ExtendedLikesInfoDto {
  @ApiProperty({ description: 'Number of likes', example: 10 })
  likesCount: number;

  @ApiProperty({ description: 'Number of dislikes', example: 2 })
  dislikesCount: number;

  @ApiProperty({
    description: 'Current user like status',
    enum: LikeStatus,
    example: LikeStatus.None,
  })
  myStatus: LikeStatus;

  @ApiProperty({ description: 'Newest likes', type: [NewestLikeDto] })
  newestLikes: NewestLikeDto[];
}

export class PostViewDto {
  @ApiProperty({ description: 'Post id', example: '1' })
  id: string;

  @ApiProperty({ description: 'Post title', example: 'My first post' })
  title: string;

  @ApiProperty({ description: 'Short description', example: 'Short summary' })
  shortDescription: string;

  @ApiProperty({
    description: 'Full content',
    example: 'Post content goes here',
  })
  content: string;

  @ApiProperty({ description: 'Associated blog id', example: '1' })
  blogId: string;

  @ApiProperty({ description: 'Blog name', example: 'My Blog' })
  blogName: string;

  @ApiProperty({
    description: 'Creation date',
    type: String,
    format: 'date-time',
    example: '2026-02-17T12:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Likes-related information',
    type: ExtendedLikesInfoDto,
  })
  extendedLikesInfo: ExtendedLikesInfoDto;

  static mapToView(data: any): PostViewDto {
    return {
      id: String(data.id),
      title: data.title,
      shortDescription: data.shortDescription,
      content: data.content,
      blogId: String(data.blogId),
      blogName: data.blogName,
      createdAt: data.createdAt
        ? data.createdAt instanceof Date
          ? data.createdAt.toISOString()
          : new Date(data.createdAt).toISOString()
        : new Date().toISOString(),
      extendedLikesInfo: {
        likesCount: data.likesCount,
        dislikesCount: data.dislikesCount,
        myStatus: LikeStatus.None,
        newestLikes: data.newestLikes,
      },
    } as PostViewDto;
  }
}
